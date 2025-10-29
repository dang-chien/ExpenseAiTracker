const ExcelJS = require("exceljs");
const Expense = require("../models/Expense");

// Add Expense
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category,
      amount,
      date: new Date(date),
    });

    await newExpense.save();
    res.status(200).json(newExpense);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding expense", error: error.message });
  }
};

// Get All Expense
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });
    res.status(200).json(expense);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching expense", error: error.message });
  }
};

// Delete All Expenses
exports.deleteAllExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    await Expense.deleteMany({ userId });
    res.status(200).json({ message: "All expenses deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting all expenses", error: error.message });
  }
};

// Delete Expense With ID
exports.deleteExpenseWithID = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting expense", error: error.message });
  }
};

// Download Expense as Excel
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    if (!expense.length) {
      return res.status(400).json({ message: "No expense data no found" });
    };
    // Tạo workbook và workSheet
    const workBook = new ExcelJS.WorkBook();
    const sheet = workBook.addWorksheet("Expense");

    // 🧠 Tạo header
    sheet.columns = [
      { header: "Soruce", key: "soruce", width: 30 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Date", key: "date", width: 20 },
    ];
    // Thêm dữ liệu vào Sheet 
    expense.forEach((item) => {
      sheet.addRow({
        category: item.category,
        source: item.source,
        amount: item.amount,
        date: item.date.toISOString().split("T")[0],
      });
    });

    // Format header 
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  
    // 📁 Tạo file Excel tạm trong thư mục `exports`
    const filePath = path.join(__dirname, "../exports/expense_details.xlsx");
    await workbook.xlsx.writeFile(filePath);
      // 📤 Gửi file về client
    res.download(filePath, "Expense_details.xlsx", (err) => {
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
      message: "Error downloading Expense Excel",
      error: error.message,
    });
  }
};

