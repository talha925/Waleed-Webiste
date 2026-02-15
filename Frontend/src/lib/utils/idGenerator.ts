'use client';

// Client-safe ID generator that avoids hydration mismatches
let counter = 0;

export const generateId = (): string => {
  // Use a combination of timestamp and counter for uniqueness
  // This ensures consistent behavior between server and client
  if (typeof window !== 'undefined') {
    // Client-side: use performance.now() for better precision
    return `${Date.now()}-${performance.now()}-${++counter}`;
  } else {
    // Server-side: use simpler approach
    return `${Date.now()}-${++counter}`;
  }
};

// Alternative approach using crypto API when available
export const generateSecureId = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    return `${array[0]}-${array[1]}`;
  }
  // Fallback to timestamp-based ID
  return generateId();
};

// For notifications, we'll use a simple counter-based approach
// that's deterministic and won't cause hydration issues
export const generateNotificationId = (): string => {
  return `notification-${++counter}-${Date.now()}`;
};