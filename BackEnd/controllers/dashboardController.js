const axios = require("axios");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { Types } = require("mongoose");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    // Tổng thu & chi
    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 60 ngày income
    const last60DaysIncomeTransactions = await Income.find({
      userId,
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    }).populate("categoryId", "name icon type").sort({ date: -1 });
    const incomeLast60Days = last60DaysIncomeTransactions.reduce(
      (sum, t) => sum + t.amount, 0
    );

    // 180 ngày expense
    const last180DaysExpenseTransactions = await Expense.find({
      userId,
      date: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
    }).populate("categoryId", "name icon type").sort({ date: -1 });

    const expenseLast180Days = last180DaysExpenseTransactions.reduce(
      (sum, t) => sum + t.amount, 0
    );

    // 📊 Chuẩn bị data gửi cho Flask AI
    const aiRecords = last180DaysExpenseTransactions.map((t) => ({
      date: t.date.toISOString().split("T")[0],
      amount: t.amount,
      category: t.categoryId?.name || "Other",
    }));

    // 🚀 Gọi Flask API predict
    let aiPrediction = null;
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/predict`,
        { records: aiRecords },
        { headers: { "Content-Type": "application/json" } }
      );
      aiPrediction = aiResponse.data;
    } catch (err) {
      console.error("⚠️ AI Prediction failed:", err.message);
    }

    // Giao dịch mới nhất
    const lastTransactions = [
      ...(await Income.find({ userId }).populate("categoryId", "name icon type").sort({ date: -1 }).limit(5)).map(
        (t) => ({ ...t.toObject(), type: "income" })
      ),
      ...(await Expense.find({ userId }).populate("categoryId", "name icon type").sort({ date: -1 }).limit(5)).map(
        (t) => ({ ...t.toObject(), type: "expense" })
      ),
    ].sort((a, b) => b.date - a.date);

    // ✅ Trả về dữ liệu đầy đủ
    res.json({
      totalBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpense[0]?.total || 0,
      last180DaysExpenses: {
        total: expenseLast180Days,
        transactions: last180DaysExpenseTransactions,
      },
      last60DaysIncome: {
        total: incomeLast60Days,
        transactions: last60DaysIncomeTransactions,
      },
      recentTransactions: lastTransactions,
      aiPrediction, // 💡 Thêm kết quả dự đoán
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
