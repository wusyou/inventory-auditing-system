import express from "express";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const products = await prisma.product.findMany();

  res.json(products);
});

router.put(
  "/:id",
  requireRole(["admin", "staff"]),
  validate(updateProductSchema),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, unit, isActive, categoryId } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const oldProduct = await tx.product.findUnique({
          where: { id: id },
        });

        const updatedProduct = await tx.product.update({
          where: { id },
          data: {
            name,
            unit,
            isActive,
            categoryId,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            tableName: "products",
            recordId: id,
            action: "UPDATE",
            oldData: oldProduct,
            newData: updatedProduct,
            changedById: req.user.userId,
          },
        });

        return { updatedProduct, auditLog };
      });

      res.json(result.updatedProduct);
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      if (err.code === "P2003") {
        return res.status(400).json({ error: "Category not found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

router.post(
  "/",
  requireRole(["admin", "staff"]),
  validate(createProductSchema),
  async (req, res) => {
    try {
      const { sku, name, categoryId, unit, quantityOnHand } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            sku,
            name,
            categoryId,
            unit,
            quantityOnHand,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            tableName: "products",
            recordId: newProduct.id,
            action: "CREATE",
            oldData: null,
            newData: newProduct,
            changedById: req.user.userId,
          },
        });

        return { newProduct, auditLog };
      });

      return res.json(result.newProduct);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "SKU already exists" });
      }
      if (err.code === "P2003") {
        return res.status(400).json({ error: "Category not found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

router.delete("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const deleteProduct = await tx.product.delete({
        where: { id },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          tableName: "products",
          recordId: id,
          action: "DELETE",
          oldData: deleteProduct,
          newData: null,
          changedById: req.user.userId,
        },
      });

      return { deleteProduct, auditLog };
    });

    return res.json(result.deleteProduct);
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(409).json({
        error: "Cannot delete a product that has stock movement history",
      });
    }

    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: `Product not found` });
    }

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id/stock-movements", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const stockMovement = await prisma.stockMovement.findMany({
      where: { productId: id },
    });

    return res.json(stockMovement);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
