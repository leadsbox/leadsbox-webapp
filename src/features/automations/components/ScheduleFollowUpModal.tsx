import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-toastify';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import type { FollowUpRule, FollowUpStatus, Template } from '@/types';

export interface ConversationOption {
  id: string;
  label: string;
  channel?: string | null;
  contactName?: string | null;
}

interface ScheduleFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  userId: string;
  organizationId: string;
  conversationOptions: ConversationOption[];
  templateOptions: Template[];
  followUp?: FollowUpRule | null;
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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
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
  userId,
  organizationId,
  conversationOptions,
  templateOptions,
  onCompleted,
  onCancelled,
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

  const selectedTemplate = useMemo(
    () => templateOptions.find((candidate) => candidate.id === form.templateId),
    [form.templateId, templateOptions],
  );

  const templateVariableNames = useMemo(
    () => selectedTemplate?.variables ?? [],
    [selectedTemplate],
  );

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
        conversationId: '',
        provider: DEFAULT_PROVIDER,
        scheduledTime: '',
        message: '',
        templateId: '',
        status: 'SCHEDULED',
        variables: {},
      });
    }
  }, [open, mode, followUp, templateVariableNames]);

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

  const handleChange = <Key extends keyof FollowUpFormState>(key: Key, value: FollowUpFormState[Key]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.conversationId) {
      toast.error('Choose the conversation to follow up on.');
      return;
    }

    const scheduleDate = parseDateTimeLocal(form.scheduledTime);
    if (!scheduleDate) {
      toast.error('Pick a valid date and time.');
      return;
    }
    if (scheduleDate.getTime() <= Date.now()) {
      toast.error('Schedule must be in the future.');
      return;
    }

    if (!form.templateId && !form.message.trim()) {
      toast.error('Add a message or select a template.');
      return;
    }

    if (requiresTemplate && !form.templateId) {
      toast.warn('WhatsApp will block this message because it falls outside the 24-hour window. Choose an approved template.');
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
        toast.success('Follow-up updated.');
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
        toast.success('Follow-up scheduled.');
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
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelFollowUp = async () => {
    if (!followUp) return;
    if (!window.confirm('Cancel this follow-up?')) return;
    setBusy(true);
    try {
      const res = await client.post(endpoints.followupCancel(followUp.id));
      const payload = (res.data?.data?.followUp as FollowUpRule) ?? (res.data?.followUp as FollowUpRule) ?? null;
      toast.success('Follow-up cancelled.');
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
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit follow-up' : 'Schedule follow-up'}</DialogTitle>
          <DialogDescription>
            {form.provider === 'whatsapp'
              ? 'Plan the next message. WhatsApp templates are required if you reach out after the 24-hour support window.'
              : 'Plan the next message for this channel.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-6 md:grid-cols-[3fr_2fr]'>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='followup-conversation'>Conversation</Label>
              <select
                id='followup-conversation'
                className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                value={form.conversationId}
                onChange={(event) => handleChange('conversationId', event.target.value)}
                disabled={busy || mode === 'edit'}
              >
                <option value=''>Select a conversation</option>
                {conversationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.channel ? ` · ${option.channel}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='followup-provider'>Channel</Label>
                <select
                  id='followup-provider'
                  className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                  value={form.provider}
                  onChange={(event) => handleChange('provider', event.target.value)}
                  disabled={busy}
                >
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
              <select
                id='followup-template'
                className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                value={form.templateId}
                onChange={(event) => handleChange('templateId', event.target.value)}
                disabled={busy || templateOptions.length === 0}
              >
                <option value=''>Send a custom message</option>
                {templateOptions.map((templateOption) => (
                  <option key={templateOption.id} value={templateOption.id}>
                    {templateOption.name} · {templateOption.status.toLowerCase()}
                  </option>
                ))}
              </select>
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

        <DialogFooter className='flex flex-col gap-3 sm:flex-row sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Badge variant='secondary'>Status: {mode === 'edit' ? followUp?.status ?? 'SCHEDULED' : 'SCHEDULED'}</Badge>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFollowUpModal;
