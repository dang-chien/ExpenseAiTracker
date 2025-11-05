const express = require("express");
const router = express.Router();
const {
  evaluateExpensesAi,
  predictExpensesAi,
  suggestExpenseAi,
} = require("../controllers/aiController");

router.post("/evaluate", evaluateExpensesAi);
router.post("/predict", predictExpensesAi);
router.post("/suggest", suggestExpenseAi);

module.exports = router;
