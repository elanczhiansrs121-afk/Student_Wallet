
const express = require("express");
const router = express.Router();

const prisma = require("../config/prisma");
const authMiddleware = require("../middleware/authMiddleware");

// GET all expenses belonging to the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: "desc" },
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

// MONTHLY EXPENSE COMPARISON
router.get("/comparison", authMiddleware, async (req, res) => {
  try {
    const { month1, year1, month2, year2 } = req.query;

    const values = [month1, year1, month2, year2];

    if (
      values.some((value) => value === undefined || value === "") ||
      ![month1, month2].every((value) =>
        /^\d+$/.test(value)
      ) ||
      ![year1, year2].every((value) =>
        /^\d{4}$/.test(value)
      )
    ) {
      return res.status(400).json({
        message: "Please provide both months and years.",
      });
    }

    const m1 = Number(month1);
    const y1 = Number(year1);
    const m2 = Number(month2);
    const y2 = Number(year2);

    if (
      m1 < 1 || m1 > 12 ||
      m2 < 1 || m2 > 12 ||
      y1 < 2000 || y1 > 2100 ||
      y2 < 2000 || y2 > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year.",
      });
    }

    // Create date ranges for both months
    const start1 = new Date(Date.UTC(y1, m1 - 1, 1));
    const end1 = new Date(Date.UTC(y1, m1, 1));

    const start2 = new Date(Date.UTC(y2, m2 - 1, 1));
    const end2 = new Date(Date.UTC(y2, m2, 1));

    // Fetch expenses for the logged-in user only
    const [expenses1, expenses2] = await Promise.all([
      prisma.expense.findMany({
        where: {
          userId: req.user.userId,
          date: { gte: start1, lt: end1 },
        },
      }),
      prisma.expense.findMany({
        where: {
          userId: req.user.userId,
          date: { gte: start2, lt: end2 },
        },
      }),
    ]);

    // Calculate totals
    const total1 = expenses1.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const total2 = expenses2.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    // Calculate category-wise totals
    const getCategoryTotals = (expenses) => {
      const categories = {};

      expenses.forEach((expense) => {
        categories[expense.category] =
          (categories[expense.category] || 0) +
          Number(expense.amount);
      });

      return Object.entries(categories).map(
        ([category, amount]) => ({
          category,
          amount,
        })
      );
    };

    const difference = total2 - total1;

    res.status(200).json({
      message: "Monthly comparison generated successfully",
      firstMonth: {
        month: m1,
        year: y1,
        total: total1,
        expenseCount: expenses1.length,
        categories: getCategoryTotals(expenses1),
      },
      secondMonth: {
        month: m2,
        year: y2,
        total: total2,
        expenseCount: expenses2.length,
        categories: getCategoryTotals(expenses2),
      },
      difference,
      percentageChange:
        total1 === 0
          ? null
          : Number(((difference / total1) * 100).toFixed(2)),
      spendingStatus:
        difference > 0
          ? "Increased"
          : difference < 0
            ? "Decreased"
            : "Unchanged",
    });
  } catch (error) {
    console.error("Monthly comparison error:", error);
    res.status(500).json({
      message: "Failed to compare monthly expenses",
    });
  }
});

// ADD a new expense
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      amount,
      category,
      description,
      paymentMethod,
      date,
    } = req.body;

    if (!title || amount === undefined || !category) {
      return res.status(400).json({
        message: "Title, amount and category are required",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: Number(amount),
        category,
        description,
        paymentMethod,
        date: date ? new Date(date) : new Date(),
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ message: "Failed to add expense" });
  }
});

// UPDATE an expense
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, description, paymentMethod, date } =
      req.body;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (
      amount !== undefined &&
      (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }

    const expense = await prisma.expense.update({
      where: { id: existingExpense.id },
      data: {
        ...(title !== undefined && { title }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(date !== undefined && { date: new Date(date) }),
      },
    });

    res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({ message: "Failed to update expense" });
  }
});

// DELETE an expense
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await prisma.expense.delete({
      where: { id: existingExpense.id },
    });

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
});

module.exports = router;
