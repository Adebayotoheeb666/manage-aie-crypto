import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;

    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if ((req as any).cookies && (req as any).cookies.sv_session) {
      // Fall back to sv_session cookie
      token = (req as any).cookies.sv_session;
    } else if (req.headers.cookie) {
      // Parse cookie header manually if cookieParser didn't work
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      for (const c of cookies) {
        if (c.startsWith('sv_session=')) {
          token = c.split('=').slice(1).join('=');
          break;
        }
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify JWT token
    const SESSION_SECRET = process.env.SESSION_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!SESSION_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Session secret not configured'
      });
    }

    const decoded = jwt.verify(token, SESSION_SECRET) as { sub: string; uid?: string };

    // Get user from database
    let user = null;
    if (decoded.uid) {
      // Email/password session
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.uid)
        .single();

      if (error || !data) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      user = data;
    } else {
      // Wallet-based session
      const walletAddress = decoded.sub;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('primary_wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
      user = data || null;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// For API routes that use session cookies
export const sessionAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get session from cookies
    const sessionToken = req.cookies?.sb_access_token;
    
    if (!sessionToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired. Please log in again.' 
      });
    }

    // Verify session with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session. Please log in again.' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Session auth error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};
