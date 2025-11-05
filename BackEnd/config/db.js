const mongoose = require("mongoose");
const { env } = require("process");

const connectDB = async () => {
  try {
    console.log("🧠 process.env.MONGO_URI =", env.MONGO_URI);
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI not found in .env file!");
    }
    await mongoose.connect(env.MONGO_URI, {});
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
