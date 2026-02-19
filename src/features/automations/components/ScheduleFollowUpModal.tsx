import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { notify } from '@/lib/toast';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import type { FollowUpRule, FollowUpStatus, Template } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ConversationOption {
  id: string;
  label: string;
  channel?: string | null;
  contactName?: string | null;
}

export interface FollowUpPrefill {
  conversationId?: string;
  provider?: string;
  message?: string;
  scheduledTime?: string;
}

interface ScheduleFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  userId: string;
  organizationId: string;
  conversationOptions: ConversationOption[];
  templateOptions: Template[];
  conversationsLoading?: boolean;
  followUp?: FollowUpRule | null;
  prefill?: FollowUpPrefill | null;
  onCompleted?: (followUp: FollowUpRule, meta: { mode: 'create' | 'update' }) => void;
  onCancelled?: (followUpId: string) => void;
}

interface FollowUpFormState {
  conversationId: string;
  provider: string;
  scheduledTime: string;
  message: string;
  templateId: string;
  status: FollowUpStatus;
  variables: Record<string, string>;
}

const PROVIDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telegram', label: 'Telegram' },
];

const DEFAULT_PROVIDER = 'whatsapp';
const NO_TEMPLATE_VALUE = '__NO_TEMPLATE__';

const FOLLOWUP_TIPS = [
  'WhatsApp enforces a 24-hour customer care window. Past that window, only approved templates get delivered.',
  'Confirm the contact has opted in to receive messages on the channel before scheduling automations.',
  'Keep follow-ups concise with a single call to action. Multi-step instructions perform poorly.',
  'Set reminders during business hours in the contact’s timezone to avoid spam complaints.',
  'Pair templates with personalization variables such as {{name}} and {{last_order}} to stay relevant.',
];

const toDateTimeLocalInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseDateTimeLocal = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const renderTemplatePreview = (body: string, values: Record<string, string>) =>
  body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);

