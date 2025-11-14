import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';

interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

// Hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Generate random salt
function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Verify password
function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashToCompare = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashToCompare, 'hex'));
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST - Admin login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check rate limiting
    const rateLimitStmt = await db.prepare('SELECT failed_attempts, locked_until FROM admin_rate_limit WHERE ip_address = ?');
    const rateLimitCheck = await rateLimitStmt.bind(clientIP).first() as { failed_attempts: number; locked_until: string } | null;

    if (rateLimitCheck) {
      const now = new Date();
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      
      if (lockedUntil && now < lockedUntil) {
        const remainingTime = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${remainingTime} minutes.` },
          { status: 429 }
        );
      }
    }

    // Get admin user from database
    const prepared = await db.prepare('SELECT * FROM admin_users WHERE username = ? AND is_active = 1');
    const user = await prepared.bind(username).first() as AdminUser | null;

    if (!user) {
      // Simulate password verification to prevent timing attacks
      const fakeSalt = generateSalt();
      hashPassword(password, fakeSalt);
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash, user.salt)) {
      // Increment failed attempts
      const failedAttempts = rateLimitCheck ? rateLimitCheck.failed_attempts + 1 : 1;
      const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      
      const rateLimitUpdateStmt = await db.prepare(`
        INSERT OR REPLACE INTO admin_rate_limit (ip_address, failed_attempts, locked_until, last_attempt)
        VALUES (?, ?, ?, datetime('now'))
      `);
      await rateLimitUpdateStmt.bind(clientIP, failedAttempts, lockedUntil).run();
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    const resetRateLimitStmt = await db.prepare('DELETE FROM admin_rate_limit WHERE ip_address = ?');
    await resetRateLimitStmt.bind(clientIP).run();

    // Update last login
    const updatePrepared = await db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    await updatePrepared.bind(user.id).run();

    // Generate session token
    const sessionToken = generateSessionToken();
    
    // Log successful login
    const logPrepared = await db.prepare(`
      INSERT INTO admin_logs (action, data, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    await logPrepared.bind(
      'admin_login',
      JSON.stringify({ username: user.username }),
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    ).run();

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        last_login: user.last_login
      }
    });

    // Set secure session cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Error in admin auth:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET - Check admin session status
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    // In a real app, you'd validate the session token against a sessions table
    // For now, we'll just check if the cookie exists and is valid format
    if (sessionToken && sessionToken.length === 64) {
      return NextResponse.json({
        authenticated: true,
        // You could add more user info here
      });
    }

    return NextResponse.json({ authenticated: false });

  } catch (error) {
    console.error('Error checking admin session:', error);
    return NextResponse.json({ authenticated: false });
  }
}

// DELETE - Admin logout
export async function DELETE(request: NextRequest) {
  try {
    const db = getDatabase();
    
    if (db) {
      // Log logout
      const logPrepared = await db.prepare(`
        INSERT INTO admin_logs (action, data, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `);
      await logPrepared.bind(
        'admin_logout',
        JSON.stringify({}),
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      ).run();
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear session cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Error in admin logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
