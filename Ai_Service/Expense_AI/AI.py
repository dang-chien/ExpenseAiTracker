import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sklearn.ensemble import RandomForestRegressor
from scipy.optimize import linprog
import warnings


warnings.filterwarnings("ignore")

# -----------------------------------
# 1️⃣ Category Classification (Không đổi)
# -----------------------------------
def classify_category(category):
    necessary = [
        "Rent/Mortgage", "Utilities", "Groceries",
        "Transportation", "Insurance", "Healthcare"
    ]
    unnecessary = ["Entertainment", "Shopping"]

    if category in necessary:
        return "Necessary"
    elif category in unnecessary:
        return "Unnecessary"
    else:
        return "Other"


# -----------------------------------
# 2️⃣ Evaluate Expenses for the PREVIOUS Month (Đã cập nhật)
# -----------------------------------
def evaluate_expenses(
    df,
    monthly_budget=2000,
    monthly_income=3000,
    prev_total_expenses=1800
):
    """
    Đánh giá chi tiêu cho tháng trước đó.
    """
    try:
        # TỰ ĐỘNG LẤY THÁNG TRƯỚC ĐỂ ĐÁNH GIÁ
        today = datetime.now()
        last_month_date = today - relativedelta(months=1)
        month_year_to_eval = last_month_date.strftime('%Y-%m')
        
        df['date'] = pd.to_datetime(df['date'])
        df_month = df[df['date'].dt.strftime('%Y-%m') == month_year_to_eval]
        
        if df_month.empty:
            return {"error": f"Không tìm thấy dữ liệu cho tháng trước ({month_year_to_eval})"}

        total_expenses = df_month['amount'].sum()

        # 1. Budget comparison
        budget_status = "Good" if total_expenses <= monthly_budget else "Exceeded"

        # 2. Category type analysis
        df_month['type'] = df_month['category'].apply(classify_category)
        necessary_sum = df_month[df_month['type'] == 'Necessary']['amount'].sum()
        unnecessary_sum = df_month[df_month['type'] == 'Unnecessary']['amount'].sum()
        unnecessary_ratio = unnecessary_sum / total_expenses if total_expenses > 0 else 0
        category_status = "Good" if unnecessary_ratio <= 0.3 else "Too much unnecessary spending"

        # 3. Trend vs previous month (Lưu ý: prev_total_expenses này là của tháng TRƯỚC NỮA)
        trend = (total_expenses - prev_total_expenses) / prev_total_expenses if prev_total_expenses > 0 else 0
        trend_status = "Decreased" if trend < 0 else "Increased" if trend > 0 else "Stable"

        # 4. Savings ratio
        savings_ratio = 1 - (total_expenses / monthly_income) if monthly_income > 0 else 0
        savings_status = "Good" if savings_ratio >= 0.2 else "Low"

        # 5. Top spending category
        category_summary = df_month.groupby('category')['amount'].sum().sort_values(ascending=False)
        top_category = category_summary.index[0]
        top_ratio = category_summary.iloc[0] / total_expenses if total_expenses > 0 else 0
        top_status = "Warning" if top_ratio > 0.3 else "Normal"

        # Overall rating
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


# -----------------------------------
# 3️⃣ Predict CURRENT Month Expenses by Category Group (Đã cập nhật)
# -----------------------------------
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

        df_historical['group'] = df_historical['category'].apply(classify_category)
        df_historical['month'] = df_historical['date'].dt.to_period('M')

        results = []

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

            # Xác định tháng tiếp theo (là tháng hiện tại)
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

            results.append({
                "group": group,
                "predicted": round(predicted, 2),
                "confidence": round(confidence, 2),
                "message": "Prediction complete"
            })

        return pd.DataFrame(results)

    except Exception as e:
        return pd.DataFrame([{"error": str(e)}])


# -----------------------------------
# 4️⃣ Suggest Expense Reduction Based on Prediction (Không đổi)
# -----------------------------------


