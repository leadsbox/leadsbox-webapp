import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Edit, Plus, Trash2, Users } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { toast } from 'react-toastify';

interface Props {
  selectedOrgId: string;
}

type MemberVM = {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  addedAt: string;
};

export const MembersTab: React.FC<Props> = ({ selectedOrgId }) => {
  const [members, setMembers] = useState<MemberVM[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteLink, setInviteLink] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedOrgId) return;
      try {
        const resp = await client.get(`/orgs/${selectedOrgId}/members`);
        const list: Array<any> = resp?.data?.data?.members || [];
        const mapped = list.map((m) => ({
          membershipId: m.id,
          userId: m.userId,
          name: m.user?.name || m.user?.username || 'User',
          email: m.user?.email || '',
          avatar: m.user?.profileImage || m.user?.avatar || null,
          role: m.role,
          addedAt: m.addedAt,
        })) as MemberVM[];
        setMembers(mapped);
      } catch (e) {
        console.error('Failed to load members', e);
      }
    };
    fetchMembers();
  }, [selectedOrgId]);

  useEffect(() => {
    if (!memberDialogOpen) {
      setInviteEmail('');
      setInviteRole('MEMBER');
      setInviteLink('');
      setGeneratingInvite(false);
    }
  }, [memberDialogOpen]);

  const getRoleBadgeColor = (role: MemberVM['role']) => {
    switch (role) {
      case 'OWNER':
        return 'bg-red-500/10 text-red-400';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-400';
      case 'MEMBER':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const inviteMember = async () => {
    if (!selectedOrgId) {
      toast.error('Select an organization first');
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error('Enter member email');
      return;
    }
    try {
      await client.post(`/orgs/${selectedOrgId}/members`, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      setInviteRole('MEMBER');
      setInviteLink('');
      setMemberDialogOpen(false);
      const resp = await client.get(`/orgs/${selectedOrgId}/members`);
      const list: Array<any> = resp?.data?.data?.members || [];
      setMembers(list.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user?.name || m.user?.username || 'User',
        email: m.user?.email || '',
        avatar: m.user?.profileImage || m.user?.avatar || null,
        role: m.role,
        addedAt: m.addedAt,
      })) as MemberVM[]);
      toast.success('Member added');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add member');
    }
  };

  const generateInvite = async () => {
    if (!selectedOrgId) {
      toast.error('Select an organization first');
      return;
    }

    try {
      setGeneratingInvite(true);
      const res = await client.post(endpoints.orgInvite(selectedOrgId), {
        role: inviteRole,
        email: inviteEmail.trim() || undefined,
      });
      const link = res?.data?.data?.inviteUrl as string | undefined;
      if (link) {
        setInviteLink(link);
        toast.success('Invite link generated');
      } else {
        toast.error('Failed to generate invite link');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate invite link');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied');
    } catch (e) {
      toast.error('Unable to copy invite link');
    }
  };

  const updateMemberRole = async (userId: string, role: MemberVM['role']) => {
    if (!selectedOrgId) return;
    try {
      await client.patch(`/orgs/${selectedOrgId}/members/${userId}/role`, { role });
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
      toast.success('Member role updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update role');
    }
  };

  const removeMember = async (userId: string) => {
    if (!selectedOrgId) return;
    try {
      await client.delete(`/orgs/${selectedOrgId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center'>
          <Users className='h-5 w-5 mr-2' />
          Team Members
        </CardTitle>
        <Button onClick={() => setMemberDialogOpen(true)} disabled={!selectedOrgId}>
          <Plus className='h-4 w-4 mr-2' />
          Invite Member
        </Button>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <Table className='min-w-[720px]'>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className='flex items-center space-x-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback>{member.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='font-medium'>{member.name}</div>
                      <div className='text-sm text-muted-foreground'>{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.role === 'OWNER' ? (
                    <Badge variant='outline' className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  ) : (
                    <Select value={member.role} onValueChange={(v) => updateMemberRole(member.userId, v as any)}>
                      <SelectTrigger className='w-[140px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='MEMBER'>Member</SelectItem>
                        <SelectItem value='ADMIN'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>{new Date(member.addedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant='outline' className='bg-green-500/10 text-green-400'>
                    Active
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex items-center space-x-2'>
                    <Button variant='ghost' size='icon' disabled>
                      <Edit className='h-4 w-4' />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='ghost' size='icon' className='text-destructive' disabled={member.role === 'OWNER'}>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.name} from the organization? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90' onClick={() => removeMember(member.userId)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Invite Member Modal */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Add a user to this organization.</DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <Label htmlFor='invite-email'>User Email</Label>
              <Input id='invite-email' value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder='user@example.com' />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MEMBER'>Member</SelectItem>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {inviteLink && (
            <div className='mt-4 space-y-2'>
              <Label>Invitation Link</Label>
              <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                <Input readOnly value={inviteLink} />
                <Button
                  type='button'
                  variant='outline'
                  onClick={copyInviteLink}
                  className='whitespace-nowrap'
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Copy Link
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setMemberDialogOpen(false)}
            >
              Cancel
            </Button>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
              <Button
                type='button'
                variant='secondary'
                onClick={generateInvite}
                disabled={!selectedOrgId || generatingInvite}
              >
                <Copy className='h-4 w-4 mr-2' />
                Generate Invite Link
              </Button>
              <Button type='button' onClick={inviteMember} disabled={!selectedOrgId}>
                <Plus className='h-4 w-4 mr-2' />
                Add Member
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MembersTab;
