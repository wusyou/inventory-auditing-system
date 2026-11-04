import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: `No token provided.` });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: `Invalid or expired token` });
    }

    req.user = { userId: user.id, role: user.role };

    next();
  } catch (err) {
    res.status(401).json({ error: `Invalid or expired token` });
  }
}
