import { Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "../config/supabase";
import { AuthRequest, JWTPayload } from "../types";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Authentication middleware — verifies Supabase JWT and attaches user data.
 * 
 * Extracts Bearer token from Authorization header, verifies signature
 * with the Supabase JWT secret, then looks up the user's profile.
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    let userId: string | null = null;
    let userEmail: string | undefined;

    if (SUPABASE_JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
          audience: "authenticated",
        });
        userId = payload.sub as string;
        userEmail = payload.email as string | undefined;
        req.user = payload as unknown as JWTPayload;
      } catch {
        // Fall back to Supabase API check below
      }
    }

    if (!userId) {
      const { data, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !data?.user) {
        console.warn("❌ Auth failed for token:", userError?.message || "No user returned");
        res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
        return;
      }
      const user = data.user;
      userId = user.id;
      userEmail = user.email;
      req.user = {
        sub: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      };
    }

    // Look up user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      req.userProfile = profile;
    }

    next();
  } catch (error) {
    console.error("❌ Auth middleware catch error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block.
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (token) {
      let userId: string | null = null;
      if (SUPABASE_JWT_SECRET) {
        try {
          const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);
          const { payload } = await jwtVerify(token, secret, {
            audience: "authenticated",
          });
          userId = payload.sub as string;
          req.user = payload as unknown as JWTPayload;
        } catch {}
      }

      if (!userId) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
          req.user = {
            sub: user.id,
            email: user.email,
            aud: user.aud,
            role: user.role,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata,
          };
        }
      }

      if (userId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profile) {
          req.userProfile = profile;
        }
      }
    }
  } catch {
    // Token invalid — proceed without auth
  }

  next();
}
