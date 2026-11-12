
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home / Test route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Student Wallet API is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Expense routes
app.use("/api/expenses", expenseRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