def suggest_expense_reduction(predicted_df, income, max_exceed_ratio=0.0):
    """
    🔮 Smart Expense Reduction Suggestion (Balanced Optimization)
    -------------------------------------------------------------
    - Dự đoán chi tiêu ban đầu đến từ mô hình AI hoặc thống kê - thể hiện chi phí ước tính của từng nhóm cho tháng tới
    - So sánh tổng chi tiêu dự đoán với thu nhập thực tế:
        + Nếu không ướt -> giữ nguyên
        + Nếu vượt -> kích hoạt thuật toán tối ưu để điều chỉnh
    - Biến quyết định trong bài toán là tỷ lệ giữ lại x_i cho từng nhóm chi tiêu (0–1).
        + Ví dụ: x_i = 0.8 nghĩa là giảm 20% chi cho nhóm đó. 
    - Mục tiêu là tối đa hóa tổng “giá trị ưu tiên giữ lại”:
        + Giữ lại nhiều nhất cho nhóm có độ quan trọng cao (weights lớn).
        + Cụ thể: maximize ∑(wᵢ * xᵢ)
        + Với wᵢ là trọng số phản ánh mức độ quan trọng của nhóm:
            * Necessary: 3
            * Other: 2
            * Unnecessary: 1
        + Ràng buộc:
            * ∑(predictedᵢ * xᵢ) ≤ allowed_budget (tổng chi không vượt ngân sách)
            * Mỗi xᵢ bị giới hạn trong khoảng [min, 1] tùy nhóm (mức giảm tối đa):
                ~ Necessary ≥ 0.75 (giảm tối đa 25%)
                ~ Other ≥ 0.6 (giảm tối đa 40%)
                ~ Unnecessary ≥ 0.4 (giảm tối đa 60%)
    - Làm mượt kết quả:
        + Sau khi solver tìm được nghiệm tối ưu x_i, thường sẽ có tình huống:
            * Một nhóm bị cắt cực mạnh (vì solver chọn biên thấp nhất),
            * Trong khi nhóm khác gần như không giảm.
        + Để tránh tình trạng này, ta áp dụng kỹ thuật làm mượt:
            * xi′​=0.7⋅xi​+0.3⋅mean(x)
    """

    total_pred = predicted_df["predicted"].sum()
    allowed_budget = income * (1 + max_exceed_ratio)

    if total_pred <= allowed_budget:
        predicted_df["target"] = predicted_df["predicted"].round(2)
        predicted_df["reduction%"] = 0.0
    else:
        preds = predicted_df["predicted"].values
        groups = predicted_df["group"].values

        # ⚖️ Trọng số ưu tiên
        weights = []
        for g in groups:
            if g == "Necessary":
                weights.append(3)
            elif g == "Other":
                weights.append(2)
            else:
                weights.append(1)

        # 🎯 Mục tiêu: maximize ∑(w_i * x_i) → minimize -∑(w_i * x_i)
        c = [-w for w in weights]

        # Ràng buộc tổng chi ≤ allowed_budget
        A = [preds]
        b = [allowed_budget]

        # Giới hạn tỉ lệ giảm từng nhóm
        bounds = []
        for g in groups:
            if g == "Necessary":
                bounds.append((0.75, 1.0))  # giảm tối đa 25%
            elif g == "Other":
                bounds.append((0.6, 1.0))   # giảm tối đa 40%
            else:
                bounds.append((0.4, 1.0))   # giảm tối đa 60%

        # 🧠 Giải bài toán tuyến tính
        res = linprog(c, A_ub=A, b_ub=b, bounds=bounds, method="highs")

        if res.success:
            predicted_df["ratio"] = res.x

            # 🌿 Làm mượt phân bổ giảm — tránh 1 nhóm gánh hết
            mean_ratio = np.mean(res.x)
            predicted_df["ratio"] = predicted_df["ratio"].apply(
                lambda r: (r * 0.7 + mean_ratio * 0.3)
            )

            predicted_df["target"] = (predicted_df["predicted"] * predicted_df["ratio"]).round(2)
            predicted_df["reduction%"] = ((1 - predicted_df["ratio"]) * 100).round(2)
        else:
            predicted_df["target"] = predicted_df["predicted"]
            predicted_df["reduction%"] = 0.0

    # 💬 Gợi ý hành động
    suggestion_map = {
        "Necessary": "Giữ mức tối thiểu để không ảnh hưởng sinh hoạt",
        "Other": "Giảm hợp lý, ưu tiên chi tiêu có kế hoạch",
        "Unnecessary": "Ưu tiên cắt mạnh, tránh vượt ngân sách"
    }
    predicted_df["suggestion"] = predicted_df["group"].map(suggestion_map)

    # 📊 Tổng kết
    total_target = predicted_df["target"].sum()
    overshoot = ((total_target - income) / income) * 100

    print(f"\n💡 Recommended Expense Adjustment (Income = {income}):\n")
    print(predicted_df[["group", "predicted", "target", "reduction%", "suggestion"]]
          .to_string(index=False))
    print("──────────────────────────────────────────────────────────────")
    print(f"🎯 Total Target: {total_target:.2f}  ({overshoot:+.2f}% vs income)\n")

    return predicted_df.to_dict(orient="records")



