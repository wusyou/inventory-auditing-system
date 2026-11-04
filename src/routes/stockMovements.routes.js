import express from "express";
import { prisma } from "../db.js";
import { validate } from "../middleware/validate.js";
import { createStockMovementSchema } from "../validators/stockMovement.validator.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/",
  requireRole(["admin", "staff"]),
  validate(createStockMovementSchema),
  async (req, res) => {
    try {
      const { productId, movementType, quantity, referenceNo, reason } =
        req.body;

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        if (movementType === "stock_out") {
          const updateResult = await tx.product.updateMany({
            where: { id: productId, quantityOnHand: { gte: quantity } },
            data: { quantityOnHand: { decrement: quantity } },
          });

          if (updateResult.count === 0) {
            throw new Error("Insufficient stock");
          }
        } else if (movementType === "stock_in") {
          await tx.product.update({
            where: { id: productId },
            data: { quantityOnHand: { increment: quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: productId },
            data: { quantityOnHand: quantity },
          });
        }

        const updatedProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
            productId: productId,
            movementType: movementType,
            quantity: quantity,
            referenceNo: referenceNo,
            reason: reason,
            performedById: req.user.userId,
          },
        });

        await tx.auditLog.create({
          data: {
            tableName: "products",
            recordId: productId,
            action: "UPDATE",
            oldData: product,
            newData: updatedProduct,
            changedById: req.user.userId,
          },
        });

        await tx.auditLog.create({
          data: {
            tableName: "stock_movements",
            recordId: stockMovement.id,
            action: "CREATE",
            oldData: null,
            newData: stockMovement,
            changedById: req.user.userId,
          },
        });

        return { stockMovement, updatedProduct };
      });

      res.json(result);
    } catch (err) {
      if (
        err.message === "Product not found" ||
        err.message === "Insufficient stock"
      ) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Something went wrong" });
    }
  },
);

router.get("/", async (req, res) => {
  try {
    const parsed = parseInt(req.query.limit);
    const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
    const search = req.query.search || "";

    const movements = await prisma.stockMovement.findMany({
      where: search
        ? {
            OR: [
              { referenceNo: { contains: search, mode: "insensitive" } },
              { reason: { contains: search, mode: "insensitive" } },
              { product: { sku: { contains: search, mode: "insensitive" } } },
              { product: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : undefined,
      orderBy: { id: "desc" },
      take: limit,
      include: { product: { select: { sku: true, name: true } } },
    });

    res.json(movements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
