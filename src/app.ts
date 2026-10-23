/* eslint-disable semi */
/* eslint-disable indent */
import express, { Application, Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import indexRoutes from "./routes/index.routes";
import cors from "cors";
import helmet from "helmet";
import { logger } from "./utils";

const app: Application = express();
app.use(bodyParser.json({ limit: "10mb" }));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: "*",
    credentials: true,
    exposedHeaders: "*",
  })
);

// Static files middleware BEFORE routes
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(
  "/api/uploads",
  express.static("uploads", {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Middleware to handle CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // Allow specific methods
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow specific headers
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Respond to preflight requests
  }
  next(); // Proceed to the next middleware or route handler
});
// Routes
app.use("/api", indexRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled request error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
  next();
});

export { app };
