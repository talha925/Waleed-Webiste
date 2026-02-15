import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// In a real application, you would validate against a database
// This is a simplified example with hardcoded credentials
const VALID_EMAIL = 'admin@example.com';
const VALID_PASSWORD = 'admin123';

export async function POST(request: Request) {
  try {
    const { email, password }: LoginRequest = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials (in a real app, check against database)
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default_secret_replace_in_production'
    );
    
    const token = await new SignJWT({ 
      id: '1',
      email: email,
      name: 'Admin User',
      role: 'admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Set HTTP-only cookie
    cookies().set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'strict',
    });

    // Return token and user data to client
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: '1',
        name: 'Admin User',
        email: email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}