import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  let brand;
  try {
    const { getBrandConfigByHost } = await import('@config/index');
    brand = getBrandConfigByHost(host);
  } catch (e) {
    brand = { brandId: 'unknown', apiBaseUrl: config.api.baseUrl, siteUrl: config.api.siteUrl };
  }

  const backendUrl = `${brand.apiBaseUrl}/api/blogs`;

  try {
    console.log(`Health check - Testing backend connectivity for brand: ${brand.brandId}`);
    console.log('Target URL:', backendUrl);

    // Test backend connectivity with a simple GET request
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const isBackendHealthy = response.ok;
    const backendStatus = response.status;

    return NextResponse.json({
      status: 'healthy',
      brand: brand.brandId,
      timestamp: new Date().toISOString(),
      backend: {
        url: backendUrl,
        healthy: isBackendHealthy,
        status: backendStatus,
        statusText: response.statusText
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        apiBaseUrl: brand.apiBaseUrl,
        siteUrl: brand.siteUrl
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        brand: brand.brandId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        backend: {
          url: backendUrl,
          healthy: false,
          error: error instanceof Error ? error.name : 'Unknown'
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          apiBaseUrl: brand.apiBaseUrl,
          siteUrl: brand.siteUrl
        }
      },
      { status: 503 }
    );
  }
}