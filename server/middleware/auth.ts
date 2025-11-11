import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase";
import { serverError, clientError } from "../lib/respond";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token: string | null = null;

    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if ((req as any).cookies && (req as any).cookies.sv_session) {
      // Fall back to sv_session cookie
      token = (req as any).cookies.sv_session;
    } else if (req.headers.cookie) {
      // Parse cookie header manually if cookieParser didn't work
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const c of cookies) {
        if (c.startsWith("sv_session=")) {
          token = c.split("=").slice(1).join("=");
          break;
        }
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify JWT token
    const SESSION_SECRET =
      process.env.SESSION_JWT_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    // If a session secret is not configured, attempt to verify using Supabase
    // access token (sb_access_token) as a fallback. This supports preview/dev
    // environments where the server does not sign its own JWTs but the client
    // still has a Supabase session cookie or bearer token.
    if (!SESSION_SECRET) {
      try {
        // Try sb_access_token cookie first, then Authorization Bearer token
        const supabaseToken =
          (req as any).cookies?.sb_access_token ||
          (authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null);

        if (!supabaseToken) {
          return res.status(401).json({ error: "Session secret not configured and no Supabase token provided" });
        }

        const { data, error } = await supabase.auth.getUser(supabaseToken);
        if (error || !data.user) {
          return res.status(401).json({ error: "Invalid Supabase session" });
        }

        // Attach Supabase user object
        req.user = data.user;
        return next();
      } catch (err) {
        console.error("Supabase fallback auth error:", err);
        return res.status(401).json({ error: "Authentication failed" });
      }
    }

    const decoded = jwt.verify(token, SESSION_SECRET) as {
      sub: string;
      uid?: string;
    };

    // Get user from database
    let user = null;
    if (decoded.uid) {
      // Email/password session
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", decoded.uid)
        .single();

      if (error || !data) {
        return res.status(401).json({
          success: false,
          error: "User not found",
        });
      }
      user = data;
    } else {
      // Wallet-based session
      const walletAddress = decoded.sub;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("primary_wallet_address", walletAddress.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") {
        return serverError(res, error, 500);
      }
      user = data || null;
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// For API routes that use session cookies
export const sessionAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Get session from cookies or authorization header
  let sessionToken = req.cookies?.sv_session;
  
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.split(' ')[1];
  }

  console.log('Session token found:', !!sessionToken);
  
  if (!sessionToken) {
    console.log('No session token found in request');
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }

  // Verify session with Supabase
  console.log('Verifying session with Supabase...');
  
  try {
    // Remove 'Bearer ' prefix if present
    const token = sessionToken.replace(/^Bearer\s+/, '');
    
    // Use Supabase's getUser method to verify the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log('Supabase auth response:', { 
      hasUser: !!user, 
      error: userError ? userError.message : 'No error',
      userId: user?.id
    });
    
    if (userError || !user) {
      console.error('Authentication failed:', {
        error: userError ? userError.message : 'No user returned',
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      return res.status(401).json({ error: userError?.message || 'Authentication failed', details: 'Please log in again' });
    }

    // Get the full user from the database
    console.log('Fetching user...', { userId: user.id });
    const { data: userData, error: dbUserError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
      
    console.log('User fetch result:', {
      hasUser: !!userData,
      error: dbUserError ? dbUserError.message : 'No error',
      userId: userData?.id
    });
    
    if (dbUserError || !userData) {
      console.error('Failed to fetch user:', {
        error: dbUserError,
        userId: user.id,
        query: `SELECT * FROM users WHERE auth_id = '${user.id}'`
      });
      return res.status(401).json({ error: 'User not found', details: dbUserError?.message || 'No user found with the provided ID' });
    }

    console.log('User authenticated successfully:', { userId: user.id, email: user.email });
    
    // Attach user to request object
    req.user = { ...user, ...userData };
    next();
  } catch (error) {
    console.error("Session auth error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
