const INVITE_STORAGE_KEY = 'lb_pending_invite_token';

const hasWindow = typeof window !== 'undefined';

export const savePendingInvite = (token: string | null) => {
  if (!hasWindow) return;
  try {
    if (token && token.length > 0) {
      window.localStorage.setItem(INVITE_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(INVITE_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist invite token', error);
  }
};

export const loadPendingInvite = (): string | null => {
  if (!hasWindow) return null;
  try {
    return window.localStorage.getItem(INVITE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read invite token', error);
    return null;
  }
};

export const clearPendingInvite = () => savePendingInvite(null);
