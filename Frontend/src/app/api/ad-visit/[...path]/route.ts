import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Next.js App Router API Proxy for /api/ad-visit/admin/*
 * Handles super-admin intelligence queries and CSV streaming exports.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    try {
        const resolvedParams = await params;
        const subPath = (resolvedParams?.path || []).join('/');

        const host = req.headers.get('host') || '';
        const { getBrandConfigByHost } = await import('@config/index');
        const brand = getBrandConfigByHost(host);

        const apiBase = (brand?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000')
            .replace('localhost', '127.0.0.1');

        const searchParams = req.nextUrl.searchParams.toString();
        const targetUrl = `${apiBase}/api/ad-visit/${subPath}${searchParams ? `?${searchParams}` : ''}`;

        const authHeader = req.headers.get('authorization') || '';
        const clientIp = req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

        const forwardHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-brand-id': req.headers.get('x-brand-id') || brand.brandId,
            'cf-connecting-ip': clientIp,
            'x-forwarded-for': clientIp,
            'user-agent': req.headers.get('user-agent') || ''
        };

        if (authHeader) {
            forwardHeaders['Authorization'] = authHeader;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const backendRes = await fetch(targetUrl, {
            method: 'GET',
            headers: forwardHeaders,
            signal: controller.signal
        });

        clearTimeout(timeout);

        // Check if response is a CSV download
        const contentType = backendRes.headers.get('content-type') || 'application/json';
        const disposition = backendRes.headers.get('content-disposition');

        const bodyData = await backendRes.text();

        const responseHeaders: Record<string, string> = {
            'Content-Type': contentType
        };
        if (disposition) {
            responseHeaders['Content-Disposition'] = disposition;
        }

        return new NextResponse(bodyData, {
            status: backendRes.status,
            headers: responseHeaders
        });
    } catch (err: any) {
        console.error('❌ /api/ad-visit/[...path] proxy error:', err?.message || err);
        return NextResponse.json({ error: 'Proxy failed', details: err?.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-brand-id'
        }
    });
}

