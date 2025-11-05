import pandas as pd
import numpy as np
from datetime import datetime         
from dateutil.relativedelta import relativedelta
from sklearn.ensemble import RandomForestRegressor
from scipy.optimize import linprog
import warnings

warnings.filterwarnings("ignore")

# 1️⃣ Category classification (Không đổi)
def classify_category(category):
    necessary = ["Rent/Mortgage", "Utilities", "Groceries", "Transportation", "Insurance", "Healthcare"]
    unnecessary = ["Entertainment", "Shopping"]

    if category in necessary:
        return "Necessary"
    elif category in unnecessary:
        return "Unnecessary"
    else:
        return "Other"

# 2️⃣ Evaluate expenses (ĐÃ SỬA)
# Xóa 'month_year' khỏi tham số
def evaluate_expenses(df, monthly_budget=2000, monthly_income=3000, prev_total_expenses=1800):
    """
    Đánh giá chi tiêu cho tháng trước đó (tự động).
    """
    try:
        # TỰ ĐỘNG LẤY THÁNG TRƯỚC ĐỂ ĐÁNH GIÁ
        today = datetime.now()
        last_month_date = today - relativedelta(months=1)
        month_year_to_eval = last_month_date.strftime('%Y-%m')
        
        df['date'] = pd.to_datetime(df['date'])
        # Sử dụng tháng đã tính toán
        df_month = df[df['date'].dt.strftime('%Y-%m') == month_year_to_eval]
        
        if df_month.empty:
            # Cập nhật thông báo lỗi
            return {"error": f"Không tìm thấy dữ liệu cho tháng trước ({month_year_to_eval})"}

        total_expenses = df_month['amount'].sum()
        df_month['type'] = df_month['category'].apply(classify_category)
        necessary_sum = df_month[df_month['type'] == 'Necessary']['amount'].sum()
        unnecessary_sum = df_month[df_month['type'] == 'Unnecessary']['amount'].sum()
        unnecessary_ratio = unnecessary_sum / total_expenses if total_expenses > 0 else 0
        category_status = "Good" if unnecessary_ratio <= 0.3 else "Too much unnecessary spending"

        budget_status = "Good" if total_expenses <= monthly_budget else "Exceeded"
        trend = (total_expenses - prev_total_expenses) / prev_total_expenses if prev_total_expenses > 0 else 0
        trend_status = "Decreased" if trend < 0 else "Increased" if trend > 0 else "Stable"

        savings_ratio = 1 - (total_expenses / monthly_income) if monthly_income > 0 else 0
        savings_status = "Good" if savings_ratio >= 0.2 else "Low"

        category_summary = df_month.groupby('category')['amount'].sum().sort_values(ascending=False)
        
        # Thêm kiểm tra nếu category_summary rỗng
        if category_summary.empty:
            top_category = "N/A"
            top_ratio = 0
            top_status = "Normal"
        else:
            top_category = category_summary.index[0]
            top_ratio = category_summary.iloc[0] / total_expenses if total_expenses > 0 else 0
            top_status = "Warning" if top_ratio > 0.3 else "Normal"

        score = sum([
            budget_status == "Good",
            category_status == "Good",
            trend_status in ["Decreased", "Stable"],
            savings_status == "Good",
            top_status == "Normal"
        ])
        overall_status = (
            "Good" if score >= 4 else
            "Needs improvement" if score >= 2 else
            "Poor"
        )

        return {
            "month_evaluated": month_year_to_eval, # Thêm thông tin tháng nào được đánh giá
            "total_expenses": total_expenses,
            "budget_status": budget_status,
            "unnecessary_ratio": f"{unnecessary_ratio:.2%}",
            "category_status": category_status,
            "trend": f"{trend:.2%} ({trend_status})",
            "savings_ratio": f"{savings_ratio:.2%} ({savings_status})",
            "top_category": f"{top_category} ({top_ratio:.2%}) - {top_status}",
            "overall_status": overall_status,
            "category_summary": category_summary.to_dict()
        }

    except Exception as e:
        return {"error": str(e)}

