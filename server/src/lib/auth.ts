import type { RequestHandler } from "express";
import { storage } from "./storage";
import session from "express-session";
import type { Express } from "express";

// Simple session-based authentication (replace Replit auth)
export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  // Allow overriding secure cookie via env for local development
  const cookieSecure = process.env.SESSION_COOKIE_SECURE
    ? process.env.SESSION_COOKIE_SECURE === "true"
    : false; // default to false so localhost over HTTP works

  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "default-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: "lax",
        maxAge: sessionTtl,
      },
    })
  );
}

// Authentication middleware - checks if user is logged in
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }

  // Attach user to request
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Role-based authorization middleware
export const requireRoles = (allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = req.user;

      // Use active role from session if available, otherwise fall back to database role
      const activeRole = req.session?.activeRole || user.role;

      // Check if the user has the required role in their available roles
      const availableRoles = user.roles || [user.role];

      // Verify the active role is valid for this user
      if (!availableRoles.includes(activeRole)) {
        return res
          .status(403)
          .json({ message: "Access forbidden - invalid active role" });
      }

      // Check if the active role is in the allowed roles for this endpoint
      if (!allowedRoles.includes(activeRole)) {
        return res
          .status(403)
          .json({ message: "Access forbidden - insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Error validating permissions" });
    }
  };
};
