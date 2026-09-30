'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      // Exclude admin pages from public visitor stats if desired, or track with path
      // Don't track if in non-browser environment
      if (typeof window === 'undefined') return;

      // Check session storage to avoid spamming on internal navigation
      const now = Date.now();
      const lastVisit = sessionStorage.getItem('fixit_last_visit');
      if (lastVisit && now - parseInt(lastVisit, 10) < 15 * 60 * 1000) {
        return;
      }

      // Generate or retrieve persistent unique device/visitor ID
      let deviceId = localStorage.getItem('fixit_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
        localStorage.setItem('fixit_device_id', deviceId);
      }

      sessionStorage.setItem('fixit_last_visit', now.toString());

      fetch('/api/analytics/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          path: pathname || window.location.pathname || '/',
        }),
        keepalive: true,
      }).catch(() => {
        // Silently catch tracking errors so user experience is not impacted
      });
    } catch {
      // Ignore client tracking errors
    }
  }, [pathname]);

  return null;
}
