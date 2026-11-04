import express from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", requireRole(["admin"]), async (req, res) => {
  try {
    const parsed = parseInt(req.query.limit);
    const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : 100;

    const { search, status, from, to } = req.query;

    const where = {};

    if (search) {
      where.email = { contains: search, mode: "insensitive" };
    }

    if (status === "success") {
      where.success = true;
    } else if (status === "failed") {
      where.success = false;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        where.createdAt.lt = toDate;
      }
    }

    const attempts = await prisma.loginAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
