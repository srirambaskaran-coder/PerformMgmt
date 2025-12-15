import express from "express";
import { createServer } from "http";
import cors from "cors";
import session from "express-session";
import { getCorsOptions } from "./config/cors.config";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";
import routes from "./routes";

const app = express();

// CORS configuration - must be before other middleware
app.use(cors(getCorsOptions()));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "performance-mgmt-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      logger.info(`${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });

  next();
});

// Mount API routes
app.use("/api", routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Start server
const port = parseInt(process.env.PORT || "3000", 10);

server.listen(port, () => {
  logger.info(`🚀 Backend Server running on http://localhost:${port}`);
  logger.info(`🔌 API: http://localhost:${port}/api`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Database: Connected`);
});
