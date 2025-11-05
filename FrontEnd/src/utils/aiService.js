import axios from "axios";


const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:5000";

export const predictExpenses = async (expenses) => {
  try {
    console.log("🔍 Sending data to AI service for prediction...", expenses);
    const records = {
      records: expenses.map((expense) => ({
        date: expense.date ? expense.date.split("T")[0] : null,
        amount: expense.amount,
        category: expense.categoryId.name,
      })),
    }

    
    console.log("📊 Formatted records for AI service:", records);
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, records, {
      headers: {
        "Content-Type": "application/json", 
      },
    });
    console.log("✅ Received prediction from AI service:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ AI Predict Error:", error.response?.data || error.message);
    return { error: "AI service unavailable" };
  }
};
