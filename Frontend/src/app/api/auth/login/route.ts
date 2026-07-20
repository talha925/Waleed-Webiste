import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import config from '@/lib/config';
import { getBrandConfigByHost } from '@config/index';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const credentials = await request.json();
    const host = request.headers.get('host') || '';
    const brand = getBrandConfigByHost(host);

    // Call REAL Backend API
    const response = await fetch(`${brand.apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    const { token, refreshToken, expiresIn, data: userData } = data;
    const { user } = userData;

    // Set HTTP-only cookie with the REAL token from Backend
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days (match Backend JWT expiry)
      sameSite: 'strict',
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      refreshToken,
      expiresIn,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}