'use client';

import React from 'react';
import { useSSE } from '@/hooks/useSSE';

export default function RealtimeStatus() {
  const { isConnected, lastEvent, error } = useSSE({ autoConnect: true });

  const statusColor = isConnected ? 'bg-green-500' : error ? 'bg-yellow-500' : 'bg-red-500';
  const label = isConnected ? 'Realtime: Connected' : error ? 'Realtime: Error' : 'Realtime: Disconnected';
  const time = lastEvent?.timestamp ? new Date(lastEvent.timestamp).toLocaleTimeString() : null;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
      <span className="text-sm text-gray-700">{label}</span>
      {time && <span className="text-xs text-gray-500">({time})</span>}
    </div>
  );
}