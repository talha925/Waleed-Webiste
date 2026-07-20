import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBrandConfigByHost } from '@config/index';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('authToken')?.value;
    
    // We also need the refreshToken from the body or cookies, but frontend doesn't store refreshToken in cookies.
    // Wait, the client sends refreshToken in the body: { refreshToken }
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token provided' },
        { status: 400 }
      );
    }

    const host = request.headers.get('host') || '';
    const brand = getBrandConfigByHost(host);

    // Call REAL Backend API
    const response = await fetch(`${brand.apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Failed to refresh token' },
        { status: response.status }
      );
    }

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = data;

    // Set the new token in HTTP-only cookie
    cookieStore.set({
      name: 'authToken',
      value: accessToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn || 60 * 60 * 24 * 7,
      sameSite: 'strict',
    });

    return NextResponse.json({
      message: 'Token refreshed successfully',
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresIn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { message: 'An error occurred during token refresh' },
      { status: 500 }
    );
  }
}