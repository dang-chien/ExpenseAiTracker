const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const Expense = require("../../../models/Expense");
const connectDB = require("../../../config/db");

// 🧩 User ID cố định
const USER_ID = "68e45fb9fc9a3ce15d848dd0";

// 🧩 Danh sách Category ID (chỉ cần string ID)
const categoryIds = [{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d436"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d437"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d438"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d439"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43a"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43b"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43c"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43d"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43e"
  },
  "type": "Expense"
},
{
  "_id": {
    "$oid": "69097f1a3bd757220c933df7"
  },
  "type": "Expense"
}]
const CATEGORY_IDS = categoryIds.map(cat => cat._id.$oid);
console.log("📂 CATEGORY_IDS:", CATEGORY_IDS);

// 🧮 Hàm random tiện ích
function getRandomAmount(min = 20000, max = 500000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🗓️ Sinh ngẫu nhiên ngày từ tháng 7 đến nay
function randomDateBetweenJanuaryToNow() {
  const start = new Date("2025-01-01T00:00:00Z");
  const end = new Date("2025-06-30T23:59:59Z");
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedExpenses() {
  try {
    await connectDB(); // ✅ phải có await
    console.log("🌐 Connected to MongoDB");

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

    // Thêm mới
    await Expense.insertMany(expenses);
    console.log(`✅ Inserted ${expenses.length} expenses for user ${USER_ID}`);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    mongoose.connection.close();
  }
}

seedExpenses();
