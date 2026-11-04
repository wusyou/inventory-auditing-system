import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema } from "../validators/user.validator.js";

const router = express.Router();

router.get("/", requireRole(["admin"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post(
  "/",
  requireRole(["admin"]),
  validate(createUserSchema),
  async (req, res) => {
    try {
      const { fullName, email, password, role } = req.body;

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            fullName,
            email,
            passwordHash: hashedPassword,
            role,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            tableName: "users",
            recordId: newUser.id,
            action: "CREATE",
            oldData: null,
            newData: newUser,
            changedById: req.user.userId,
          },
        });

        return { newUser, auditLog };
      });

      return res.json(result.newUser);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

router.patch("/:id/deactivate", requireRole(["admin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (id === req.user.userId) {
      return res
        .status(400)
        .json({ error: "You cannot deactivate your own account" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (oldUser && oldUser.role === "admin") {
        const activeAdmins = await tx.user.count({
          where: { role: "admin", isActive: true },
        });

        if (activeAdmins <= 1) {
          throw new Error("Cannot deactivate the last active admin");
        }
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          tableName: "users",
          recordId: oldUser.id,
          action: "UPDATE",
          oldData: oldUser,
          newData: updatedUser,
          changedById: req.user.userId,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: updatedUser.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { oldUser, updatedUser, auditLog };
    });

    return res.json(result.updatedUser);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    if (err.message === "Cannot deactivate the last active admin") {
      return res.status(400).json({ error: err.message });
    }

    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/:id/activate", requireRole(["admin"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          tableName: "users",
          recordId: oldUser.id,
          action: "UPDATE",
          oldData: oldUser,
          newData: updatedUser,
          changedById: req.user.userId,
        },
      });

      return { oldUser, updatedUser, auditLog };
    });

    return res.json(result.updatedUser);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch(
  "/:id/reset-password",
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "New password must be at least 8 characters" });
      }

      const saltRounds = 10;
      const newHash = await bcrypt.hash(newPassword, saltRounds);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id } });

        if (!user) {
          throw new Error("User not found");
        }

        await tx.user.update({
          where: { id },
          data: { passwordHash: newHash },
        });

        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            tableName: "users",
            recordId: id,
            action: "UPDATE",
            oldData: {},
            newData: { passwordReset: true },
            changedById: req.user.userId,
          },
        });
      });

      return res.json({ message: "Password reset" });
    } catch (err) {
      if (err.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

router.post("/logout-all", async (req, res) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.json({ message: "Logged out from all devices" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/:id/role", requireRole(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    const validRoles = ["admin", "staff", "auditor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({ where: { id: userId } });
      if (!oldUser) throw new Error("User not found");

      if (oldUser.role === "admin" && role !== "admin") {
        const activeAdmins = await tx.user.count({
          where: { role: "admin", isActive: true },
        });
        if (activeAdmins <= 1) {
          throw new Error("Cannot change the role of the last active admin");
        }
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role },
      });

      await tx.auditLog.create({
        data: {
          tableName: "users",
          recordId: userId,
          action: "UPDATE",
          oldData: { role: oldUser.role },
          newData: { role: updatedUser.role },
          changedById: req.user.userId,
        },
      });

      return updatedUser;
    });

    res.json({ id: result.id, role: result.role });
  } catch (err) {
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === "Cannot change the role of the last active admin") {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
