import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { salesApi } from '@/api/sales';
import { notify } from '@/lib/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onSuccess?: () => void;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ open, onOpenChange, leadId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        notify.error({ title: 'Invalid File', description: 'Please upload a CSV file' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error({ title: 'No File Selected', description: 'Please select a CSV file to upload' });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);

      await salesApi.importCSV(formData);

      notify.success({ title: 'Import Successful', description: 'Sales data imported from CSV' });
      onOpenChange(false);
      onSuccess?.();
      setFile(null);
    } catch (error) {
      notify.error({ title: 'Import Failed', description: 'Failed to import sales data. Please check the file format.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Import Sales from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file with sales data. All imported sales will be tagged as "Imported".</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <Alert>
            <AlertDescription>
              <strong>CSV Format:</strong> The file should have columns: date, item_name, quantity, unit_price, currency (optional), status (optional)
            </AlertDescription>
          </Alert>

          <div className='space-y-2'>
            <Label htmlFor='csv-file'>Select CSV File</Label>
            <div className='flex items-center gap-2'>
              <Input id='csv-file' type='file' accept='.csv,text/csv' onChange={handleFileChange} className='flex-1' />
              {file && (
                <Button variant='ghost' size='sm' onClick={() => setFile(null)}>
                  Clear
                </Button>
              )}
            </div>
            {file && (
              <p className='text-sm text-muted-foreground'>
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {!file && (
            <div className='border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground'>
              <Upload className='h-12 w-12 mx-auto mb-3 opacity-50' />
              <p className='text-sm'>Click the input above to select a CSV file</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Importing...' : 'Import Sales'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