# 3️⃣ Prediction (ĐÃ SỬA)
def predict_next_month_by_group(df):
    """
    Dự đoán chi tiêu cho THÁNG HIỆN TẠI
    dựa trên tất cả dữ liệu lịch sử TRƯỚC ngày 1 của tháng này.
    """
    try:
        # LẤY MỐC THỜI GIAN HIỆN TẠI
        today = datetime.now()
        first_of_current_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        df['date'] = pd.to_datetime(df['date'])
        
        # LỌC DỮ LIỆU: Chỉ sử dụng dữ liệu TRƯỚC tháng hiện tại
        df_historical = df[df['date'] < first_of_current_month].copy()
        
        if df_historical.empty:
            return pd.DataFrame([{"error": "Không có dữ liệu lịch sử (trước tháng này) để dự đoán."}])

        # Thực hiện trên df_historical
        df_historical['group'] = df_historical['category'].apply(classify_category)
        df_historical['month'] = df_historical['date'].dt.to_period('M')

        results = []
        # Thực hiện trên df_historical
        for group, group_data in df_historical.groupby('group'):
            monthly_sum = group_data.groupby('month')['amount'].sum().reset_index()
            monthly_sum['month'] = monthly_sum['month'].dt.to_timestamp()
            monthly_sum['month_num'] = (
                (monthly_sum['month'].dt.year - monthly_sum['month'].dt.year.min()) * 12 +
                (monthly_sum['month'].dt.month - monthly_sum['month'].dt.month.min())
            )

            if len(monthly_sum) < 3:
                results.append({
                    "group": group,
                    "predicted": monthly_sum['amount'].mean(),
                    "confidence": 0,
                    "message": "Not enough data (used mean)"
                })
                continue

            X = monthly_sum[['month_num']]
            y = monthly_sum['amount']
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X, y)

            last_date = monthly_sum['month'].max()
            next_month = last_date + relativedelta(months=1)
            next_month_num = (
                (next_month.year - monthly_sum['month'].dt.year.min()) * 12 +
                (next_month.month - monthly_sum['month'].dt.month.min())
            )

            predicted = model.predict([[next_month_num]])[0]
            residuals = y - model.predict(X)
            std = np.std(residuals)
            confidence = 1.96 * std

            # 🔍 Compare predicted vs last month spending
            last_month_value = y.iloc[-1]
            diff_ratio = (predicted - last_month_value) / last_month_value if last_month_value > 0 else 0

            # 🎯 Generate more diverse insights
            if diff_ratio > 0.2:
                trend = "increasing_strong"
                emoji = "🚨"
                # EN: Sharp increase — warning user
                # VI: Tăng mạnh — cảnh báo người dùng nên xem lại chi tiêu
                message = (
                    f"{emoji} Spending in **{group.lower()}** is projected to rise sharply (**+{diff_ratio:.1%}**) compared to last month. "
                    "This could strain your budget — consider reviewing or reducing non-essential expenses."
                )
            elif 0.05 < diff_ratio <= 0.2:
                trend = "increasing_mild"
                emoji = "📈"
                # EN: Slight increase — monitor spending
                # VI: Tăng nhẹ — nên theo dõi để tránh vượt ngân sách
                message = (
                    f"{emoji} Spending in **{group.lower()}** is expected to increase slightly (**+{diff_ratio:.1%}**). "
                    "Keep an eye on this category to ensure it stays within your limits."
                )
            elif -0.2 <= diff_ratio < -0.05:
                trend = "decreasing_mild"
                emoji = "📉"
                # EN: Mild decrease — good progress
                # VI: Giảm nhẹ — dấu hiệu tích cực, nên duy trì
                message = (
                    f"{emoji} Spending in **{group.lower()}** shows a moderate decrease (**{diff_ratio:.1%}**). "
                    "Good progress — maintaining this trend can improve your savings rate."
                )
            elif diff_ratio < -0.2:
                trend = "decreasing_strong"
                emoji = "💪"
                # EN: Strong decrease — excellent result
                # VI: Giảm mạnh — kết quả rất tốt, người dùng kiểm soát chi tiêu hiệu quả
                message = (
                    f"{emoji} Excellent! Spending in **{group.lower()}** is projected to drop significantly (**{abs(diff_ratio):.1%}**). "
                    "You're managing your budget efficiently — keep it up!"
                )
            else:
                trend = "stable"
                emoji = "⚖️"
                # EN: Stable — consistent spending
                # VI: Ổn định — chi tiêu đều đặn, tốt cho quản lý tài chính lâu dài
                message = (
                    f"{emoji} Spending in **{group.lower()}** is expected to remain stable, with no major fluctuations. "
                    "Consistency is a key part of financial stability."
                )

            results.append({
                "group": group,
                "predicted": round(predicted, 2),
                "confidence": round(confidence, 2),
                "trend": trend,
                "emoji": emoji,
                "message": message
            })
        return pd.DataFrame(results)
    except Exception as e:
        return pd.DataFrame([{"error": str(e)}])
    
