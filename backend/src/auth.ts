import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Extend Express' Request type to include an authenticated user.
 */
export interface AuthRequest extends Request {
  user?: { userId: number };
}

/**
 * Middleware that verifies a JWT in the Authorization header.
 * Expects header in the form: "Authorization: Bearer <token>"
 */
export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  // Extract token part after "Bearer "
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Malformed Authorization header" });
  }

  try {
    // Verify and decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { userId: number };

    // Optionally, validate that userId exists and is a number
    if (!decoded.userId || typeof decoded.userId !== "number") {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Attach user info to the request for downstream handlers
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
