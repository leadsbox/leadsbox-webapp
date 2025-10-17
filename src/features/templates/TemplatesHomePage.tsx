import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Filter,
  Library,
  Plus,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { notify } from '@/lib/toast';
import templateApi from '@/api/templates';
import TemplateStatusBadge from './components/TemplateStatusBadge';
import type { Template, TemplateCategory, TemplateStatus, TemplateListFilters } from '@/types';
import { TEMPLATE_SAMPLES_BY_CATEGORY, TemplateSample } from './data/templateSamples';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utility',
  AUTHENTICATION: 'Authentication',
};

const STATUS_FILTERS: Array<{ value: 'ALL' | TemplateStatus; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DEPRECATED', label: 'Deprecated' },
];

const CATEGORY_FILTERS: Array<{ value: 'ALL' | TemplateCategory; label: string }> = [
  { value: 'ALL', label: 'All types' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
];

const LANGUAGE_FILTERS = [
  { value: 'ALL', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
];

const GLOSSARY_ITEMS = [
  {
    term: '24-hour customer care window',
    description:
      'WhatsApp lets you reply to customer-initiated messages within 24 hours for free-form conversations. After that you must use an approved template.',
  },
  {
    term: 'Conversation categories',
    description:
      'WhatsApp billable conversations fall into Marketing, Utility, or Authentication buckets. Choose the category that matches your message intent.',
  },
  {
    term: 'Placeholders',
    description:
      'Use double braces like {{name}} inside your template body. Each placeholder must be labelled with a sample value before you submit.',
  },
];

const useTemplateFilters = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | TemplateCategory>('ALL');
  const [status, setStatus] = useState<'ALL' | TemplateStatus>('ALL');
  const [language, setLanguage] = useState('ALL');

  const queryFilters = useMemo<TemplateListFilters>(() => {
    const filters: TemplateListFilters = {};
    if (search.trim()) filters.search = search.trim();
    if (category !== 'ALL') filters.category = category;
    if (status !== 'ALL') filters.status = status;
    if (language !== 'ALL') filters.language = language;
    return filters;
  }, [search, category, status, language]);

  return {
    filters: queryFilters,
    ui: {
      search,
      setSearch,
      category,
      setCategory,
      status,
      setStatus,
      language,
      setLanguage,
    },
  } as const;
};

const TemplateSamplesSection = ({
  category,
  samples,
  onUseSample,
}: {
  category: TemplateCategory;
  samples: TemplateSample[];
  onUseSample: (sample: TemplateSample) => void;
}) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-sm">{CATEGORY_LABELS[category]}</CardTitle>
      <CardDescription>
        {category === 'MARKETING'
          ? 'Promote responsibly with clear value, opt-out instructions, and opt-in proof.'
          : category === 'UTILITY'
          ? 'Order updates, reminders, and account notifications—no promotional hooks.'
          : 'One-time passwords and login alerts that keep accounts secure.'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {samples.map((sample) => (
        <div key={sample.id} className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{sample.name}</p>
              <p className="text-xs text-muted-foreground">{sample.whyItWorks}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onUseSample(sample)}>
              Use example
            </Button>
          </div>
          <ScrollArea className="mt-3 max-h-32 rounded-md bg-background/80 p-3 text-xs text-muted-foreground">
            <pre className="whitespace-pre-wrap">{sample.body}</pre>
          </ScrollArea>
        </div>
      ))}
    </CardContent>
  </Card>
);

const TemplatesHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, ui } = useTemplateFilters();

  const templatesQuery = useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const result = await templateApi.list(filters);
      return result ?? [];
    },
  });

  const templates = templatesQuery.data ?? [];
  const isLoading = templatesQuery.isLoading;
  const isTestMode = Boolean(import.meta.env.VITE_APP_ENV?.toLowerCase() === 'test');

  const onCreate = () => navigate('/dashboard/templates/new');
  const onUseSample = (sample: TemplateSample) =>
    navigate('/dashboard/templates/new', { state: { sampleId: sample.id, prefills: sample } });

  const filteredSamples = useMemo(() => TEMPLATE_SAMPLES_BY_CATEGORY, []);

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Send approved WhatsApp messages with confidence</CardTitle>
            <CardDescription>
              Templates let you message customers after the 24-hour window closes. Choose a type, personalize with placeholders, and submit for Meta review in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Marketing templates drive opt-in offers and winbacks.</p>
              <p>• Utility templates keep orders and appointments on track.</p>
              <p>• Authentication templates handle OTPs and login alerts.</p>
            </div>
            <Button size="lg" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create template
            </Button>
          </CardContent>
          <Library className="absolute -right-6 -top-6 h-24 w-24 text-muted opacity-20" />
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">How templates work</CardTitle>
              <CardDescription>Quick refresher on Meta rules and best practices.</CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-4 text-sm" align="end">
                {GLOSSARY_ITEMS.map((item) => (
                  <div key={item.term}>
                    <p className="font-medium text-foreground">{item.term}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                1. Draft your copy with <code>{'{{placeholder}}'}</code> tokens labelled in the Variables panel.
              </li>
              <li>2. Submit for approval — Meta typically responds within a few minutes.</li>
              <li>3. Use approved templates in broadcasts, automations, or manual follow-ups.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(Object.keys(filteredSamples) as TemplateCategory[]).map((category) => (
          <TemplateSamplesSection
            key={category}
            category={category}
            samples={filteredSamples[category]}
            onUseSample={onUseSample}
          />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Input
                value={ui.search}
                onChange={(event) => ui.setSearch(event.target.value)}
                placeholder="Search templates"
                className="pr-10"
              />
              <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={ui.category} onValueChange={(value) => ui.setCategory(value as 'ALL' | TemplateCategory)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ui.status} onValueChange={(value) => ui.setStatus(value as 'ALL' | TemplateStatus)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ui.language} onValueChange={(value) => ui.setLanguage(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {isTestMode ? (
              <Badge variant="outline" className="border-dashed text-muted-foreground">
                Test account — send tests to whitelisted numbers only
              </Badge>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => templatesQuery.refetch()} disabled={templatesQuery.isFetching}>
              <RefreshCcw
                className={cn('mr-2 h-4 w-4', templatesQuery.isFetching && 'animate-spin')}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : templates.length ? (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium text-foreground">
                        {template.name}
                        <div className="text-xs text-muted-foreground">{template.variables?.length ?? 0} variables</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CATEGORY_LABELS[template.category]}</Badge>
                      </TableCell>
                      <TableCell className="uppercase text-muted-foreground">{template.language}</TableCell>
                      <TableCell>
                        <TemplateStatusBadge status={template.status as TemplateStatus} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {new Date(template.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/templates/${template.id}`)}>
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate('/dashboard/templates/new', {
                                  state: { duplicateOf: template.id, prefills: template },
                                })
                              }
                            >
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                notify.info({
                                  key: `templates:${template.id}:send-test`,
                                  title: 'Open template details to send a test',
                                });
                              }}
                            >
                              Send test
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                notify.warning({
                                  key: `templates:${template.id}:archive`,
                                  title: 'Archive coming soon',
                                  description: 'Use Deprecate in the detail view to retire a template.',
                                });
                              }}
                            >
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No templates yet. Start with a sample above or build one from scratch.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default TemplatesHomePage;
