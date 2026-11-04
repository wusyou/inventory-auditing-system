import express from "express";
import { prisma } from "../db.js";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { loginRateLimiter } from "../middleware/loginRateLimiter.js";

const router = express.Router();

function generateRefreshToken() {
  const token = randomBytes(64).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

router.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  async function logAttempt(success) {
    await prisma.loginAttempt.create({
      data: { email: email ?? "", success, ipAddress: req.ip },
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      await logAttempt(false);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      await logAttempt(false);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { token: refreshToken, tokenHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAttempt(true);
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: refreshTokenHash },
    });

    if (!storedToken) {
      return res.status(401).json({ error: `Invalid refresh token` });
    }

    if (storedToken.revokedAt) {
      return res.status(401).json({ error: `Invalid refresh token` });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: `Invalid refresh token` });
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { token: newRefreshToken, tokenHash: newTokenHash } =
      generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: `Invalid refresh token` });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.json({ message: `Logged out` });
    }

    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await prisma.refreshToken.updateMany({
      where: { tokenHash: refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.json({ message: `Logged out` });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
