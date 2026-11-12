import { useState } from "react";
import api from "../api";
import "./Auth.css";

function Auth({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        await api.post("/auth/register", form);
      }

      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      onAuthSuccess(response.data.user);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Student Wallet 🎓</h1>
        <h2>{isRegister ? "Create Account" : "Welcome Back"}</h2>

        {isRegister && (
          <>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </>
        )}

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
          minLength={6}
        />

        {message && <p className="auth-message">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isRegister
              ? "Register"
              : "Login"}
        </button>

        <p>
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Auth;
