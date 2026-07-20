import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  // Clear the auth cookie
  const cookieStore = await cookies();
  cookieStore.delete('authToken');

  return NextResponse.json({ message: 'Logged out successfully' });
} 