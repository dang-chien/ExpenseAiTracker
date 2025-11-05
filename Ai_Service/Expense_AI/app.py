from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from expenses_model import evaluate_expenses, predict_next_month_by_group, suggest_expense_reduction
import numpy as np

app = Flask(__name__)
CORS(app)

def convert_types(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    elif isinstance(obj, dict):
        return {k: convert_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_types(i) for i in obj]
    else:
        return obj
    
@app.route('/')
def home():
    return jsonify({"message": "Expense Prediction API is running 🚀"})

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.get_json()
    if not data or 'records' not in data:
        return jsonify({"error": "Missing 'records' field"}), 400

    df = pd.DataFrame(data['records'])
    
    budget = data.get('budget', 2000)
    income = data.get('income', 3000)
    prev_expenses = data.get('prev_expenses', 1800)

    # Cập nhật lời gọi hàm, bỏ 'month_year'
    result = evaluate_expenses(df, budget, income, prev_expenses)
    result = convert_types(result)
    return jsonify(result)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'records' not in data:
        return jsonify({"error": "Missing 'records' field"}), 400

    df = pd.DataFrame(data['records'])
    result = convert_types(predict_next_month_by_group(df))
    return jsonify(result.to_dict(orient="records"))

@app.route('/suggest', methods=['POST'])
def suggest():
    data = request.get_json()
    if not data or 'predictions' not in data or 'income' not in data:
        return jsonify({"error": "Missing 'predictions' or 'income' field"}), 400

    try:
        # 1. Lấy dữ liệu dự đoán (từ /predict)
        predictions_list = data['predictions']
        predicted_df = pd.DataFrame(predictions_list)
        
        # 2. Lấy thu nhập
        income = data.get('income')

        # 3. Gọi hàm đề xuất
        result = convert_types(suggest_expense_reduction(predicted_df, income))
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)