const ScheduleFollowUpModal = ({
  open,
  onOpenChange,
  mode,
  followUp,
  prefill,
  userId,
  organizationId,
  conversationOptions,
  templateOptions,
  onCompleted,
  onCancelled,
  conversationsLoading = false,
}: ScheduleFollowUpModalProps) => {
  const [form, setForm] = useState<FollowUpFormState>({
    conversationId: '',
    provider: DEFAULT_PROVIDER,
    scheduledTime: '',
    message: '',
    templateId: '',
    status: 'SCHEDULED',
    variables: {},
  });
  const [busy, setBusy] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmLabel: string;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
    confirmLabel: 'Confirm',
  });

  const selectedTemplate = useMemo(() => templateOptions.find((candidate) => candidate.id === form.templateId), [form.templateId, templateOptions]);

  const templateVariableNames = useMemo(() => selectedTemplate?.variables ?? [], [selectedTemplate]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && followUp) {
      const templateVariables = followUp.template?.variables ?? templateVariableNames;
      const variablesPayload: Record<string, string> = {};
      templateVariables.forEach((key) => {
        const provided = followUp.variables?.[key];
        variablesPayload[key] = typeof provided === 'string' ? provided : '';
      });

      setForm({
        conversationId: followUp.conversationId ?? '',
        provider: followUp.provider ?? DEFAULT_PROVIDER,
        scheduledTime: toDateTimeLocalInput(followUp.scheduledTime),
        message: followUp.message ?? '',
        templateId: followUp.templateId ?? '',
        status: followUp.status ?? 'SCHEDULED',
        variables: variablesPayload,
      });
    } else {
      setForm({
        conversationId: prefill?.conversationId ?? '',
        provider: prefill?.provider ?? DEFAULT_PROVIDER,
        scheduledTime: prefill?.scheduledTime ?? '',
        message: prefill?.message ?? '',
        templateId: '',
        status: 'SCHEDULED',
        variables: {},
      });
    }
  }, [open, mode, followUp, templateVariableNames, prefill]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setForm((prev) => {
      const nextVariables: Record<string, string> = {};
      templateVariableNames.forEach((key) => {
        nextVariables[key] = prev.variables[key] ?? '';
      });
      return { ...prev, variables: nextVariables };
    });
  }, [selectedTemplate, templateVariableNames]);

  const requiresTemplate = useMemo(() => {
    if (form.provider !== 'whatsapp') return false;
    const date = parseDateTimeLocal(form.scheduledTime);
    if (!date) return false;
    const diff = date.getTime() - Date.now();
    return diff >= 24 * 60 * 60 * 1000;
  }, [form.provider, form.scheduledTime]);

  const previewText = useMemo(() => {
    if (selectedTemplate) {
      return renderTemplatePreview(selectedTemplate.body, form.variables);
    }
    return form.message;
  }, [selectedTemplate, form.message, form.variables]);

  if (!open) return null;

  const handleChange = <Key extends keyof FollowUpFormState>(key: Key, value: FollowUpFormState[Key]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.conversationId) {
      notify.warning({
        key: 'followups:schedule:conversation',
        title: 'Choose a conversation',
        description: 'Select the conversation you want to follow up on.',
      });
      return;
    }

    const scheduleDate = parseDateTimeLocal(form.scheduledTime);
    if (!scheduleDate) {
      notify.warning({
        key: 'followups:schedule:datetime',
        title: 'Invalid schedule',
        description: 'Pick a valid date and time.',
      });
      return;
    }
    if (scheduleDate.getTime() <= Date.now()) {
      notify.warning({
        key: 'followups:schedule:future',
        title: 'Schedule in the future',
        description: 'Pick a time later than now.',
      });
      return;
    }

    if (!form.templateId && !form.message.trim()) {
      notify.warning({
        key: 'followups:schedule:content',
        title: 'Add a message',
        description: 'Type a message or choose a template before scheduling.',
      });
      return;
    }

    if (requiresTemplate && !form.templateId) {
      notify.warning({
        key: 'followups:schedule:needs-template',
        title: 'Template required',
        description: 'WhatsApp needs an approved template after the 24-hour window.',
      });
      return;
    }

    setBusy(true);
    try {
      let saved: FollowUpRule | null = null;
      if (mode === 'edit' && followUp) {
        const payload: Record<string, unknown> = {
          provider: form.provider,
          scheduledTime: scheduleDate.toISOString(),
          message: form.templateId ? undefined : form.message.trim(),
          templateId: form.templateId || null,
          variables: selectedTemplate ? form.variables : undefined,
        };

        const res = await client.put(endpoints.followup(followUp.id), payload);
        saved = (res.data?.data?.followUp as FollowUpRule) ?? (res.data?.followUp as FollowUpRule) ?? null;
        notify.success({
          key: `followups:${followUp.id}:updated`,
          title: 'Follow-up updated',
        });
        if (saved) {
          onCompleted?.(saved, { mode: 'update' });
        }
      } else {
        const payload = {
          conversationId: form.conversationId,
          provider: form.provider,
          scheduledTime: scheduleDate.toISOString(),
          message: form.templateId ? undefined : form.message.trim(),
          userId,
          organizationId,
          templateId: form.templateId || undefined,
          variables: selectedTemplate ? form.variables : undefined,
        };
        const res = await client.post(endpoints.followups, payload);
        saved = (res.data?.data?.followUp as FollowUpRule) ?? (res.data?.followUp as FollowUpRule) ?? null;
        notify.success({
          key: 'followups:create:scheduled',
          title: 'Follow-up scheduled',
        });
        if (saved) {
          onCompleted?.(saved, { mode: 'create' });
        }
      }

      if (saved) {
        onOpenChange(false);
      }
    } catch (error: unknown) {
      let message = 'Unable to schedule follow-up.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      }
      notify.error({
        key: 'followups:schedule:error',
        title: 'Unable to schedule follow-up',
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCancelFollowUp = () => {
    if (!followUp) return;
    setAlertConfig({
      open: true,
      title: 'Cancel Follow-up',
      description: 'Are you sure you want to cancel this scheduled follow-up?',
      variant: 'default',
      confirmLabel: 'Cancel Follow-up',
      action: async () => {
        setBusy(true);
        try {
          const res = await client.post(endpoints.followupCancel(followUp.id));
          const payload = (res.data?.data?.followUp as FollowUpRule) ?? (res.data?.followUp as FollowUpRule) ?? null;
          notify.success({
            key: `followups:${followUp.id}:cancelled`,
            title: 'Follow-up cancelled',
          });
          if (payload) {
            onCancelled?.(payload.id);
            onCompleted?.(payload, { mode: 'update' });
          } else {
            onCancelled?.(followUp.id);
          }
          onOpenChange(false);
        } catch (error: unknown) {
          let message = 'Failed to cancel follow-up.';
          if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
          ) {
            message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
          }
          notify.error({
            key: `followups:${followUp?.id ?? 'cancel'}:error`,
            title: 'Unable to cancel follow-up',
            description: message,
          });
        } finally {
          setBusy(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0'>
        <Card className='border-0 shadow-none'>
          <CardHeader>
            <CardTitle>{mode === 'edit' ? 'Edit follow-up' : 'Schedule follow-up'}</CardTitle>
            <CardDescription>
              {form.provider === 'whatsapp'
                ? 'Plan the next message. WhatsApp templates are required if you reach out after the 24-hour support window.'
                : 'Plan the next message for this channel.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-[3fr_2fr]'>
              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='followup-conversation'>Conversation</Label>
                  {conversationsLoading ? (
                    <Skeleton className='h-9 w-full' />
                  ) : conversationOptions.length ? (
                    <Select
                      value={form.conversationId || undefined}
                      onValueChange={(value) => handleChange('conversationId', value)}
                      disabled={busy || mode === 'edit'}
                    >
                      <SelectTrigger id='followup-conversation'>
                        <SelectValue placeholder='Select a conversation' />
                      </SelectTrigger>
                      <SelectContent>
                        {conversationOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.channel ? `${option.label} · ${option.channel}` : option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className='rounded border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground'>
                      No conversations available yet. Head to the inbox to start a chat first.
                    </div>
                  )}
                </div>

                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='followup-provider'>Channel</Label>
                    <Select value={form.provider} onValueChange={(value) => handleChange('provider', value)} disabled={busy}>
                      <SelectTrigger id='followup-provider'>
                        <SelectValue placeholder='Select channel' />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='followup-scheduled'>Send at</Label>
                    <Input
                      id='followup-scheduled'
                      type='datetime-local'
                      value={form.scheduledTime}
                      onChange={(event) => handleChange('scheduledTime', event.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='followup-template'>Template (optional)</Label>
                  <Select
                    value={form.templateId ? form.templateId : NO_TEMPLATE_VALUE}
                    onValueChange={(value) => handleChange('templateId', value === NO_TEMPLATE_VALUE ? '' : value)}
                    disabled={busy || templateOptions.length === 0}
                  >
                    <SelectTrigger id='followup-template'>
                      <SelectValue placeholder='Send a custom message' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEMPLATE_VALUE}>Send a custom message</SelectItem>
                      {templateOptions.map((templateOption) => (
                        <SelectItem key={templateOption.id} value={templateOption.id}>
                          {templateOption.name} · {templateOption.status.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Only approved WhatsApp templates can bypass the 24-hour window. Drafts will not send automatically.
                  </p>
                </div>
                {!form.templateId && (
                  <div className='space-y-1.5'>
                    <Label htmlFor='followup-message'>Message</Label>
                    <Textarea
                      id='followup-message'
                      rows={5}
                      placeholder='Check in with the lead...'
                      value={form.message}
                      onChange={(event) => handleChange('message', event.target.value)}
                      disabled={busy}
                    />
                  </div>
                )}

                {form.templateId && selectedTemplate && selectedTemplate.variables?.length ? (
                  <div className='space-y-2 rounded-md border border-dashed border-border/60 p-3'>
                    <p className='text-xs font-medium text-muted-foreground'>Fill in placeholder values</p>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      {selectedTemplate.variables.map((key) => (
                        <div key={key} className='space-y-1'>
                          <Label htmlFor={`followup-variable-${key}`} className='text-xs uppercase tracking-wide text-muted-foreground'>
                            {key}
                          </Label>
                          <Input
                            id={`followup-variable-${key}`}
                            value={form.variables[key] ?? ''}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                variables: {
                                  ...prev.variables,
                                  [key]: event.target.value,
                                },
                              }))
                            }
                            disabled={busy}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className='flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/40 p-4'>
                <div>
                  <h3 className='text-sm font-semibold'>What the lead sees</h3>
                  <div className='mt-2 rounded-lg border border-border bg-background p-3 text-sm text-foreground shadow-sm'>
                    {previewText ? (
                      <p className='whitespace-pre-wrap leading-relaxed'>{previewText}</p>
                    ) : (
                      <p className='text-muted-foreground'>Write a message or pick a template to preview the follow-up.</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className='text-sm font-semibold'>WhatsApp safety notes</h3>
                  <ul className='mt-2 list-disc space-y-2 pl-4 text-xs text-muted-foreground'>
                    {FOLLOWUP_TIPS.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                  {requiresTemplate && !form.templateId && (
                    <div className='mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                      Scheduled more than 24 hours ahead. Select an approved template so WhatsApp delivers this message.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                <Badge variant='secondary'>Status: {mode === 'edit' ? (followUp?.status ?? 'SCHEDULED') : 'SCHEDULED'}</Badge>
                <span>Automations free your team to focus on live chats.</span>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {mode === 'edit' && (
                  <Button type='button' variant='destructive' disabled={busy} onClick={handleCancelFollowUp}>
                    Cancel follow-up
                  </Button>
                )}
                <Button type='button' variant='outline' disabled={busy} onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button type='button' disabled={busy} onClick={handleSubmit}>
                  {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Schedule follow-up'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>

      <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={alertConfig.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                alertConfig.action();
              }}
            >
              {alertConfig.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default ScheduleFollowUpModal;
