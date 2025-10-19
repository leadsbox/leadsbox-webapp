import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Info, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplatePlaceholder, TemplateCategory } from '@/types';
import templateApi from '@/api/templates';
import TemplatePreview from './components/TemplatePreview';
import TemplateStatusBadge from './components/TemplateStatusBadge';
import { TEMPLATE_SAMPLES, TEMPLATE_SAMPLES_BY_CATEGORY, TemplateSample } from './data/templateSamples';
import type { Template } from '@/types';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

type TemplatePayload = {
  name: string;
  category: TemplateCategory;
  language?: string;
  header?: string | null;
  body: string;
  footer?: string | null;
  buttons?: unknown;
  placeholders: TemplatePlaceholder[];
  sampleValues?: Record<string, string>;
  notes?: string | null;
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
};

const CATEGORY_DESCRIPTIONS: Record<TemplateCategory, string> = {
  MARKETING: 'Promotional offers and marketing campaigns',
  UTILITY: 'Order updates and account notifications',
  AUTHENTICATION: 'Login codes and security alerts',
};

const CATEGORY_TIPS: Record<TemplateCategory, string[]> = {
  MARKETING: [
    'Include opt-out instructions (e.g., “Reply STOP”).',
    'Avoid misleading or spammy language—keep it clear and concise.',
    'Personalise with placeholders, but do not add dynamic links outside {{variables}}.',
  ],
  UTILITY: [
    'Stick to the transactional purpose—no promotions in utility conversations.',
    'Mention the next step or include a link for tracking or confirmation.',
    'Send reminders at reasonable hours for your audience.',
  ],
  AUTHENTICATION: [
    'OTP templates must include at least one placeholder for the code.',
    'Do not combine authentication with promotional content.',
    'Clarify code validity duration or recommended follow-up action.',
  ],
};

const detectPlaceholders = (content: string): string[] => {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const tokens = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    tokens.add(match[1]);
  }
  return Array.from(tokens);
};

// Validate that placeholders follow WhatsApp requirements
const validatePlaceholders = (placeholders: TemplatePlaceholder[]): { valid: boolean; error?: string } => {
  if (placeholders.length === 0) return { valid: true };

  // Sort by index to check sequential order
  const sortedPlaceholders = [...placeholders].sort((a, b) => a.index - b.index);

  // Check if starts from 1
  if (sortedPlaceholders[0].index !== 1) {
    return { valid: false, error: 'Variables must start from index 1' };
  }

  // Check if sequential (no gaps)
  for (let i = 0; i < sortedPlaceholders.length; i++) {
    if (sortedPlaceholders[i].index !== i + 1) {
      return { valid: false, error: `Variables must be sequential. Missing index ${i + 1}` };
    }
  }

  return { valid: true };
};

const scaffoldPlaceholders = (keys: string[], existing: TemplatePlaceholder[], examples: Record<string, string>): TemplatePlaceholder[] => {
  const map = new Map(existing.map((item) => [item.key, item] as const));
  return keys.map((key, index) => {
    const current = map.get(key);
    const fallbackLabel = key.replace(/_/g, ' ');
    const exampleFromExamples = examples?.[key]?.trim() ?? '';
    const exampleFromExisting = typeof current?.example === 'string' ? current.example.trim() : '';
    const inferredExample = inferSampleValue(key);
    return {
      key,
      label: current?.label?.toString().trim() || fallbackLabel,
      example: exampleFromExisting || exampleFromExamples || inferredExample,
      index: typeof current?.index === 'number' && current.index > 0 ? current.index : index + 1,
    };
  });
};

const defaultExamples: Record<string, string> = {
  name: 'Ada',
  customer_name: 'Ada',
  first_name: 'Ada',
  order_number: '#48291',
  appointment_date: '04 Sep',
  appointment_time: '2:00 PM',
  otp_code: '482193',
  discount: '20',
  brand_name: 'LeadsBox',
};

const inferSampleValue = (key: string) => {
  const lowered = key.toLowerCase();
  if (defaultExamples[key]) return defaultExamples[key];
  if (lowered.includes('name')) return 'Ada';
  if (lowered.includes('date')) return '04 Sep';
  if (lowered.includes('time')) return '2:00 PM';
  if (lowered.includes('code')) return '123456';
  if (lowered.includes('amount') || lowered.includes('price') || lowered.includes('discount')) return '20';
  if (lowered.includes('order')) return '#00821';
  if (lowered.includes('url')) return 'https://example.com/link';
  return 'Value';
};

