
import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./components/Auth";
import api from "./api";

function App() {
  // Logged-in user
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "null");
  });

  // Monthly budget
  const [budget, setBudget] = useState(() => {
    return Number(localStorage.getItem("studentBudget")) || 8000;
  });

  // Expenses from backend
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Expense form
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
  });

  const categories = [
    "Food",
    "Travel",
    "Shopping",
    "College",
    "Other",
  ];

  // Fetch expenses belonging to logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/expenses");
        setExpenses(response.data);
      } catch (err) {
        console.error("Fetch expenses error:", err);
        setError(
          err.response?.data?.message ||
          "Unable to load expenses. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user]);

  // Save budget locally
  useEffect(() => {
    localStorage.setItem("studentBudget", budget);
  }, [budget]);

  // Login success
  const handleAuthSuccess = (loggedInUser) => {
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setExpenses([]);
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const remaining = budget - totalExpenses;

  // Add expense to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || Number(form.amount) <= 0) {
      alert("Please enter a valid expense.");
      return;
    }

    try {
      setError("");

      const response = await api.post("/expenses", {
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: "",
        paymentMethod: "",
        date: new Date().toISOString(),
      });

      setExpenses((previous) => [
        response.data.expense,
        ...previous,
      ]);

      setForm({
        title: "",
        amount: "",
        category: "Food",
      });
    } catch (err) {
      console.error("Add expense error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to add expense."
      );
    }
  };

  // Delete expense from backend
  const deleteExpense = async (id) => {
    try {
      setError("");

      await api.delete(`/expenses/${id}`);

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );
    } catch (err) {
      console.error("Delete expense error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to delete expense."
      );
    }
  };

  // Category totals
  const categoryTotals = categories.map((category) => ({
    name: category,
    amount: expenses
      .filter((expense) => expense.category === category)
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0
      ),
  }));

  // Currency formatter
  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  // Budget percentage
  const percentage =
    budget > 0
      ? Math.min((totalExpenses / budget) * 100, 100)
      : 0;

  // Show login/register if user is not logged in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Main dashboard
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Student Wallet 🎓</h1>
          <p>Manage your money. Build better habits.</p>
        </div>

        <div>
          <span className="month">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <p>Welcome, {user.name}!</p>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <h2>Welcome back, {user.name}!</h2>
          <p>Here's your monthly financial overview.</p>
        </section>

        {error && (
          <p className="auth-message">
            {error}
          </p>
        )}

        <section className="summary">
          <div className="card budget-card">
            <span>Monthly Budget</span>
            <h2>{formatMoney(budget)}</h2>

            <label>Set budget</label>

            <input
              type="number"
              min="1"
              value={budget}
              onChange={(e) =>
                setBudget(Math.max(0, Number(e.target.value)))
              }
            />
          </div>

          <div className="card expense-card">
            <span>Total Expenses</span>
            <h2>{formatMoney(totalExpenses)}</h2>
            <p>Money spent</p>
          </div>

          <div className="card remaining-card">
            <span>Remaining Balance</span>
            <h2>{formatMoney(remaining)}</h2>

            <p>
              {remaining < 0
                ? "Over budget!"
                : "Available balance"}
            </p>
          </div>
        </section>

        <section className="progress-section">
          <div className="section-heading">
            <h3>Budget Usage</h3>
            <strong>{percentage.toFixed(1)}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p>
            {formatMoney(totalExpenses)} spent out of{" "}
            {formatMoney(budget)}
          </p>
        </section>

        <section className="content-grid">
          <div className="panel">
            <h3>➕ Add New Expense</h3>

            <form onSubmit={handleSubmit}>
              <label>Expense Name</label>

              <input
                type="text"
                placeholder="e.g. Lunch, Bus ticket"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                required
              />

              <label>Amount (₹)</label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                required
              />

              <label>Category</label>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <button type="submit">
                Add Expense
              </button>
            </form>
          </div>

          <div className="panel">
            <h3>📊 Spending by Category</h3>

            {categoryTotals.map((item) => (
              <div className="category-row" key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.amount)}</strong>
                </div>

                <div className="category-track">
                  <div
                    className="category-fill"
                    style={{
                      width: `${
                        totalExpenses
                          ? (item.amount / totalExpenses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel transactions">
          <h3>📋 Recent Transactions</h3>

          {loading ? (
            <p>Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="empty">
              No expenses yet. Add your first expense!
            </p>
          ) : (
            expenses.map((expense) => (
              <div className="transaction" key={expense.id}>
                <div>
                  <strong>{expense.title}</strong>

                  <p>
                    {expense.category} ·{" "}
                    {new Date(expense.date).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <div className="transaction-right">
                  <strong>
                    {formatMoney(Number(expense.amount))}
                  </strong>

                  <button
                    className="delete-button"
                    onClick={() => deleteExpense(expense.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <footer>
          <p>
            Student Wallet © 2026 · Spend Smart, Save More 💚
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
