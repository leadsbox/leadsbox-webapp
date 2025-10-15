import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notify } from '@/lib/toast';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import type { Template, TemplateCategory } from '@/types';

interface TemplateComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
  onSaved?: (template: Template, meta: { mode: 'create' | 'update' }) => void;
  onDeleted?: (templateId: string) => void;
}

interface TemplateFormState {
  name: string;
  body: string;
  variables: string[];
  category: TemplateCategory;
  language: string;
}

const CATEGORY_OPTIONS: Array<{ value: TemplateCategory; label: string; helper: string }> = [
  { value: 'UTILITY', label: 'Utility', helper: 'Updates related to orders, appointments, or account activity.' },
  { value: 'MARKETING', label: 'Marketing', helper: 'Promotional offers and product discovery messages (requires explicit opt-in).' },
  { value: 'AUTHENTICATION', label: 'Authentication', helper: 'One-time passwords or verification codes. No marketing content allowed.' },
];

const LANGUAGE_OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt_BR', label: 'Portuguese (Brazil)' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'hi', label: 'Hindi' },
];

const WHATSAPP_TIPS = [
  'Keep messaging relevant and user-initiated. Marketing templates require explicit opt-in.',
  'Avoid placeholders in URLs or phone numbers—WhatsApp rejects templates with dynamic links outside the {{variable}} syntax.',
  'Stay within one clear purpose per template. Mixing marketing and transactional copy leads to rejections.',
  'Use friendly, concise language. Excessive punctuation (!!!) or all caps often triggers manual reviews.',
  'Anything sent after the 24-hour customer care window must use an approved template.',
];

const DEFAULT_FORM: TemplateFormState = {
  name: '',
  body: '',
  variables: [],
  category: 'UTILITY',
  language: 'en',
};

const detectVariables = (body: string): string[] => {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const variables = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
};

const suggestValueFor = (key: string): string => {
  const normalized = key.toLowerCase();
  if (normalized.includes('name')) return 'Jane Doe';
  if (normalized.includes('date')) return '2024-09-01';
  if (normalized.includes('time')) return '4:00 PM';
  if (normalized.includes('order')) return '#48291';
  if (normalized.includes('amount') || normalized.includes('price')) return '$99.00';
  if (normalized.includes('code')) return '123456';
  return 'Value';
};

const renderPreview = (body: string, values: Record<string, string>) =>
  body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, token: string) => values[token] ?? `{{${token}}}`);

