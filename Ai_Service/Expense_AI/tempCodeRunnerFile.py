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