def suggest_expense_reduction(predicted_df, income, max_exceed_ratio=0.0):
    """
    🔮 Đề xuất cắt giảm chi tiêu thông minh.
    Sửa đổi để trả về (return) một dictionary thay vì in ra.
    """
    try:
        total_pred = predicted_df["predicted"].sum()
        allowed_budget = income * (1 + max_exceed_ratio)

        if total_pred <= allowed_budget:
            predicted_df["target"] = predicted_df["predicted"].round(2)
            predicted_df["reduction_percent"] = 0.0
        else:
            preds = predicted_df["predicted"].values
            groups = predicted_df["group"].values

            weights = []
            for g in groups:
                weights.append(3 if g == "Necessary" else 2 if g == "Other" else 1)

            c = [-w for w in weights]
            A = [preds]
            b = [allowed_budget]

            bounds = []
            for g in groups:
                if g == "Necessary":
                    bounds.append((0.75, 1.0))
                elif g == "Other":
                    bounds.append((0.6, 1.0))
                else:
                    bounds.append((0.4, 1.0))

            res = linprog(c, A_ub=A, b_ub=b, bounds=bounds, method="highs")

            if res.success:
                predicted_df["ratio"] = res.x
                mean_ratio = np.mean(res.x)
                predicted_df["ratio"] = predicted_df["ratio"].apply(
                    lambda r: (r * 0.7 + mean_ratio * 0.3)
                )
                predicted_df["target"] = (predicted_df["predicted"] * predicted_df["ratio"]).round(2)
                predicted_df["reduction_percent"] = ((1 - predicted_df["ratio"]) * 100).round(2)
            else:
                predicted_df["target"] = predicted_df["predicted"]
                predicted_df["reduction_percent"] = 0.0

        suggestion_map = {
            "Necessary": "Giữ mức tối thiểu để không ảnh hưởng sinh hoạt",
            "Other": "Giảm hợp lý, ưu tiên chi tiêu có kế hoạch",
            "Unnecessary": "Ưu tiên cắt mạnh, tránh vượt ngân sách"
        }
        predicted_df["suggestion"] = predicted_df["group"].map(suggestion_map)

        total_target = predicted_df["target"].sum()
        overshoot_percent = ((total_target - income) / income) * 100

        # Chuyển các cột không cần thiết cho JSON
        result_df = predicted_df.drop(columns=["confidence", "message", "ratio"], errors='ignore')

        return {
            "suggestions": result_df.to_dict(orient="records"),
            "total_predicted": round(total_pred, 2),
            "total_target": round(total_target, 2),
            "total_reduction": round(total_pred - total_target, 2),
            "overshoot_percent_vs_income": round(overshoot_percent, 2),
            "income": income
        }
    except Exception as e:
        return {"error": str(e)}