import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { verifyToken } from "./middleware/verifyToken.js";
import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import productsRoutes from "./routes/products.routes.js";
import usersRoutes from "./routes/users.routes.js";
import auditLogsRoutes from "./routes/auditLogs.routes.js";
import stockMovementsRoutes from "./routes/stockMovements.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import loginAttemptsRoutes from "./routes/loginAttempts.routes.js";

const port = 3000;
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(authRoutes);
app.use(verifyToken);
app.use("/categories", categoriesRoutes);
app.use("/products", productsRoutes);
app.use("/users", usersRoutes);
app.use("/audit-logs", auditLogsRoutes);
app.use("/stock-movements", stockMovementsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/login-attempts", loginAttemptsRoutes);

app.listen(port, () => {
  console.log(`Your port is running at ${port}`);
});
