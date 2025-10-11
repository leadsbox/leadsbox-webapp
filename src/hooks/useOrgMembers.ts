import { useCallback, useEffect, useMemo, useState } from 'react';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';

export interface OrgMemberUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImage: string | null;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'OWNER';
  addedAt: string;
  user: OrgMemberUser;
}

interface UseOrgMembersResult {
  members: OrgMember[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getMemberByUserId: (userId?: string | null) => OrgMember | undefined;
}

export const useOrgMembers = (): UseOrgMembersResult => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const orgId = getOrgId();
    if (!orgId) {
      setMembers([]);
      setError('Organization context not set');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await client.get(endpoints.orgMembers(orgId));
      const payload = response?.data?.data?.members || [];
      setMembers(payload);
    } catch (err: any) {
      console.error('Failed to load organization members', err);
      setMembers([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load organization members'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const getMemberByUserId = useCallback(
    (userId?: string | null) =>
      members.find((member) => member.userId === userId),
    [members]
  );

  return useMemo(
    () => ({
      members,
      isLoading,
      error,
      refresh: fetchMembers,
      getMemberByUserId,
    }),
    [members, isLoading, error, fetchMembers, getMemberByUserId]
  );
};
