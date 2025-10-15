import { AxiosError } from 'axios';

type ErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
  code?: string;
};

const NETWORK_PATTERN = /network/i;
const TOKEN_PATTERN = /token/i;
const EXPIRED_PATTERN = /expire/i;
const INVALID_PATTERN = /invalid/i;
const LOCK_PATTERN = /(locked|lockout|too many attempts)/i;
const RATE_LIMIT_PATTERN = /(rate limit|too many)/i;

const extractPayloadMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as ErrorPayload & { errors?: Array<{ message?: string }> };
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.errors)) {
    const candidate = data.errors.find((item) => typeof item?.message === 'string');
    if (candidate?.message) return candidate.message;
  }
  return undefined;
};

const sanitizeMessage = (message: string | undefined, fallback: string): string => {
  if (!message) return fallback;

  const normalized = message.trim();
  if (!normalized) return fallback;

  if (TOKEN_PATTERN.test(normalized) && EXPIRED_PATTERN.test(normalized)) {
    return 'This link has expired. Request a new one and try again.';
  }

  if (TOKEN_PATTERN.test(normalized) && INVALID_PATTERN.test(normalized)) {
    return 'This link is invalid. Request a fresh one from your email.';
  }

  if (LOCK_PATTERN.test(normalized)) {
    return 'Your account is temporarily locked. Wait a moment and try again, or reset your password.';
  }

  if (RATE_LIMIT_PATTERN.test(normalized)) {
    return 'You’ve made too many attempts. Please wait and try again shortly.';
  }

  // Do not surface potentially sensitive authentication details.
  const sensitivePattern = /(user|account|email|password|credential|does not exist|not found)/i;
  if (sensitivePattern.test(normalized)) {
    return fallback;
  }

  return normalized;
};

export const getAuthErrorMessage = (
  error: unknown,
  fallback: string,
  options: { unauthorizedMessage?: string } = {}
): string => {
  const unauthorizedMessage =
    options.unauthorizedMessage ?? 'We couldn’t verify those details. Please try again.';

  if (error instanceof AxiosError || (typeof error === 'object' && error !== null && 'isAxiosError' in error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const payloadMessage = extractPayloadMessage(axiosError.response?.data);

    if (status === 401 || status === 403) {
      return sanitizeMessage(payloadMessage, unauthorizedMessage);
    }

    if (status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }

    if (status && status >= 500) {
      return 'We’re experiencing a server issue. Please try again shortly.';
    }

    if (status && status >= 400) {
      return sanitizeMessage(payloadMessage, fallback);
    }

    const networkMessage = axiosError.message;
    if (networkMessage && NETWORK_PATTERN.test(networkMessage)) {
      return 'We’re having trouble connecting. Check your internet connection and try again.';
    }
  }

  if (error instanceof Error) {
    if (NETWORK_PATTERN.test(error.message)) {
      return 'We’re having trouble connecting. Check your internet connection and try again.';
    }
  }

  return fallback;
};

export const createAuthError = (error: unknown, fallback: string, options?: { unauthorizedMessage?: string }) => {
  const message = getAuthErrorMessage(error, fallback, options);
  return new Error(message);
};