const toSampleFromTemplate = (template: Template): TemplateSample => {
  const basePlaceholders: TemplatePlaceholder[] =
    (template.currentVersion?.placeholders as TemplatePlaceholder[] | undefined) ??
    (Array.isArray(template.variables) ? template.variables : []).map((key, index) => ({
      key,
      label: key.replace(/_/g, ' '),
      example: template.sampleValues?.[key] ?? inferSampleValue(key),
      index: index + 1,
    }));

  return {
    id: template.id,
    name: template.name,
    category: template.category,
    language: template.language ?? 'en',
    header: (template as Template & { header?: string }).header ?? undefined,
    body: template.body ?? '',
    footer: (template as Template & { footer?: string }).footer ?? undefined,
    buttons: template.buttons ?? null,
    placeholders: Array.isArray(basePlaceholders) ? basePlaceholders : [],
    sampleValues: (template.sampleValues as Record<string, string> | null) ?? {},
    whyItWorks: '',
    tips: [],
  };
};

const useWizardPrefill = () => {
  const location = useLocation();
  const state = (location.state || {}) as {
    sampleId?: string;
    prefills?: TemplateSample | Template;
    duplicateOf?: string;
  };

  if (state.prefills) {
    if ('placeholders' in state.prefills) {
      return state.prefills as TemplateSample;
    }
    return toSampleFromTemplate(state.prefills as Template);
  }

  if (state.sampleId) {
    return TEMPLATE_SAMPLES.find((sample) => sample.id === state.sampleId);
  }

  return undefined;
};

const useWizardDuplicate = () => {
  const location = useLocation();
  const state = (location.state || {}) as {
    duplicateOf?: string;
  };
  return state.duplicateOf;
};

const WizardStepIndicator = ({ step }: { step: number }) => (
  <div className='grid gap-3 md:grid-cols-3'>
    {['Type & language', 'Compose & variables', 'Review & submit'].map((label, index) => {
      const active = index === step;
      const complete = index < step;
      return (
        <div
          key={label}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition',
            active && 'border-primary text-primary shadow-sm',
            complete && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border',
              complete
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : active
                ? 'border-primary text-primary'
                : 'border-muted text-muted-foreground'
            )}
          >
            {complete ? <CheckCircle2 className='h-4 w-4' /> : index + 1}
          </div>
          <span className='font-medium'>{label}</span>
        </div>
      );
    })}
  </div>
);

const CreateTemplateWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const prefills = useWizardPrefill();
  const duplicateId = useWizardDuplicate();
  const isTestMode = Boolean(import.meta.env.VITE_APP_ENV?.toLowerCase() === 'test');

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<TemplateCategory | null>(prefills?.category ?? null);
  const [language, setLanguage] = useState(prefills?.language ?? 'en');
  const [name, setName] = useState(prefills?.name ?? '');
  const [header, setHeader] = useState(prefills?.header ?? '');
  const [body, setBody] = useState(prefills?.body ?? '');
  const [footer, setFooter] = useState(prefills?.footer ?? '');
  const [placeholders, setPlaceholders] = useState<TemplatePlaceholder[]>(() => {
    const initial = prefills?.placeholders;
    return Array.isArray(initial) ? initial : [];
  });
  const [sampleValues, setSampleValues] = useState<Record<string, string>>(() => {
    const initial = prefills?.sampleValues;
    return initial && typeof initial === 'object' && !Array.isArray(initial) ? initial : {};
  });
  const [notes, setNotes] = useState('');
  const [submitAfterCreate, setSubmitAfterCreate] = useState(false);
  const samplesByCategory = useMemo(() => TEMPLATE_SAMPLES_BY_CATEGORY, []);

  const applySample = (sample: TemplateSample) => {
    setCategory(sample.category);
    setLanguage(sample.language ?? 'en');
    setName(sample.name ?? '');
    setHeader(sample.header ?? '');
    setBody(sample.body ?? '');
    setFooter(sample.footer ?? '');
    setPlaceholders(Array.isArray(sample.placeholders) ? sample.placeholders : []);
    setSampleValues(sample.sampleValues ?? {});
    setNotes('');
    setSubmitAfterCreate(false);
    setStep(1);
  };

  const renderCategoryIcon = (value: TemplateCategory) => {
    switch (value) {
      case 'MARKETING':
        return <Zap className='h-4 w-4 text-primary' />;
      case 'UTILITY':
        return <Clock className='h-4 w-4 text-primary' />;
      case 'AUTHENTICATION':
        return <CheckCircle2 className='h-4 w-4 text-primary' />;
      default:
        return <MessageSquare className='h-4 w-4 text-primary' />;
    }
  };

  const detectedKeys = useMemo(
    () => Array.from(new Set([...detectPlaceholders(body), ...detectPlaceholders(header || ''), ...detectPlaceholders(footer || '')])),
    [body, header, footer]
  );

  useEffect(() => {
    setPlaceholders((current) => {
      if (!Array.isArray(current)) {
        current = [];
      }
      return scaffoldPlaceholders(detectedKeys, current, sampleValues);
    });
  }, [detectedKeys.length, detectedKeys, sampleValues]);

  useEffect(() => {
    setSampleValues((current) => {
      const next = { ...current };
      detectedKeys.forEach((key) => {
        if (!next[key]) {
          next[key] = inferSampleValue(key);
        }
      });
      return next;
    });
  }, [detectedKeys]);

  const createMutation = useMutation({
    mutationFn: async (payload: TemplatePayload & { submit?: boolean }) => {
      const created = await templateApi.create(payload);
      if (!created) {
        throw new Error('Template not created');
      }
      if (payload.submit) {
        await templateApi.submit(created.id);
      }
      return created;
    },
  });

  const canContinueStepOne = Boolean(category && language);
  const isNameValid = /^([a-z0-9]+_)*[a-z0-9]+$/.test(name); // snake_case
  const canContinueStepTwo = body.trim().length > 0 && isNameValid;

  const onNext = () => {
    if (step === 0 && !canContinueStepOne) return;
    if (step === 1 && !canContinueStepTwo) {
      notify.error({
        key: 'wizard:template:name-invalid',
        title: 'Fix validation errors',
        description: 'Template name must be snake_case and the body is required before continuing.',
      });
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const onBack = () => setStep((current) => Math.max(current - 1, 0));

  const onSubmit = async (submit: boolean) => {
    if (!canContinueStepTwo) {
      notify.error({
        key: 'wizard:template:validation',
        title: 'Fill required fields',
        description: 'Complete the template name and body before saving.',
      });
      return;
    }

    if (!category) {
      notify.error({
        key: 'wizard:template:category-missing',
        title: 'Choose a template type',
        description: 'Select a category before saving or submitting your template.',
      });
      return;
    }

    if (/\{\{\s*[^}]+\s*\}\}/.test(footer)) {
      notify.error({
        key: 'wizard:template:footer-variables',
        title: 'Footer cannot include variables',
        description: 'Move dynamic text into the header or body instead of the footer.',
      });
      return;
    }

    // Get all placeholders that are actually used in the template content
    const actuallyUsedKeys = Array.from(
      new Set([...detectPlaceholders(body), ...detectPlaceholders(header || ''), ...detectPlaceholders(footer || '')])
    );

    // Create placeholder definitions for all used keys, ensuring we have definitions for every key
    const existingPlaceholdersMap = new Map(
      (Array.isArray(placeholders) ? placeholders : [])
        .filter((item): item is TemplatePlaceholder => Boolean(item && typeof item === 'object' && item.key))
        .map((item) => [item.key.trim(), item])
    );

    const normalizedPlaceholders = actuallyUsedKeys.map((key, idx) => {
      const existing = existingPlaceholdersMap.get(key);
      const sanitizedKey = key.trim();
      const fallbackLabel = sanitizedKey.replace(/_/g, ' ');
      const rawLabel = typeof existing?.label === 'string' ? existing.label.trim() : '';
      const rawExample = typeof existing?.example === 'string' ? existing.example.trim() : '';
      const rawSampleValue = sampleValues?.[sanitizedKey];
      const sanitizedSampleValue = typeof rawSampleValue === 'string' ? rawSampleValue.trim() : '';
      const example = rawExample || sanitizedSampleValue || inferSampleValue(sanitizedKey);

      // Ensure label and example are never empty
      const finalLabel = rawLabel || fallbackLabel || sanitizedKey;
      const finalExample = example || inferSampleValue(sanitizedKey) || 'sample';

      return {
        key: sanitizedKey,
        label: finalLabel,
        example: finalExample,
        index: idx + 1, // Sequential indices starting from 1
      };
    });

    // Validate placeholders for WhatsApp requirements
    if (submit) {
      const validation = validatePlaceholders(normalizedPlaceholders);
      if (!validation.valid) {
        notify.error({
          key: 'wizard:template:placeholder-validation',
          title: 'Invalid placeholders',
          description: validation.error || 'Placeholders must start from {{1}} and be sequential.',
        });
        return;
      }
    }

    const normalizedSampleValues = normalizedPlaceholders.reduce<Record<string, string>>((acc, item) => {
      const rawSampleValue = sampleValues?.[item.key];
      const sanitizedSampleValue = typeof rawSampleValue === 'string' ? rawSampleValue.trim() : '';
      acc[item.key] = sanitizedSampleValue || item.example || inferSampleValue(item.key);
      return acc;
    }, {});

    const normalizedHeader = header.trim() ? header.trim() : undefined;
    const normalizedBody = body.trim();
    const normalizedFooter = footer.trim() ? footer.trim() : undefined;

    const payload: TemplatePayload & { submit?: boolean } = {
      name: name.trim(),
      category,
      language,
      header: normalizedHeader,
      body: normalizedBody,
      footer: normalizedFooter,
      buttons: null,
      placeholders: normalizedPlaceholders,
      sampleValues: normalizedSampleValues,
      notes: notes || undefined,
      submit,
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      notify.success({
        key: 'wizard:template:created',
        title: submit ? 'Template submitted' : 'Template saved',
        description: submit ? 'We sent your template to Meta for review.' : 'You can find this draft in Templates > Your Templates.',
      });
      navigate(`/dashboard/templates/${created.id}`);
    } catch (error: unknown) {
      // Enhanced error parsing to extract user-friendly messages from API responses
      let toastTitle = submit ? 'Submission failed' : 'Save failed';
      let toastDescription = 'Please try again.';

      const extractWhatsAppError = (message: string | undefined) => {
        if (!message) return;
        try {
          // Try to parse nested error structure from API response
          // Example: "Failed to submit template for approval: 400 {\"error\":{...}}"
          const jsonMatch = message.match(/\{.*\}$/);
          if (!jsonMatch) {
            toastDescription = message;
            return;
          }
          const errorData = JSON.parse(jsonMatch[0]);

          const userTitle = errorData?.error?.error_user_title;
          const userMessage =
            errorData?.error?.error_user_msg ||
            errorData?.error?.message ||
            message;

          if (typeof userTitle === 'string' && userTitle.trim()) {
            toastTitle = userTitle.trim();
          }

          if (typeof userMessage === 'string' && userMessage.trim()) {
            toastDescription = userMessage.trim();
          }
        } catch {
          // If JSON parsing fails, use the raw message
          toastDescription = message;
        }
      };

      if (error && typeof error === 'object') {
        const fromAxios = error as { response?: { data?: { message?: string } }; message?: string };
        if (fromAxios?.response?.data?.message) {
          extractWhatsAppError(fromAxios.response.data.message);
        } else if (fromAxios?.message) {
          extractWhatsAppError(fromAxios.message);
        }
      }

      notify.error({
        key: 'wizard:template:create:error',
        title: toastTitle,
        description: toastDescription,
      });
    }
  };

  const duplicateBanner = duplicateId ? (
    <Card className='border-dashed bg-muted/40'>
      <CardContent className='flex items-center justify-between gap-4 py-4'>
        <div>
          <p className='text-sm font-medium text-foreground'>Duplicating existing template</p>
          <p className='text-xs text-muted-foreground'>We copied the content from template {duplicateId}. Update details below.</p>
        </div>
        <Badge variant='outline' className='uppercase tracking-wide'>
          Duplicate mode
        </Badge>
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className='p-4 sm:p-6 space-y-8'>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold text-foreground'>Create WhatsApp template</h1>
          <p className='text-sm text-muted-foreground'>Follow the guided steps to draft, preview, and submit a template for Meta review.</p>
          {isTestMode ? (
            <Badge variant='outline' className='border-dashed text-muted-foreground'>
              Test account — messages limited to whitelisted numbers. Billing disabled.
            </Badge>
          ) : null}
        </div>
        <Button variant='ghost' onClick={() => navigate(-1)}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Back
        </Button>
      </div>

      {duplicateBanner}

      <WizardStepIndicator step={step} />

      <Tabs value={step.toString()} className='hidden' />

      {step === 0 ? (
        <section className='space-y-6'>
          <div className='space-y-4'>
            <div>
              <h2 className='text-lg font-semibold text-foreground'>Choose a template type</h2>
              <p className='text-sm text-muted-foreground'>Pick a starting point that matches your message goal. You can tweak the copy later.</p>
            </div>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {(Object.keys(samplesByCategory) as TemplateCategory[]).map((option) => {
                const samples = samplesByCategory[option] ?? [];
                const active = category === option;
                return (
                  <Card
                    key={option}
                    className={cn(
                      'group relative h-full cursor-pointer border border-border border-solid transition-all duration-300 hover:-translate-y-0.5 hover:border-dashed hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      active ? 'border-primary bg-primary/5 shadow-lg' : ''
                    )}
                    onClick={() => setCategory(option)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCategory(option);
                      }
                    }}
                    role='button'
                    tabIndex={0}
                  >
                    <CardHeader
                      className={cn('space-y-2 rounded-lg transition-colors duration-300', active ? 'bg-primary/10' : 'group-hover:bg-primary/5')}
                    >
                      <div className='flex items-center gap-2'>
                        {renderCategoryIcon(option)}
                        <CardTitle className='text-base'>{CATEGORY_LABELS[option]}</CardTitle>
                      </div>
                      <CardDescription>{CATEGORY_DESCRIPTIONS[option]}</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {samples.slice(0, 2).map((sample) => (
                        <div key={sample.id} className='rounded-lg border bg-muted/20 p-3 transition hover:bg-muted/40'>
                          <div className='mb-2 flex items-center justify-between gap-3'>
                            <p className='text-sm font-medium text-foreground'>{sample.name}</p>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={(event) => {
                                event.stopPropagation();
                                applySample(sample);
                              }}
                            >
                              Use
                            </Button>
                          </div>
                          <p className='text-xs text-muted-foreground'>{sample.whyItWorks}</p>
                        </div>
                      ))}
                      {samples.length > 2 ? (
                        <p className='text-xs text-center text-muted-foreground'>+{samples.length - 2} more examples available</p>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Language</CardTitle>
              <CardDescription>Choose the language that matches your copy. You can translate later.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Label htmlFor='language'>Language code</Label>
              <Input id='language' placeholder='e.g. en, pt_BR' value={language} onChange={(event) => setLanguage(event.target.value)} />
              <p className='text-xs text-muted-foreground'>Use WhatsApp-recognised locale codes such as en, fr, es, pt_BR.</p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {step === 1 ? (
        <section className='grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='text-lg'>Compose template</CardTitle>
              <CardDescription>Write your content and label placeholders. Use snake_case for the template name.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='template-name'>Template name</Label>
                  <Input id='template-name' value={name} onChange={(event) => setName(event.target.value)} placeholder='welcome_offer' />
                  {!isNameValid ? <p className='text-xs text-destructive'>Name must be lowercase, snake_case, without spaces.</p> : null}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='template-header'>Header (optional)</Label>
                  <Input
                    id='template-header'
                    value={header}
                    onChange={(event) => setHeader(event.target.value)}
                    placeholder='Thanks for choosing LeadsBox!'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='template-body'>Body</Label>
                <Textarea
                  id='template-body'
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={6}
                  placeholder='Hi {{customer_name}}, enjoy {{discount}}% off...'
                />
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Use {`{{placeholders}}`} for personalised values.</span>
                  <Button variant='link' className='px-0 text-xs' onClick={() => setBody((current) => `${current} {{customer_name}}`)}>
                    Insert placeholder
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='template-footer'>Footer (optional)</Label>
                <Input id='template-footer' value={footer} onChange={(event) => setFooter(event.target.value)} placeholder='Reply STOP to opt out.' />
              </div>

              <Separator className='my-4' />

              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-foreground'>Variables</p>
                  <p className='text-xs text-muted-foreground'>
                    Detected placeholders must have labels and example values before submission. WhatsApp will convert these to indexed format (
                    {`{{1}}, {{2}}, etc.`}) automatically.
                  </p>
                </div>
                <div className='space-y-3'>
                  {Array.isArray(placeholders) && placeholders.length ? (
                    placeholders
                      .filter((p) => p && typeof p === 'object' && p.key)
                      .map((placeholder, index) => (
                        <div key={placeholder.key} className='grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_1fr]'>
                          <div className='space-y-1'>
                            <Label className='text-xs text-muted-foreground'>
                              Placeholder <Badge variant='outline' className='ml-1'>{`{{${placeholder.index}}}`}</Badge>
                            </Label>
                            <Input value={placeholder.key} disabled className='bg-muted' />
                          </div>
                          <div className='space-y-1'>
                            <Label className='text-xs text-muted-foreground'>Label</Label>
                            <Input
                              value={placeholder.label ?? ''}
                              onChange={(event) => {
                                const next = [...placeholders];
                                next[index] = { ...next[index], label: event.target.value };
                                setPlaceholders(next);
                              }}
                            />
                          </div>
                          <div className='space-y-1 md:col-span-2'>
                            <Label className='text-xs text-muted-foreground'>Example value</Label>
                            <Input
                              value={sampleValues[placeholder.key] ?? ''}
                              onChange={(event) =>
                                setSampleValues((current) => ({
                                  ...current,
                                  [placeholder.key]: event.target.value,
                                }))
                              }
                              placeholder={inferSampleValue(placeholder.key)}
                            />
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                      Add {`{{placeholders}}`} in your body to personalise messages.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className='space-y-4'>
            <TemplatePreview
              name={name}
              header={header}
              body={body}
              footer={footer}
              sampleValues={sampleValues}
              showSampleEditor
              onSampleChange={(key, value) =>
                setSampleValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
            />
            <p className='text-xs text-muted-foreground'>
              Need inspiration?{' '}
              <a
                className='text-primary underline underline-offset-4 hover:text-primary/80'
                href='https://developers.facebook.com/docs/whatsapp/message-templates/guidelines#categories'
                target='_blank'
                rel='noreferrer'
              >
                Review WhatsApp’s category guidelines
              </a>
              .
            </p>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className='grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Review</CardTitle>
              <CardDescription>Confirm everything looks correct before saving or submitting.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 text-sm'>
              <div className='grid gap-2 md:grid-cols-2'>
                <div>
                  <p className='text-xs uppercase text-muted-foreground'>Template name</p>
                  <p className='font-medium text-foreground'>{name}</p>
                </div>
                <div>
                  <p className='text-xs uppercase text-muted-foreground'>Category</p>
                  <p className='font-medium text-foreground'>{category ? CATEGORY_LABELS[category] : '—'}</p>
                </div>
                <div>
                  <p className='text-xs uppercase text-muted-foreground'>Language</p>
                  <p className='font-medium text-foreground'>{language}</p>
                </div>
                <div className='flex items-center gap-2'>
                  <p className='text-xs uppercase text-muted-foreground'>Status</p>
                  <TemplateStatusBadge status={submitAfterCreate ? 'SUBMITTED' : 'DRAFT'} />
                </div>
              </div>
              <Separator />
              <div className='space-y-2'>
                <p className='text-xs uppercase text-muted-foreground'>Variables</p>
                <div className='flex flex-wrap gap-2'>
                  {Array.isArray(placeholders) && placeholders.length ? (
                    placeholders
                      .filter((p) => p && typeof p === 'object' && p.key)
                      .map((placeholder) => (
                        <Badge key={placeholder.key} variant='outline'>
                          {placeholder.key}
                        </Badge>
                      ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>No placeholders detected.</span>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <p className='text-xs uppercase text-muted-foreground'>Notes</p>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder='Add context for your team (optional).'
                />
              </div>
            </CardContent>
          </Card>
          <TemplatePreview name={name} header={header} body={body} footer={footer} sampleValues={sampleValues} />
        </section>
      ) : null}

      <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-4'>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Info className='h-4 w-4' />
          Templates let you message contacts outside the 24-hour customer care window. Meta reviews usually finish within a few minutes.
        </div>
        <div className='flex items-center gap-2'>
          {step > 0 ? (
            <Button variant='outline' onClick={onBack} disabled={createMutation.isPending}>
              Back
            </Button>
          ) : (
            <Button variant='outline' onClick={() => navigate('/dashboard/templates')}>
              Cancel
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={onNext} disabled={(step === 0 && !canContinueStepOne) || (step === 1 && !canContinueStepTwo)}>
              Next <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          ) : (
            <div className='flex items-center gap-2'>
              <Button variant='outline' onClick={() => onSubmit(false)} disabled={createMutation.isPending}>
                Save draft
              </Button>
              <Button onClick={() => onSubmit(true)} disabled={createMutation.isPending}>
                <Sparkles className='mr-2 h-4 w-4' /> Submit for approval
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateWizardPage;
