import express from "express";
import { prisma } from "../db.js";

const router = express.Router();

const LOW_STOCK_THRESHOLD = 10;

router.get("/stats", async (req, res) => {
  try {
    const range = req.query.range || "30d";

    const now = new Date();
    let startDate;
    let unit;

    if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      unit = "day";
    } else if (range === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      unit = "day";
    } else if (range === "1y") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      unit = "month";
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      unit = "day";
    }

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      lowStock,
      outOfStock,
      totalCategories,
      totalMovements,
      typeGroups,
      categoryList,
      categorySums,
      lowStockItems,
      timeRows,
      newProducts,
      newCategories,
      newMovements,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: { quantityOnHand: { lt: LOW_STOCK_THRESHOLD } },
      }),
      prisma.product.count({ where: { quantityOnHand: 0 } }),
      prisma.category.count(),
      prisma.stockMovement.count(),
      prisma.stockMovement.groupBy({
        by: ["movementType"],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.groupBy({
        by: ["categoryId"],
        _sum: { quantityOnHand: true },
      }),
      prisma.product.findMany({
        where: { quantityOnHand: { lt: LOW_STOCK_THRESHOLD } },
        select: { id: true, sku: true, name: true, quantityOnHand: true },
        orderBy: { quantityOnHand: "asc" },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT date_trunc(${unit}, "createdAt") AS period,
          SUM(CASE WHEN "movementType" = 'stock_in' THEN quantity ELSE 0 END) AS "stockIn",
          SUM(CASE WHEN "movementType" = 'stock_out' THEN quantity ELSE 0 END) AS "stockOut"
        FROM stock_movements
        WHERE "createdAt" >= ${startDate}
        GROUP BY period
        ORDER BY period
      `,
      prisma.product.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.category.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.stockMovement.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    const typeMap = {};
    typeGroups.forEach((g) => {
      typeMap[g.movementType] = g._count;
    });
    const movementByType = [
      { type: "stock_in", count: typeMap.stock_in || 0 },
      { type: "stock_out", count: typeMap.stock_out || 0 },
      { type: "adjustment", count: typeMap.adjustment || 0 },
    ];

    const sumMap = {};
    categorySums.forEach((s) => {
      sumMap[s.categoryId] = s._sum.quantityOnHand || 0;
    });
    const stockByCategory = categoryList.map((c) => ({
      name: c.name,
      stock: sumMap[c.id] || 0,
    }));

    const timeSeries = timeRows.map((r) => ({
      period:
        unit === "month"
          ? new Date(r.period).toISOString().slice(0, 7)
          : new Date(r.period).toISOString().slice(0, 10),
      stockIn: Number(r.stockIn),
      stockOut: Number(r.stockOut),
    }));

    res.json({
      counts: {
        totalProducts,
        lowStock,
        outOfStock,
        totalCategories,
        totalMovements,
      },
      movementByType,
      stockByCategory,
      lowStockItems,
      timeSeries,
      deltas: {
        newProducts,
        newCategories,
        newMovements,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
