// testFlaskPredict.js
const axios = require("axios"); 

const FLASK_URL = "http://localhost:5000/predict";

// Dữ liệu chi tiêu giả lập (records)
const sampleData = {
  records: [
    { date: "2025-07-10", amount: 1200, category: "Rent/Mortgage" },
    { date: "2025-08-10", amount: 1300, category: "Rent/Mortgage" },
    { date: "2025-09-10", amount: 1400, category: "Rent/Mortgage" },
    { date: "2025-10-10", amount: 1450, category: "Rent/Mortgage" },
    { date: "2025-06-15", amount: 400, category: "Groceries" },
    { date: "2025-07-15", amount: 420, category: "Groceries" },
    { date: "2025-08-15", amount: 440, category: "Groceries" },
    { date: "2025-09-15", amount: 470, category: "Groceries" },
    { date: "2025-10-15", amount: 500, category: "Groceries" }
  ]
};

(async () => {
  try {
    console.log("🚀 Sending data to Flask /predict...");
    const response = await axios.post(FLASK_URL, sampleData, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ Response from Flask:");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Error connecting to Flask:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
})();
