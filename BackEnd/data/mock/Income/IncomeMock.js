const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const Income = require("../../../models/Income");
const connectDB = require("../../../config/db");

// 🧩 User ID cố định
const USER_ID = "68e45fb9fc9a3ce15d848dd0";

// 🧩 Danh sách Category ID (Income)
const categoryIds = 
 [{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d43f"
  }
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d440"
  }
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d441"
  }
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d442"
  }
},
{
  "_id": {
    "$oid": "69097c5348ff49a1adb2d443"
  }
}];

const CATEGORY_IDS = categoryIds.map(cat => cat._id.$oid);
console.log("📂 INCOME CATEGORY_IDS:", CATEGORY_IDS);

// 🧮 Random tiền thu nhập
function getRandomAmount(min = 20000, max = 200000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🗓️ Random ngày từ tháng 7 đến nay
function randomDateBetweenJulyToNow() {
  const start = new Date("2025-07-01T00:00:00Z");
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 🧾 Random nguồn thu nhập (optional, nếu model có field "source")
const sources = ["Salary", "Freelance", "Bonus", "Interest", "Gift", "Others"];

async function seedIncomes() {
  try {
    await connectDB();
    console.log("🌐 Connected to MongoDB");

    const incomes = [];

    for (let i = 0; i < 100; i++) {
      const categoryId = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
      const date = randomDateBetweenJulyToNow();
      const amount = getRandomAmount();
      const source = sources[Math.floor(Math.random() * sources.length)];

      incomes.push({
        userId: USER_ID,
        categoryId,
        amount,
        source, // chỉ có nếu schema Income có field này
        date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Xóa dữ liệu cũ
    await Income.deleteMany({ userId: USER_ID });
    console.log("🗑️ Old incomes removed");

    // Thêm mới
    await Income.insertMany(incomes);
    console.log(`✅ Inserted ${incomes.length} incomes for user ${USER_ID}`);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    mongoose.connection.close();
  }
}

seedIncomes();
