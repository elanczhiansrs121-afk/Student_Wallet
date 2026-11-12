
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===================================
// REGISTER A NEW USER
// ===================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return res.status(201).json({
      message: "Registration successful",
      user,
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

// ===================================
// LOGIN AN EXISTING USER
// ===================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    // Generate JWT token
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d",
  }
);

    // Return token and user details
    return res.status(200).json({
  message: "Login successful",
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
  },
});

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

// ===================================
// EXPORT BOTH FUNCTIONS
// ===================================
module.exports = {
  registerUser,
  loginUser,
};
