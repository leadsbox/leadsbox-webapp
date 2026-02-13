type MonitoredFlow = 'inbox_send' | 'sales_quick_capture' | 'followup_schedule';

type FlowMetric = {
  total: number;
  success: number;
  failure: number;
  recentDurations: number[];
  recentFailures: number[];
  lastStatus?: number;
  lastUpdatedAt?: string;
};

type MonitoringState = {
  flows: Record<MonitoredFlow, FlowMetric>;
  alertCooldowns: Record<string, number>;
};

type FlowSnapshot = {
  total: number;
  success: number;
  failure: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  lastStatus?: number;
  lastUpdatedAt?: string;
};

type MonitoringSnapshot = {
  flows: Record<MonitoredFlow, FlowSnapshot>;
};

type ApiAlert = {
  flow: MonitoredFlow;
  title: string;
  description: string;
  severity: 'warning' | 'error';
  reason: 'latency' | 'error_rate';
};

const STORAGE_KEY = 'lb_api_monitoring_v1';
const MAX_RECENT = 40;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;
const MIN_FAILURE_SAMPLES = 8;
const FAILURE_RATE_WARN = 0.15;
const FAILURE_RATE_ERROR = 0.3;

const LATENCY_THRESHOLDS: Record<MonitoredFlow, { warning: number; error: number }> = {
  inbox_send: { warning: 2500, error: 5000 },
  sales_quick_capture: { warning: 2000, error: 4500 },
  followup_schedule: { warning: 2200, error: 4500 },
};

const createDefaultState = (): MonitoringState => ({
  flows: {
    inbox_send: { total: 0, success: 0, failure: 0, recentDurations: [], recentFailures: [] },
    sales_quick_capture: { total: 0, success: 0, failure: 0, recentDurations: [], recentFailures: [] },
    followup_schedule: { total: 0, success: 0, failure: 0, recentDurations: [], recentFailures: [] },
  },
  alertCooldowns: {},
});

const loadState = (): MonitoringState => {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as MonitoringState;
    if (!parsed?.flows) return createDefaultState();
    return {
      ...createDefaultState(),
      ...parsed,
      flows: {
        ...createDefaultState().flows,
        ...parsed.flows,
      },
    };
  } catch {
    return createDefaultState();
  }
};

const persistState = (state: MonitoringState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-blocking monitoring path.
  }
};

const quantile = (values: number[], percentile: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentile * sorted.length) - 1));
  return sorted[idx];
};

const average = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const dispatchAlert = (alert: ApiAlert): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ApiAlert>('lb:api-monitoring-alert', {
      detail: alert,
    }),
  );
};

const classifyFlow = (url?: string, method?: string): MonitoredFlow | null => {
  if (!url || !method) return null;
  const normalizedUrl = url.toLowerCase();
  const normalizedMethod = method.toLowerCase();

  if (normalizedMethod === 'post' && /\/threads\/[^/]+\/reply$/.test(normalizedUrl)) {
    return 'inbox_send';
  }

  if (normalizedMethod === 'post' && normalizedUrl.includes('/sales/quick-capture')) {
    return 'sales_quick_capture';
  }

  if (normalizedMethod === 'post' && /\/followups\/?$/.test(normalizedUrl)) {
    return 'followup_schedule';
  }

  return null;
};

export const getMonitoredFlow = (url?: string, method?: string): MonitoredFlow | null =>
  classifyFlow(url, method);

export const recordApiFlowResult = (params: {
  flow: MonitoredFlow;
  durationMs: number;
  status?: number;
  ok: boolean;
}): void => {
  const state = loadState();
  const flowState = state.flows[params.flow];
  if (!flowState) {
    return;
  }

  flowState.total += 1;
  flowState.success += params.ok ? 1 : 0;
  flowState.failure += params.ok ? 0 : 1;
  flowState.lastStatus = params.status;
  flowState.lastUpdatedAt = new Date().toISOString();
  flowState.recentDurations = [...flowState.recentDurations, Math.max(0, Math.round(params.durationMs))].slice(-MAX_RECENT);
  flowState.recentFailures = [...flowState.recentFailures, params.ok ? 0 : 1].slice(-MAX_RECENT);

  const errorRate = flowState.recentFailures.length ? average(flowState.recentFailures) : 0;
  const p95 = quantile(flowState.recentDurations, 0.95);
  const thresholds = LATENCY_THRESHOLDS[params.flow];
  const now = Date.now();

  const maybeAlert = (reason: ApiAlert['reason'], severity: ApiAlert['severity'], title: string, description: string) => {
    const cooldownKey = `${params.flow}:${reason}:${severity}`;
    const lastShown = state.alertCooldowns[cooldownKey] || 0;
    if (now - lastShown < ALERT_COOLDOWN_MS) {
      return;
    }
    state.alertCooldowns[cooldownKey] = now;
    dispatchAlert({
      flow: params.flow,
      reason,
      severity,
      title,
      description,
    });
  };

  if (flowState.recentDurations.length >= MIN_FAILURE_SAMPLES) {
    if (p95 >= thresholds.error) {
      maybeAlert('latency', 'error', `${params.flow} is slow`, `p95 latency is ${p95}ms. Investigate performance.`);
    } else if (p95 >= thresholds.warning) {
      maybeAlert('latency', 'warning', `${params.flow} latency rising`, `p95 latency is ${p95}ms. Monitor closely.`);
    }
  }

  if (flowState.recentFailures.length >= MIN_FAILURE_SAMPLES) {
    if (errorRate >= FAILURE_RATE_ERROR) {
      maybeAlert('error_rate', 'error', `${params.flow} failures are high`, `${Math.round(errorRate * 100)}% requests failed recently.`);
    } else if (errorRate >= FAILURE_RATE_WARN) {
      maybeAlert('error_rate', 'warning', `${params.flow} failures increasing`, `${Math.round(errorRate * 100)}% requests failed recently.`);
    }
  }

  persistState(state);
};

export const getApiMonitoringSnapshot = (): MonitoringSnapshot => {
  const state = loadState();

  const toSnapshot = (flow: FlowMetric): FlowSnapshot => {
    const errorRate = flow.recentFailures.length ? average(flow.recentFailures) : 0;
    return {
      total: flow.total,
      success: flow.success,
      failure: flow.failure,
      errorRate,
      avgMs: Math.round(average(flow.recentDurations)),
      p95Ms: Math.round(quantile(flow.recentDurations, 0.95)),
      lastStatus: flow.lastStatus,
      lastUpdatedAt: flow.lastUpdatedAt,
    };
  };

  return {
    flows: {
      inbox_send: toSnapshot(state.flows.inbox_send),
      sales_quick_capture: toSnapshot(state.flows.sales_quick_capture),
      followup_schedule: toSnapshot(state.flows.followup_schedule),
    },
  };
};

export const subscribeApiMonitoringAlerts = (listener: (alert: ApiAlert) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ApiAlert>;
    if (!customEvent.detail) return;
    listener(customEvent.detail);
  };
  window.addEventListener('lb:api-monitoring-alert', handler);
  return () => {
    window.removeEventListener('lb:api-monitoring-alert', handler);
  };
};

