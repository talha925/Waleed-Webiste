import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

export async function GET(request: NextRequest) {
  try {
    console.log('Health check - Testing backend connectivity');
    console.log('API_URL:', API_URL);
    console.log('Environment NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Test backend connectivity with a simple GET request
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const isBackendHealthy = response.ok;
    const backendStatus = response.status;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      backend: {
        url: API_URL,
        healthy: isBackendHealthy,
        status: backendStatus,
        statusText: response.statusText
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        backend: {
          url: API_URL,
          healthy: false,
          error: error instanceof Error ? error.name : 'Unknown'
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL
        }
      },
      { status: 503 }
    );
  }
}