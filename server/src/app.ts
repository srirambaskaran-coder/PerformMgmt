import express from "express";
import cors from "cors";
import { getCorsOptions } from "./config/cors.config";
import { registerRoutes } from "./routes";
import { logger } from "./utils/logger";

const app = express();

// CORS configuration - must be before other middleware
app.use(cors(getCorsOptions()));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Setup all routes using the existing registerRoutes function
// This includes session setup and all API endpoints
(async () => {
  const server = await registerRoutes(app);

  // Start server
  const port = parseInt(process.env.PORT || "3000", 10);

  server.listen(port, () => {
    logger.info(`🚀 Backend Server running on http://localhost:${port}`);
    logger.info(`🔌 API: http://localhost:${port}/api`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🗄️  Database: Connected`);
    logger.info(`📚 Architecture: Layered (Controllers, Services, Repositories available)`);
  });
})();
