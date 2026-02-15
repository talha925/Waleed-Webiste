import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Simple SSE stream for admin dashboards. In production, hook into your backend/Redis.
export async function GET(request: NextRequest) {
  try {
    const encoder = new TextEncoder();
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic') || 'admin';

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (data: Record<string, any>) => {
          const payload = `data: ${JSON.stringify({ topic, ...data })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };

        // Initial event to confirm subscription
        send({ type: 'init', timestamp: Date.now() });

        // Heartbeat to keep the connection alive
        const heartbeat = setInterval(() => {
          send({ type: 'heartbeat', timestamp: Date.now() });
        }, 20000);

        const abort = () => {
          clearInterval(heartbeat);
          try { controller.close(); } catch { }
        };

        // Close when client disconnects
        request.signal.addEventListener('abort', abort);
      },
      cancel() {
        // Connection closed by client
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        // Disable intermediate buffering (important for Vercel)
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'SSE setup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}