# -----------------------------------
# 5️⃣ Example Usage (Đã cập nhật)
# -----------------------------------
if __name__ == "__main__":
    # Dữ liệu mẫu (giả sử hôm nay là ngày 03 tháng 11 năm 2025)
    # Dữ liệu này kéo dài đến tháng 10 năm 2025
    data = {
        "date": [
            "2024-05-02", "2024-05-05", "2024-05-10", "2024-05-15", "2024-05-20", "2024-05-25",
            "2024-06-01", "2024-06-05", "2024-06-10", "2024-06-15", "2024-06-20", "2024-06-25",
            "2024-07-02", "2024-07-06", "2024-07-12", "2024-07-18", "2024-07-24", "2024-07-28",
            "2024-08-01", "2024-08-05", "2024-08-10", "2024-08-15", "2024-08-20", "2024-08-25",
            "2024-09-01", "2024-09-05", "2024-09-10", "2024-09-15", "2024-09-20", "2024-09-25",
            "2024-10-01", "2024-10-05", "2024-10-10", "2024-10-15", "2024-10-20", "2024-10-25",
            "2024-11-01", "2024-11-05", "2024-11-10", "2024-11-15", "2024-11-20", "2024-11-25",
            "2024-12-01", "2024-12-05", "2024-12-10", "2024-12-15", "2024-12-20", "2024-12-25",
            "2025-01-02", "2025-01-05", "2025-01-10", "2025-01-15", "2025-01-20", "2025-01-25",
            "2025-02-01", "2025-02-05", "2025-02-10", "2025-02-15", "2025-02-20", "2025-02-25",
            "2025-03-01", "2025-03-05", "2025-03-10", "2025-03-15", "2025-03-20", "2025-03-25",
            "2025-04-01", "2025-04-05", "2025-04-10", "2025-04-15", "2025-04-20", "2025-04-25",
            "2025-05-01", "2025-05-05", "2025-05-10", "2025-05-15", "2025-05-20", "2025-05-25",
            "2025-06-01", "2025-06-05", "2025-06-10", "2025-06-15", "2025-06-20", "2025-06-25",
            "2025-07-01", "2025-07-05", "2025-07-10", "2025-07-15", "2025-07-20", "2025-07-25",
            "2025-08-01", "2025-08-05", "2025-08-10", "2025-08-15", "2025-08-20", "2025-08-25",
            "2025-09-01", "2025-09-05", "2025-09-10", "2025-09-15", "2025-09-20", "2025-09-25",
            "2025-10-01", "2025-10-05", "2025-10-10", "2025-10-15", "2025-10-20", "2025-10-25",
            "2025-11-01", "2025-11-02", "2025-11-03",
        ],
        "amount": [
            750, 1200, 300, 400, 150, 200,
            820, 1250, 450, 350, 180, 250,
            780, 1280, 420, 380, 160, 210,
            800, 1300, 500, 390, 190, 220,
            880, 1350, 530, 410, 200, 240,
            900, 1400, 550, 420, 230, 260, # 2024-10
            910, 1420, 560, 430, 240, 270,
            920, 1450, 570, 440, 250, 280,
            930, 1460, 580, 445, 255, 285,
            940, 1470, 590, 450, 260, 290,
            950, 1480, 600, 455, 265, 295,
            960, 1490, 610, 460, 270, 300,
            970, 1500, 620, 465, 275, 305,
            980, 1510, 630, 470, 280, 310,
            990, 1520, 640, 475, 285, 315,
            1000, 1530, 650, 480, 290, 320,
            1010, 1540, 660, 485, 295, 325,
            1020, 1550, 670, 490, 300, 330, # 2025-10
            1030, 50, 120,
        ],
        "category": [
            "Groceries", "Rent/Mortgage", "Entertainment", "Shopping", "Utilities", "Other",
        ] * 18 + [
            "Groceries", "Entertainment", "Shopping"
        ]
    }

    df_sample = pd.DataFrame(data)

    # ĐÁNH GIÁ THÁNG TRƯỚC (Tháng 10/2025, vì hôm nay là T11/2025)
    # Giả sử chi tiêu của tháng 09/2025 là 4200 (để so sánh xu hướng)
    evaluation = evaluate_expenses(df_sample, monthly_budget=4500, monthly_income=5000, prev_total_expenses=4200)
    print("\n📊 Đánh giá chi tiêu (Tháng trước):")
    for k, v in evaluation.items():
        if k != "category_summary":
            print(f"{k}: {v}")

    # DỰ ĐOÁN CHO THÁNG HIỆN TẠI (Tháng 11/2025)
    # Sẽ dùng tất cả dữ liệu đến hết tháng 10/2025 để dự đoán
    print("\n🔮 Dự đoán chi tiêu (Tháng hiện tại):")
    prediction = predict_next_month_by_group(df_sample)
    print(prediction)

    # 💡 Lập kế hoạch điều chỉnh chi tiêu
    # Giả sử thu nhập tháng này là 5000
    suggest_expense_reduction(prediction, income=5000)