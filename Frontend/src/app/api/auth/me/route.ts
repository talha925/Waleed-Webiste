import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token found' },
        { status: 401 }
      );
    }

    // Verify the token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default_secret_replace_in_production'
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return NextResponse.json(
        { message: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'User authenticated',
      token,
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }
} 