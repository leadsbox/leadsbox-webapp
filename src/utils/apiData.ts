import type { FollowUpRule } from '@/types';

type UnknownRecord = Record<string, unknown>;

export const extractFollowUps = (payload: unknown): FollowUpRule[] => {
  if (Array.isArray(payload)) {
    return payload as FollowUpRule[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as UnknownRecord;

    if (Array.isArray(record.followUps)) {
      return record.followUps as FollowUpRule[];
    }

    const data = record.data;
    if (Array.isArray(data)) {
      return data as FollowUpRule[];
    }

    if (data && typeof data === 'object') {
      const nested = data as UnknownRecord;
      if (Array.isArray(nested.followUps)) {
        return nested.followUps as FollowUpRule[];
      }
    }
  }

  return [];
};
