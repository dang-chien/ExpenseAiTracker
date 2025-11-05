const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// Đánh giá chi tiêu tháng trước 

exports.evaluateExpensesAi = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/evaluate`, req.body);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error evaluating expenses", error: error.message });
    } 
};

// Dự đoán chi tiêu tháng hiện tại
exports.predictExpensesAi = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/predict`, req.body);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error predicting expenses", error: error.message });
    }
};

// Đề xuất kế hoạch chi tiêu tháng tới
exports.suggestExpenseAi = async (req, res) => {
    try {
        const response = await axios.post(`${AI_SERVICE_URL}/suggest`, req.body);   
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error suggesting expenses", error: error.message });
    };
};