import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/db';

// Hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Generate random salt
function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST - Setup initial admin user
export async function POST(request: NextRequest) {
  try {
    const { username, password, setupKey } = await request.json();

    // Check for secure setup key from environment variables
    const validSetupKey = process.env.ADMIN_SETUP_KEY;
    if (!validSetupKey) {
      return NextResponse.json(
        { error: 'Admin setup is disabled - no setup key configured' },
        { status: 503 }
      );
    }
    
    if (setupKey !== validSetupKey) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 401 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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

    // Check if admin user already exists
    const checkPrepared = await db.prepare('SELECT COUNT(*) as count FROM admin_users WHERE username = ?');
    const existingUser = await checkPrepared.bind(username).first() as { count: number };

    if (existingUser.count > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 409 }
      );
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    // Create admin user
    const prepared = await db.prepare(`
      INSERT INTO admin_users (username, password_hash, salt, created_at, is_active)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
    `);
    
    const result = await prepared.bind(username, passwordHash, salt).run();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create admin user' },
        { status: 500 }
      );
    }

    // Log admin creation
    const logPrepared = await db.prepare(`
      INSERT INTO admin_logs (action, data, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    await logPrepared.bind(
      'admin_user_created',
      JSON.stringify({ username }),
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    ).run();

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: { username }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

// GET - Check if admin users exist
export async function GET() {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check if any admin users exist
    const prepared = await db.prepare('SELECT COUNT(*) as count FROM admin_users WHERE is_active = 1');
    const result = await prepared.first() as { count: number };

    return NextResponse.json({
      hasAdminUser: result.count > 0,
      adminCount: result.count
    });

  } catch (error) {
    console.error('Error checking admin users:', error);
    return NextResponse.json(
      { error: 'Failed to check admin users' },
      { status: 500 }
    );
  }
}
