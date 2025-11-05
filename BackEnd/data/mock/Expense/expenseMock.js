const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const Expense = require("../../../models/Expense");
const Category = require("../../../models/Category");
const connectDB = require("../../../config/db");

// 🧩 ID người dùng cần seed
const USER_ID = "690b5cc201b23a92a2b671b9";

// 🧮 Hàm random tiện ích
function getRandomAmount(min = 100, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🗓️ Sinh ngẫu nhiên ngày từ tháng 1 đến tháng 6 năm 2025
function randomDateBetweenJanuaryToNow() {
  const start = new Date("2025-01-01T00:00:00Z");
  const end = new Date("2025-10-30T23:59:59Z");
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedExpenses() {
  try {
    await connectDB();
    console.log("🌐 Connected to MongoDB");

    // 🔹 Fetch Category IDs (chỉ các danh mục chi tiêu)
    const categories = await Category.find({ type: "Expense" }).select("_id name").lean();
    const CATEGORY_IDS = categories.map(cat => cat._id);
    console.log(`📂 Found ${CATEGORY_IDS.length} Expense categories.`);

    if (CATEGORY_IDS.length === 0) {
      throw new Error("❌ No Expense categories found. Please check Category collection.");
    }

    const expenses = [];

    for (let i = 0; i < 100; i++) {
      const categoryId = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
      const date = randomDateBetweenJanuaryToNow();
      const amount = getRandomAmount();

      expenses.push({
        userId: USER_ID,
        categoryId,
        amount,
        date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await Expense.insertMany(expenses);
    console.log(`✅ Inserted ${expenses.length} expenses for user ${USER_ID}`);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    mongoose.connection.close();
  }
}

seedExpenses();
