import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import passport from "./config/passport.js";
import routes from "./routes.js";
import path from "node:path";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// Antete de securitate. "cross-origin" la resurse, ca frontendul (alt port/domeniu)
// să poată afișa fotografiile din /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// API base routing
app.use("/api", routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(err.status || 500).json({
    message: err.message || "A intervenit o eroare pe server.",
  });
});

export default app;