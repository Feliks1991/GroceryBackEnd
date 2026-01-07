import express from "express";
import morgan from "morgan";
import productsRoutes from "./routes/productsRoutes.mjs";
import commentsRouter from "./routes/commentsRouter.mjs";
import usersRoutes from "./routes/usersRoutes.mjs";
import cartRoutes from "./routes/cartRoutes.mjs"
import errorHandler from "./middlewares/errorHandler.mjs";
import __dirname from "./rootDir.mjs";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.set("strict routing", true);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use("/products", productsRoutes);
app.use("/comments", commentsRouter);
app.use("/auth", usersRoutes);
app.use("/cart", cartRoutes);
app.use("/products", express.static(path.join(__dirname, "uploads/products")));
app.use("/placeholders", express.static(path.join(__dirname, "uploads/placeholders")));

app.use((req, res, next) => {
  const err = new Error("Route not found");
  err.status = 404;
  next(err);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