const TemplateComposer = ({ open, onOpenChange, template, onSaved, onDeleted }: TemplateComposerProps) => {
  const isEditing = Boolean(template);
  const [form, setForm] = useState<TemplateFormState>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (template) {
      setForm({
        name: template.name ?? '',
        body: template.body ?? '',
        variables: Array.isArray(template.variables) ? template.variables : [],
        category: template.category ?? 'UTILITY',
        language: template.language ?? 'en',
      });
      const defaults: Record<string, string> = {};
      (template.variables ?? []).forEach((key) => {
        defaults[key] = suggestValueFor(key);
      });
      setPreviewValues(defaults);
    } else {
      setForm(DEFAULT_FORM);
      setPreviewValues({});
    }
  }, [open, template]);

  useEffect(() => {
    setPreviewValues((current) => {
      const next: Record<string, string> = {};
      form.variables.forEach((key) => {
        next[key] = current[key] ?? suggestValueFor(key);
      });
      return next;
    });
  }, [form.variables]);

  if (!open) return null;

  const previewText = useMemo(
    () => renderPreview(form.body || '', previewValues),
    [form.body, previewValues],
  );

  const handleAutoDetect = () => {
    const detected = detectVariables(form.body || '');
    setForm((prev) => ({ ...prev, variables: detected }));
    if (!detected.length) {
      notify.info({
        key: 'templates:composer:no-variables',
        title: 'No placeholders found',
        description: 'Add {{name}} style placeholders to personalize messages.',
      });
    } else {
      notify.success({
        key: 'templates:composer:variables-detected',
        title: 'Placeholders detected',
        description: `Detected ${detected.length} variable${detected.length === 1 ? '' : 's'}.`,
      });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify.warning({
        key: 'templates:composer:name-required',
        title: 'Name required',
        description: 'Give your template a name.',
      });
      return;
    }
    if (!form.body.trim()) {
      notify.warning({
        key: 'templates:composer:body-required',
        title: 'Message required',
        description: 'Add the template body before saving.',
      });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        body: form.body.trim(),
        variables: form.variables,
        category: form.category,
        language: form.language,
      };

      let saved: Template | null = null;

      if (isEditing && template) {
        const res = await client.put(`${endpoints.templates}/${template.id}`, payload);
        saved = (res.data?.data as Template) ?? (res.data as Template) ?? null;
        notify.success({
          key: `templates:${template.id}:updated`,
          title: 'Template updated',
        });
      } else {
        const res = await client.post(endpoints.templates, payload);
        saved = (res.data?.data as Template) ?? (res.data as Template) ?? null;
        notify.success({
          key: 'templates:create:success',
          title: 'Template created',
        });
      }

      if (saved) {
        onSaved?.(saved, { mode: isEditing ? 'update' : 'create' });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      let message = 'Unable to save template.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      }
      notify.error({
        key: 'templates:composer:save-error',
        title: 'Unable to save template',
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const res = await client.post(endpoints.submitTemplate, { templateId: template.id });
      const updated = (res.data?.data as Template) ?? (res.data as Template) ?? null;
      notify.success({
        key: `templates:${template.id}:submitted`,
        title: 'Submitted for approval',
        description: 'WhatsApp will review your template shortly.',
      });
      if (updated) {
        onSaved?.(updated, { mode: 'update' });
        onOpenChange(false);
      }
    } catch (error: unknown) {
      let message = 'Submission failed.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      }
      notify.error({
        key: `templates:${template.id}:submit-error`,
        title: 'Unable to submit template',
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    if (!window.confirm('Delete this template? This action cannot be undone.')) return;

    setBusy(true);
    try {
      await client.delete(`${endpoints.templates}/${template.id}`);
      notify.success({
        key: `templates:${template.id}:deleted`,
        title: 'Template deleted',
      });
      onDeleted?.(template.id);
      onOpenChange(false);
    } catch (error: unknown) {
      let message = 'Failed to delete template.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
      }
      notify.error({
        key: `templates:${template?.id ?? 'delete'}:error`,
        title: 'Unable to delete template',
        description: message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className='border-primary/30 shadow-sm'>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit WhatsApp template' : 'Create WhatsApp template'}</CardTitle>
        <CardDescription>
          Draft clear, policy-compliant messages. Templates let you reach contacts even after the 24-hour WhatsApp window closes.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-6 md:grid-cols-[2fr_1fr]'>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='template-name'>Template name</Label>
              <Input
                id='template-name'
                placeholder='E.g. order_update'
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={busy}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='template-language'>Language</Label>
              <Select
                value={form.language}
                onValueChange={(value) => setForm((prev) => ({ ...prev, language: value }))}
                disabled={busy}
              >
                <SelectTrigger id='template-language'>
                  <SelectValue placeholder='Select language' />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='template-body'>Message body</Label>
              <Textarea
                id='template-body'
                placeholder='Thanks {{name}}, your order {{order_number}} ships on {{ship_date}}.'
                rows={8}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                disabled={busy}
              />
              <div className='flex flex-wrap items-center gap-2'>
                <Button type='button' variant='outline' size='sm' disabled={busy} onClick={handleAutoDetect}>
                  Detect variables
                </Button>
                <span className='text-xs text-muted-foreground'>
                  Use double braces: {'{{name}}'}. We keep your placeholder list synced automatically.
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='space-y-1.5'>
                <Label>Placeholders</Label>
                {form.variables.length ? (
                  <div className='flex flex-wrap gap-2'>
                    {form.variables.map((variable) => (
                      <Badge key={variable} variant='outline'>
                        {variable}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-xs text-muted-foreground'>No placeholders yet. Add {'{{name}}'} style tokens to your message.</p>
                )}
              </div>
              {form.variables.length > 0 && (
                <div className='space-y-2 rounded-md border border-dashed border-border/60 p-3'>
                  <p className='text-xs font-medium text-muted-foreground'>Preview values</p>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {form.variables.map((variable) => (
                      <div key={variable} className='space-y-1'>
                        <Label htmlFor={`preview-${variable}`} className='text-xs uppercase tracking-wide text-muted-foreground'>
                          {variable}
                        </Label>
                        <Input
                          id={`preview-${variable}`}
                          value={previewValues[variable] ?? ''}
                          onChange={(event) =>
                            setPreviewValues((prev) => ({
                              ...prev,
                              [variable]: event.target.value,
                            }))
                          }
                          disabled={busy}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='template-category'>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    category: value as TemplateCategory,
                  }))
                }
                disabled={busy}
              >
                <SelectTrigger id='template-category'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                {
                  CATEGORY_OPTIONS.find((option) => option.value === form.category)?.helper ??
                  'Choose how Meta will classify and review this template.'
                }
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/40 p-4'>
            <div>
              <h3 className='text-sm font-semibold'>Mobile preview</h3>
              <div className='mt-2 rounded-lg border border-border bg-background p-3 text-sm text-foreground shadow-sm'>
                {previewText ? (
                  <p className='whitespace-pre-wrap leading-relaxed'>{previewText}</p>
                ) : (
                  <p className='text-muted-foreground'>Start typing to see how the template will look inside WhatsApp.</p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className='text-sm font-semibold'>WhatsApp review checklist</h3>
              <ul className='mt-2 list-disc space-y-2 pl-4 text-xs text-muted-foreground'>
                {WHATSAPP_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            {template?.status && (
              <Badge variant='secondary'>Status: {template.status.replace('_', ' ')}</Badge>
            )}
            <span>Templates keep conversations going after the 24-hour window.</span>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {isEditing && template?.status === 'DRAFT' && (
              <Button type='button' variant='secondary' disabled={busy} onClick={handleSubmitForApproval}>
                Submit for approval
              </Button>
            )}
            {isEditing && (
              <Button type='button' variant='destructive' disabled={busy} onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button type='button' variant='outline' disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='button' disabled={busy} onClick={handleSave}>
              {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateComposer;
