import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, CircleDashed, Loader2, MoreHorizontal, RefreshCcw, Send, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import TemplatePreview from './components/TemplatePreview';
import TemplateStatusBadge from './components/TemplateStatusBadge';
import templateApi from '@/api/templates';
import type { Template, TemplateStatus, TemplateCategory } from '@/types';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/ui/ux/confirm-dialog';

const ACTION_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
};

const statusSupportsResubmit = (status: TemplateStatus) => status === 'REJECTED';
const statusSupportsSubmit = (status: TemplateStatus) => status === 'DRAFT';
const statusSupportsDeprecate = (status: TemplateStatus) => status === 'APPROVED';

const TemplateDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const isTestMode = Boolean(import.meta.env.VITE_APP_ENV?.toLowerCase() === 'test');

  const templateQuery = useQuery({
    queryKey: ['template', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('Missing template id');
      const payload = await templateApi.detail(id);
      if (!payload) throw new Error('Template not found');
      return payload;
    },
  });

  const template = templateQuery.data as Template | undefined;
  const isLoading = templateQuery.isLoading;
  const isFetching = templateQuery.isFetching;

  const mutateWrapper = useMutation({
    mutationFn: async ({ action, templateId }: { action: 'submit' | 'resubmit' | 'deprecate'; templateId: string }) => {
      if (action === 'submit') {
        return templateApi.submit(templateId);
      }
      if (action === 'resubmit') {
        return templateApi.resubmit(templateId);
      }
      if (action === 'deprecate') {
        return templateApi.deprecate(templateId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async (payload: { phoneNumber: string; values: Record<string, string> }) => {
      if (!id) throw new Error('Missing template id');
      return templateApi.sendTest(id, payload);
    },
  });
  const deleteMutation = useMutation<void, unknown, { id: string; name: string }>({
    mutationFn: async ({ id: templateId }) => {
      await templateApi.remove(templateId);
    },
    onSuccess: (_, variables) => {
      notify.success({
        key: `templates:${variables.id}:deleted`,
        title: 'Template deleted',
        description: `"${variables.name}" has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.removeQueries({ queryKey: ['template', variables.id], exact: true });
      navigate('/dashboard/templates');
    },
    onError: (error, variables) => {
      let message = 'Failed to delete template.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String((error as { message?: string }).message || message);
      }
      notify.error({
        key: `templates:${variables.id}:delete:error`,
        title: 'Unable to delete template',
        description: message,
      });
    },
  });

  const status = template?.status ?? 'DRAFT';

  const templatePlaceholders = useMemo(() => template?.variables ?? [], [template?.variables]);

  const handleSubmit = (mode: 'submit' | 'resubmit') => {
    if (!template) return;
    mutateWrapper.mutate(
      { action: mode, templateId: template.id },
      {
        onSuccess: () => {
          notify.success({
            key: `templates:${template.id}:${mode}`,
            title: mode === 'submit' ? 'Template submitted' : 'Template resubmitted',
            description: mode === 'submit' ? 'We sent this template to Meta for review.' : 'Updated template sent for approval again.',
          });
        },
        onError: (error: any) => {
          notify.error({
            key: `templates:${template.id}:${mode}:error`,
            title: 'Action failed',
            description: error?.message || 'Please try again.',
          });
        },
      },
    );
  };

  const handleDeprecate = () => {
    if (!template) return;
    mutateWrapper.mutate(
      { action: 'deprecate', templateId: template.id },
      {
        onSuccess: () => {
          notify.success({
            key: `templates:${template.id}:deprecate`,
            title: 'Template deprecated',
            description: 'Template has been retired. Existing automations remain untouched.',
          });
        },
        onError: (error: any) => {
          notify.error({
            key: `templates:${template.id}:deprecate:error`,
            title: 'Unable to deprecate template',
            description: error?.message || 'Please try again.',
          });
        },
      },
    );
  };

  const handleDeleteTemplate = async () => {
    if (!template) {
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete this template?',
      description: `This will permanently delete "${template.name}". This action cannot be undone.`,
      confirmText: 'Delete template',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate({ id: template.id, name: template.name });
  };

  const openTestDialog = () => {
    if (!template) return;
    const initialValues: Record<string, string> = {};
    const variablesList = Array.isArray(template.variables) ? template.variables : [];
    variablesList.forEach((key) => {
      if (typeof key === 'string') {
        initialValues[key] = (template.sampleValues as Record<string, string> | null)?.[key] ?? '';
      }
    });
    setTestValues(initialValues);
    setTestDialogOpen(true);
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      notify.error({
        key: 'template:test:phone',
        title: 'Phone number required',
        description: 'Add the test recipient number including country code.',
      });
      return;
    }

    try {
      await sendTestMutation.mutateAsync({
        phoneNumber: testPhone.trim(),
        values: testValues,
      });
      notify.success({
        key: 'template:test:sent',
        title: 'Test message sent',
        description: 'Check the conversation to confirm delivery status.',
      });
      setTestDialogOpen(false);
    } catch (error: any) {
      notify.error({
        key: 'template:test:error',
        title: 'Unable to send test',
        description: error?.message || 'Please try again.',
      });
    }
  };

  if (isLoading || !template) {
    return (
      <div className='p-4 sm:p-6 space-y-6'>
        <Button variant='ghost' onClick={() => navigate(-1)}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back
        </Button>
        <Card>
          <CardContent className='flex items-center justify-center py-24'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <Button variant='ghost' onClick={() => navigate(-1)} className='px-0 text-sm text-muted-foreground'>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <h1 className='text-2xl font-semibold text-foreground'>{template.name}</h1>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            <TemplateStatusBadge status={template.status as TemplateStatus} />
            <span>{CATEGORY_LABELS[template.category]}</span>
            <span aria-hidden>•</span>
            <span>{template.language?.toUpperCase()}</span>
            {template.providerTemplateId ? (
              <>
                <span aria-hidden>•</span>
                <span>Provider ID ending {template.providerTemplateId.slice(-6)}</span>
              </>
            ) : null}
          </div>
          {isTestMode ? (
            <Badge variant='outline' className='border-dashed text-muted-foreground'>
              Test account — send tests to whitelisted numbers only.
            </Badge>
          ) : null}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {statusSupportsSubmit(template.status as TemplateStatus) ? (
            <Button onClick={() => handleSubmit('submit')} disabled={mutateWrapper.isPending}>
              <Sparkles className='mr-2 h-4 w-4' /> Submit for approval
            </Button>
          ) : null}
          {statusSupportsResubmit(template.status as TemplateStatus) ? (
            <Button onClick={() => handleSubmit('resubmit')} disabled={mutateWrapper.isPending}>
              <Sparkles className='mr-2 h-4 w-4' /> Resubmit
            </Button>
          ) : null}
          {statusSupportsDeprecate(template.status as TemplateStatus) ? (
            <Button variant='outline' onClick={handleDeprecate} disabled={mutateWrapper.isPending}>
              <Trash2 className='mr-2 h-4 w-4' /> Deprecate
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => navigate('/dashboard/templates/new', { state: { duplicateOf: template.id, prefills: template } })}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openTestDialog} disabled={template.status !== 'APPROVED'}>
                Send test
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => templateQuery.refetch()}>Refresh status</DropdownMenuItem>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                disabled={deleteMutation.isPending}
                onClick={handleDeleteTemplate}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section className='grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Template history</CardTitle>
            <CardDescription>Track versions, submissions, approvals, and test sends.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              {template.versions?.length ? (
                template.versions.map((version) => (
                  <div key={version.id} className='rounded-lg border bg-muted/40 p-4'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div>
                        <p className='text-sm font-semibold text-foreground'>Version v{version.version}</p>
                        <p className='text-xs text-muted-foreground'>Updated {new Date(version.updatedAt).toLocaleString()}</p>
                      </div>
                      <Badge variant='outline'>{version.body.length} chars</Badge>
                    </div>
                    <Separator className='my-3' />
                    <pre className='whitespace-pre-wrap text-sm text-muted-foreground'>{version.body}</pre>
                  </div>
                ))
              ) : (
                <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>No versions recorded yet.</div>
              )}
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium text-foreground'>Audit log</p>
              <ScrollArea className='max-h-64 rounded-md border'>
                <div className='divide-y text-sm'>
                  {template.audits?.length ? (
                    template.audits.map((audit) => (
                      <div key={audit.id} className='flex items-start justify-between gap-4 px-4 py-3'>
                        <div>
                          <p className='font-medium text-foreground'>{audit.action.toLowerCase()}</p>
                          <p className='text-xs text-muted-foreground'>
                            {audit.actor?.email ?? 'System'} · {new Date(audit.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {audit.metadata ? (
                          <pre className='max-w-xs whitespace-pre-wrap break-words text-xs text-muted-foreground'>
                            {JSON.stringify(audit.metadata, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className='px-4 py-6 text-center text-sm text-muted-foreground'>No audit events yet.</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-4'>
          <TemplatePreview
            name={template.name}
            header={(template as any).header ?? ''}
            body={template.body ?? ''}
            footer={(template as any).footer ?? ''}
            sampleValues={(template.sampleValues as Record<string, string> | null) ?? {}}
          />
          {template.rejectionReason ? (
            <Card className='border-destructive/30 bg-destructive/5'>
              <CardHeader className='flex items-start gap-3'>
                <ShieldAlert className='h-5 w-5 text-destructive' />
                <div>
                  <CardTitle className='text-sm'>Not approved</CardTitle>
                  <CardDescription>{template.rejectionReason}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Meta review status</CardTitle>
              <CardDescription>Last refreshed {new Date(template.updatedAt || Date.now()).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <CircleDashed className='h-4 w-4' /> {ACTION_LABELS[template.status as TemplateStatus]}
              </div>
              <Button variant='outline' size='sm' onClick={() => templateQuery.refetch()} disabled={isFetching}>
                <RefreshCcw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} /> Refresh status
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test message</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='test-phone'>Recipient number</Label>
              <Input id='test-phone' placeholder='e.g. 2348012345678' value={testPhone} onChange={(event) => setTestPhone(event.target.value)} />
            </div>
            <TemplatePreview
              name={template.name}
              header={(template as any).header ?? ''}
              body={template.body ?? ''}
              footer={(template as any).footer ?? ''}
              sampleValues={testValues}
              showSampleEditor
              onSampleChange={(key, value) =>
                setTestValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sendTestMutation.isPending}>
              {sendTestMutation.isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Send className='mr-2 h-4 w-4' />}
              Send test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateDetailPage;
