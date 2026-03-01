import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface WebVitalMetric {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  url: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentLength = request.headers.get('content-length');

    if (!contentLength || contentLength === '0') {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }

    // Try to read the request body directly as JSON
    let data: WebVitalMetric;
    try {
      // Use request.json() for better JSON handling in Next.js
      data = await request.json();
    } catch (jsonError) {
      // Fallback: try reading as text for debugging
      try {
        const rawBody = await request.text();

        if (!rawBody || rawBody.trim() === '') {
          return NextResponse.json(
            { error: 'Empty request body' },
            { status: 400 }
          );
        }

        // Try manual JSON parse
        data = JSON.parse(rawBody);
      } catch (fallbackError) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        );
      }
    }

    // Validate the incoming data
    if (!data.metric || typeof data.value !== 'number' || !data.id) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // In production, you would typically:
    // 1. Store in a database (MongoDB, PostgreSQL, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Send to monitoring service (DataDog, New Relic, etc.)

    // Store the data (uncomment when ready to persist)
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, 'web-vitals.json');

      // Ensure data directory exists
      await fs.mkdir(dataDir, { recursive: true });

      // Read existing data
      let existingData: WebVitalMetric[] = [];
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      } catch (readError) {
        // No existing data file, start with empty array
      }

      // Add new data
      existingData.push(data);

      // Write back to file
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (storageError) {
      // Don't fail the request if storage fails
    }

    // Example: Store in database (uncomment when you have a database setup)
    /*
    await db.webVitals.create({
      data: {
        metric: data.metric,
        value: data.value,
        rating: data.rating,
        delta: data.delta,
        metricId: data.id,
        url: data.url,
        timestamp: new Date(data.timestamp),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    */

    // Example: Send to external analytics service
    /*
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
        },
        body: JSON.stringify({
          ...data,
          userAgent: request.headers.get('user-agent'),
          ip: request.ip || request.headers.get('x-forwarded-for')
        })
      });
    }
    */

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for analytics dashboard
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'web-vitals.json');

    // Read existing data
    let webVitalsData: WebVitalMetric[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      webVitalsData = JSON.parse(fileContent);
    } catch (readError) {
      // No existing data file
    }

    // Return the actual data
    return NextResponse.json({
      message: 'Web vitals analytics data',
      totalRecords: webVitalsData.length,
      data: webVitalsData.slice(-50) // Return last 50 records
    }, { status: 200 });
  } catch (error) {
    console.error('Error reading web vitals data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve web vitals data' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}