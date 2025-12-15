import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    activeRole: string;
    companyId: string;
  }
}
