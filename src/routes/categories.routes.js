import express from "express";
import { requireRole } from "../middleware/requireRole.js";
import { prisma } from "../db.js";
import { createCategorySchema } from "../validators/category.validator.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post(
  "/",
  requireRole(["admin", "staff"]),
  validate(createCategorySchema),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const newCategory = await tx.category.create({
          data: {
            name,
            description,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            tableName: "categories",
            recordId: newCategory.id,
            action: "CREATE",
            oldData: null,
            newData: newCategory,
            changedById: req.user.userId,
          },
        });

        return { newCategory, auditLog };
      });

      return res.json(result.newCategory);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
);

router.put(
  "/:id",
  requireRole(["admin", "staff"]),
  validate(createCategorySchema),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const { name, description } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const oldCategory = await tx.category.findUnique({
          where: { id },
        });

        const updateCategory = await tx.category.update({
          where: { id },
          data: {
            name,
            description,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            tableName: "categories",
            recordId: id,
            action: "UPDATE",
            oldData: oldCategory,
            newData: updateCategory,
            changedById: req.user.userId,
          },
        });

        return { updateCategory, auditLog };
      });

      return res.json(result.updateCategory);
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.status(500).json({ error: err.message });
    }
  },
);

router.delete("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const productCount = await tx.product.count({
        where: {
          categoryId: id,
        },
      });

      if (productCount > 0) {
        throw new Error("IN_USE");
      }

      const deleteCategory = await tx.category.delete({
        where: { id },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          tableName: "categories",
          recordId: id,
          action: "DELETE",
          oldData: deleteCategory,
          newData: null,
          changedById: req.user.userId,
        },
      });

      return { deleteCategory, auditLog };
    });

    return res.json({
      message: `Category deleted`,
      deleteCategory: result.deleteCategory,
    });
  } catch (err) {
    if (err.message === "IN_USE") {
      return res
        .status(409)
        .json({ error: "Cannot delete: category is still used by products" });
    }

    if (err.code === "P2025") {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(500).json({ error: err.message });
  }
});

export default router;
