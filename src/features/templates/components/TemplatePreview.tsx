import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type TemplatePreviewProps = {
  name?: string;
  header?: string | null;
  body: string;
  footer?: string | null;
  sampleValues?: Record<string, string>;
  showSampleEditor?: boolean;
  onSampleChange?: (key: string, value: string) => void;
  className?: string;
};

const renderWithValues = (text: string, values: Record<string, string>) =>
  text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, token: string) => values[token] ?? `{{${token}}}`);

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  name,
  header,
  body,
  footer,
  sampleValues = {},
  showSampleEditor,
  onSampleChange,
  className,
}) => {
  const contentValues = React.useMemo(() => sampleValues, [sampleValues]);
  const renderedBody = React.useMemo(() => renderWithValues(body, contentValues), [body, contentValues]);
  const renderedHeader = React.useMemo(() => (header ? renderWithValues(header, contentValues) : null), [header, contentValues]);
  const renderedFooter = React.useMemo(() => (footer ? renderWithValues(footer, contentValues) : null), [footer, contentValues]);

  const allPlaceholders = React.useMemo(
    () => Array.from(new Set((body.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).map((match) => match.replace(/[{}\s]/g, '')))),
    [body]
  );

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">WhatsApp preview{name ? ` • ${name}` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          {renderedHeader ? <p className="mb-2 font-semibold text-foreground">{renderedHeader}</p> : null}
          <ScrollArea className="max-h-60">
            <p className="whitespace-pre-wrap text-foreground">{renderedBody}</p>
          </ScrollArea>
          {renderedFooter ? (
            <>
              <Separator className="my-3" />
              <p>{renderedFooter}</p>
            </>
          ) : null}
        </div>

        {showSampleEditor ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sample values</p>
            <div className="space-y-2">
              {allPlaceholders.length ? (
                allPlaceholders.map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{key}</label>
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={contentValues[key] ?? ''}
                      onChange={(event) => onSampleChange?.(key, event.target.value)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No placeholders detected in the body.</p>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TemplatePreview;
