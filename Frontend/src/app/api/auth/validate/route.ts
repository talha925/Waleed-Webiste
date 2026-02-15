import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  exp?: number;
  iat?: number;
}

interface ValidateResponse {
  message: string;
  user?: JWTPayload;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default_secret_replace_in_production'
    );
    
    const { payload } = await jwtVerify(token, secret) as { payload: JWTPayload };
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return NextResponse.json(
        { message: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      message: 'Token is valid',
      user: payload 
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }
}