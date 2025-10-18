import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Filter, Plus, RefreshCcw, CheckCircle, MessageSquare, Clock, Zap, Trash2 } from 'lucide-react';
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
import type { Template, TemplateCategory, TemplateStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useConfirm } from '@/ui/ux/confirm-dialog';

type TemplateListFilters = {
  search?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  language?: string;
};

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

// Simple step component for better UX
const Step = ({
  icon: Icon,
  title,
  description,
  number,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  number: number;
}) => (
  <div className='flex gap-3 items-start'>
    <div className='flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
      <span className='text-sm font-semibold text-primary'>{number}</span>
    </div>
    <div className='space-y-1'>
      <div className='flex items-center gap-2'>
        <Icon className='h-4 w-4 text-primary' />
        <h3 className='font-medium text-sm'>{title}</h3>
      </div>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  </div>
);

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

  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const deleteMutation = useMutation<void, unknown, { id: string; name: string }>({
    mutationFn: async ({ id }) => {
      await templateApi.remove(id);
    },
    onSuccess: (_, variables) => {
      notify.success({
        key: `templates:${variables.id}:deleted`,
        title: 'Template deleted',
        description: `"${variables.name}" has been removed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
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

  const templates = templatesQuery.data ?? [];
  const isLoading = templatesQuery.isLoading;
  const isTestMode = Boolean(import.meta.env.VITE_APP_ENV?.toLowerCase() === 'test');

  const onCreate = () => navigate('/dashboard/templates/new');
  const handleDeleteTemplate = async (template: Template) => {
    const confirmed = await confirmDialog({
      title: 'Delete this template?',
      description: `This will permanently delete "${template.name}". You won't be able to use it in broadcasts or automations.`,
      confirmText: 'Delete template',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync({ id: template.id, name: template.name });
  };
  return (
    <div className='p-4 sm:p-6 space-y-8'>
      {/* Hero Section - Simplified */}
      <section className='text-center space-y-4'>
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold'>WhatsApp Message Templates</h1>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            Send approved messages to customers anytime. Create your template in 3 simple steps.
          </p>
        </div>
        <Button size='lg' onClick={onCreate} className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Your First Template
        </Button>
      </section>

      {/* How it Works - Step by Step */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-5 w-5 text-primary' />
              How it works
            </CardTitle>
            <CardDescription>Get your WhatsApp templates approved and ready to use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <Step number={1} icon={MessageSquare} title='Write your message' description='Add placeholders like {{name}} for personalization' />
              <Step number={2} icon={Clock} title='Submit for approval' description='Meta reviews and approves within minutes' />
              <Step number={3} icon={CheckCircle} title='Start messaging' description='Use in broadcasts, automations, or manual messages' />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Existing Templates - Only show if user has templates */}
      {templates.length > 0 && (
        <section className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Your Templates ({templates.length})</h2>
            <div className='flex items-center gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <BookOpen className='h-4 w-4' />
                    Help
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80 space-y-4 text-sm' align='end'>
                  <div className='space-y-3'>
                    <h4 className='font-medium'>Template Guidelines</h4>
                    {GLOSSARY_ITEMS.map((item) => (
                      <div key={item.term} className='space-y-1'>
                        <p className='font-medium text-foreground'>{item.term}</p>
                        <p className='text-muted-foreground text-xs'>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant='outline' size='sm' onClick={() => templatesQuery.refetch()} disabled={isLoading} className='gap-2'>
                <RefreshCcw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative'>
              <Input
                value={ui.search}
                onChange={(event) => ui.setSearch(event.target.value)}
                placeholder='Search templates...'
                className='pr-10 w-64'
              />
              <Filter className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            </div>
            <Select value={ui.category} onValueChange={(value) => ui.setCategory(value as 'ALL' | TemplateCategory)}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Type' />
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
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden md:table-cell'>Updated</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={5}>
                          <Skeleton className='h-10 w-full' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : templates.length ? (
                    templates.map((template) => {
                      const isDeleting = deleteMutation.isPending && deleteMutation.variables?.id === template.id;
                      return (
                        <TableRow key={template.id} className='hover:bg-muted/50'>
                        <TableCell className='font-medium'>
                          <div>
                            <p className='font-medium'>{template.name}</p>
                            <p className='text-xs text-muted-foreground'>{template.variables?.length ?? 0} variables</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{CATEGORY_LABELS[template.category]}</Badge>
                        </TableCell>
                        <TableCell>
                          <TemplateStatusBadge status={template.status as TemplateStatus} />
                        </TableCell>
                        <TableCell className='hidden text-sm text-muted-foreground md:table-cell'>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='destructive'
                              size='sm'
                              disabled={isDeleting}
                              onClick={async (event) => {
                                event.stopPropagation();
                                await handleDeleteTemplate(template);
                              }}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='sm'>
                                  <ArrowRight className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/templates/${template.id}`)}>View details</DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate('/dashboard/templates/new', {
                                      state: { duplicateOf: template.id, prefills: template },
                                    })
                                  }
                                >
                                  Duplicate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className='py-8 text-center text-sm text-muted-foreground'>
                        No templates found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default TemplatesHomePage;
