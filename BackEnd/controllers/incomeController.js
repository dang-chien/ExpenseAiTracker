const ExcelJS = require("exceljs");
const Income = require("../models/Income");
const path = require("path");
const fs = require("fs");

// Add Income Source
exports.addIncome = async (req, res) => {
  const userId = req.user.id; //Lấy user từ token middleware

  try {
    const { categoryId, source, amount, date } = req.body;

    if (!categoryId ||!source || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newIncome = new Income({
      userId,
      categoryId,
      source,
      amount,
      date: new Date(date),
    });

    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding income", error: error.message });
  }
};

// Get All Income Sources
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const incomes = await Income.find({ userId }).sort({ date: -1 });
    res.status(200).json(incomes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching income sources", error: error.message });
  }
};

// Delete All Income Sources
exports.deleteAllIncome = async (req, res) => {
  try {
    const userId = req.user.id;
    await Income.deleteMany({ userId });
    res
      .status(200)
      .json({ message: "All income sources deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting all income sources",
      error: error.message,
    });
  }
};

/// Delete Income Source by ID
exports.deleteIncomeWithID = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting income", error: error.message });
  }
};

// Download Income Sources as Excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const incomes = await Income.find({ userId }).sort({ date: -1 });

    if (!incomes.length) {
      return res.status(404).json({ message: "No income data found" });
    }

    // 🧠 Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Income");

    // 🏷️ Đặt header cột
    sheet.columns = [
      { header: "Source", key: "source", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Date", key: "date", width: 20 },
    ];

    // 📥 Ghi dữ liệu vào sheet
    incomes.forEach((item) => {
      sheet.addRow({
        source: item.source,
        amount: item.amount,
        date: item.date.toISOString().split("T")[0],
      });
    });

    // 💄 Format header (in đậm, căn giữa)
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
    });

    // 📁 Tạo file Excel tạm trong thư mục `exports`
    const filePath = path.join(__dirname, "../exports/income_details.xlsx");
    await workbook.xlsx.writeFile(filePath);

    // 📤 Gửi file về client
    res.download(filePath, "income_details.xlsx", (err) => {
      if (err) {
        console.error("❌ Error sending file:", err);
        return res.status(500).send("Error downloading file");
      }
      // ✅ Xóa file sau khi gửi xong
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({
      message: "Error downloading income Excel",
      error: error.message,
    });
  }
};