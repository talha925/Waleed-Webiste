import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the current token from cookies
    const cookieStore = cookies();
    const currentToken = cookieStore.get('authToken')?.value;
    
    if (!currentToken) {
      return NextResponse.json(
        { message: 'No token found' },
        { status: 401 }
      );
    }

    // Verify the current token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default_secret_replace_in_production'
    );
    
    const { payload } = await jwtVerify(currentToken, secret);
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return NextResponse.json(
        { message: 'Token expired' },
        { status: 401 }
      );
    }

    // Create a new token
    const newToken = await new SignJWT({ 
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Set the new token in HTTP-only cookie
    cookieStore.set({
      name: 'authToken',
      value: newToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'strict',
    });

    return NextResponse.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { message: 'Failed to refresh token' },
      { status: 401 }
    );
  }
} 