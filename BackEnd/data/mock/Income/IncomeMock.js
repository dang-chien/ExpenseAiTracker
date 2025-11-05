const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const Income = require("../../../models/Income");
const connectDB = require("../../../config/db");
const Category = require("../../../models/Category");

// 🧩 User ID cố định
const USER_ID = "690b5cc201b23a92a2b671b9";

// 🧮 Random tiền thu nhập
function getRandomAmount(min = 2000, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 🗓️ Random ngày từ tháng 1 đến nay
function randomDateBetweenJulyToNow() {
  const start = new Date("2025-01-01T00:00:00Z");
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 🧾 Random nguồn thu nhập (optional, nếu model có field "source")
const sources = ["Salary", "Freelance", "Bonus", "Interest", "Gift", "Others"];

async function seedIncomes() {
  try {
    await connectDB();
    console.log("🌐 Connected to MongoDB");

    const categories = await Category.find({ type: "Income" }).select("_id name").lean();
    const CATEGORY_IDS = categories.map(cat => cat._id);
    console.log(`📂 Found ${CATEGORY_IDS.length} Income categories.`);

    if (CATEGORY_IDS.length === 0) {
      throw new Error("❌ No Income categories found. Please check Category collection.");
    }

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
