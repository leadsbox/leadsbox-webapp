import client from '@/api/client';
import { endpoints } from '@/api/config';
import { trackEvent } from '@/lib/analytics';

type TelemetryMetadata = Record<string, unknown>;

export const trackAppEvent = (
  eventType: string,
  metadata: TelemetryMetadata = {}
): void => {
  trackEvent(eventType, metadata);
  void client
    .post(endpoints.analytics.events, {
      eventType,
      metadata,
      occurredAt: new Date().toISOString(),
    })
    .catch(() => {
      // Best-effort telemetry; never block product actions.
    });
};

export const trackMobileBlocked = (
  feature: string,
  reason: string,
  metadata: TelemetryMetadata = {}
): void => {
  trackAppEvent('mobile_blocked', {
    feature,
    reason,
    viewportWidth:
      typeof window !== 'undefined' ? window.innerWidth : undefined,
    viewportHeight:
      typeof window !== 'undefined' ? window.innerHeight : undefined,
    ...metadata,
  });
};

