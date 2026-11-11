import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Next.js App Router API Proxy for /api/ad-visit
 * Proxies client tracking beacons seamlessly to the Express backend.
 */
export async function POST(req: NextRequest) {
    try {
        const host = req.headers.get('host') || '';
        const { getBrandConfigByHost } = await import('@config/index');
        const brand = getBrandConfigByHost(host);

        const apiBase = (brand?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000')
            .replace('localhost', '127.0.0.1');

        const rawBody = await req.text();

        // Forward client metadata headers
        const clientIp = req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

        const forwardHeaders: Record<string, string> = {
            'Content-Type': 'text/plain',
            'x-brand-id': brand.brandId,
            'cf-connecting-ip': clientIp,
            'x-forwarded-for': clientIp,
            'user-agent': req.headers.get('user-agent') || ''
        };

        if (req.headers.get('cf-ipcountry')) {
            forwardHeaders['cf-ipcountry'] = req.headers.get('cf-ipcountry')!;
        }
        if (req.headers.get('cf-timezone')) {
            forwardHeaders['cf-timezone'] = req.headers.get('cf-timezone')!;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${apiBase}/api/ad-visit`, {
            method: 'POST',
            headers: forwardHeaders,
            body: rawBody,
            signal: controller.signal
        });

        clearTimeout(timeout);

        const textResponse = await res.text();
        return new NextResponse(textResponse, {
            status: res.status,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err: any) {
        console.error('❌ /api/ad-visit proxy error:', err?.message || err);
        return NextResponse.json({ error: 'Proxy failed', details: err?.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-brand-id'
        }
    });
}

