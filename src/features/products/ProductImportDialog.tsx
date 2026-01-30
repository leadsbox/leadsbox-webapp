import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { CloudUpload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { productsApi, Product } from '@/api/products';
import { cn } from '@/lib/utils';

// Define the shape of CSV rows we expect
interface CSVProductRow {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice: string | number;
  currency?: string;
  inStock?: string | boolean;
  stockQuantity?: string | number;
  imageUrl?: string;
}

interface ProductImportDialogProps {
  onSuccess?: () => void;
}

export function ProductImportDialog({ onSuccess }: ProductImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Product>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const queryClient = useQueryClient();

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setIsParsing(false);
  };

  const { mutate: bulkCreate, isPending: isUploading } = useMutation({
    mutationFn: productsApi.bulk,
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.data.count} products`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      resetState();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Import failed', error);
      toast.error('Failed to import products. Please check your data and try again.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a valid CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    setErrors([]);
    setParsedData([]);

    Papa.parse<CSVProductRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Normalize headers
      complete: (results) => {
        setIsParsing(false);
        const { data, meta } = results;

        if (data.length === 0) {
          setErrors(['The CSV file appears to be empty.']);
          return;
        }

        // Validate required fields
        const validationErrors: string[] = [];
        const validProducts: Partial<Product>[] = [];

        data.forEach((row, index) => {
          const rowNum = index + 2; // +1 for 0-index, +1 for header

          if (!row.name || !row.name.trim()) {
            validationErrors.push(`Row ${rowNum}: Product name is required`);
            return; // Skip invalid row
          }

          if (!row.unitPrice) {
            validationErrors.push(`Row ${rowNum}: Unit price is required for "${row.name}"`);
            return;
          }

          const price = parseFloat(row.unitPrice.toString().replace(/[^0-9.]/g, ''));
          if (isNaN(price)) {
            validationErrors.push(`Row ${rowNum}: Invalid price format for "${row.name}"`);
            return;
          }

          // Construct product object
          validProducts.push({
            name: row.name.trim(),
            description: row.description?.trim(),
            sku: row.sku?.trim(),
            category: row.category?.trim(),
            unitPrice: price,
            currency: row.currency?.trim() || 'NGN',
            // Handle various boolean representations
            inStock:
              typeof row.inStock === 'string'
                ? row.inStock.toLowerCase() === 'true' || row.inStock === '1' || row.inStock.toLowerCase() === 'yes'
                : !!row.inStock,
            stockQuantity: row.stockQuantity ? parseInt(row.stockQuantity.toString()) : 0,
            imageUrl: row.imageUrl?.trim(),
          });
        });

        setErrors(validationErrors);
        setParsedData(validProducts);
      },
      error: (error) => {
        setIsParsing(false);
        setErrors([`Parsing error: ${error.message}`]);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const headers = ['name', 'unitPrice', 'category', 'description', 'sku', 'stockQuantity', 'inStock', 'currency'];
    const example = ['Example Product', '5000', 'Electronics', 'A great product', 'SKU-123', '10', 'true', 'NGN'];
    const csvContent = [headers.join(','), example.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leadsbox_product_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setTimeout(resetState, 300); // Reset after animation
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline'>
          <FileText className='mr-2 h-4 w-4' />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple products at once.{' '}
            <button onClick={handleDownloadTemplate} className='text-primary hover:underline font-medium inline-flex items-center'>
              Download template
            </button>
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-hidden flex flex-col gap-4 py-4'>
          {!file ? (
            <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-10 text-center transition-colors hover:bg-muted/50'>
              <CloudUpload className='h-10 w-10 text-muted-foreground mb-4' />
              <h3 className='font-semibold text-lg'>Click to upload CSV</h3>
              <p className='text-sm text-muted-foreground mb-4'>or drag and drop file here</p>
              <input type='file' accept='.csv' className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' onChange={handleFileChange} />
              <p className='text-xs text-muted-foreground mt-2'>Max 5MB</p>
            </div>
          ) : (
            <div className='flex flex-col h-full gap-4'>
              <div className='flex items-center justify-between p-3 border rounded-md bg-muted/20'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 p-2 rounded'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='font-medium text-sm truncate max-w-[200px]'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={resetState}>
                  Change
                </Button>
              </div>

              {isParsing && (
                <div className='flex items-center justify-center py-8 text-muted-foreground'>
                  <Loader2 className='h-5 w-5 animate-spin mr-2' />
                  Parsing file...
                </div>
              )}

              {errors.length > 0 && (
                <Alert variant='destructive' className='max-h-32 overflow-y-auto'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Found {errors.length} issues</AlertTitle>
                  <AlertDescription className='text-xs mt-1'>
                    <ul className='list-disc pl-4 space-y-1'>
                      {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {parsedData.length > 0 && !isParsing && (
                <div className='flex-1 overflow-hidden border rounded-md flex flex-col'>
                  <div className='bg-muted p-2 text-xs font-medium flex justify-between items-center border-b'>
                    <span>Preview ({parsedData.length} valid products)</span>
                    {errors.length > 0 && <span className='text-destructive'>{errors.length} skipped</span>}
                  </div>
                  <ScrollArea className='flex-1'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-1/3'>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>In Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.slice(0, 50).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className='font-medium'>{row.name}</TableCell>
                            <TableCell>
                              {row.currency} {row.unitPrice?.toLocaleString()}
                            </TableCell>
                            <TableCell>{row.category || '-'}</TableCell>
                            <TableCell>{row.inStock ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                        {parsedData.length > 50 && (
                          <TableRow>
                            <TableCell colSpan={4} className='text-center text-xs text-muted-foreground py-2'>
                              ...and {parsedData.length - 50} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={() => bulkCreate(parsedData)} disabled={parsedData.length === 0 || isUploading || isParsing}>
            {isUploading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Importing...
              </>
            ) : (
              <>
                <CloudUpload className='mr-2 h-4 w-4' />
                Import {parsedData.length} Products
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
