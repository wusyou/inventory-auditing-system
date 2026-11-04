import express from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", requireRole(["admin"]), async (req, res) => {
  try {
    const parsed = parseInt(req.query.limit);
    const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
    const search = req.query.search || "";

    const logs = await prisma.auditLog.findMany({
      where: search
        ? {
            OR: [
              { tableName: { contains: search, mode: "insensitive" } },
              { action: { contains: search, mode: "insensitive" } },
              {
                changedBy: {
                  fullName: { contains: search, mode: "insensitive" },
                },
              },
              {
                changedBy: { email: { contains: search, mode: "insensitive" } },
              },
            ],
          }
        : undefined,
      orderBy: { changedAt: "desc" },
      take: limit,
      include: {
        changedBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    const safeLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    return res.json(safeLogs);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/export", requireRole(["admin"]), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { changedAt: "desc" },
      include: { changedBy: { select: { fullName: true } } },
    });

    const headers = ["Date", "User", "Action", "Table", "Record ID"];

    const rows = logs.map((log) => [
      new Date(log.changedAt).toISOString(),
      log.changedBy?.fullName || "System",
      log.action,
      log.tableName,
      log.recordId,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-logs.csv"',
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
