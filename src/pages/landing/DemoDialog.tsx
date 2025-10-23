import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type DemoDialogProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
};

const DemoDialog = ({ open, onOpenChange }: DemoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>LeadsBox in 60 seconds</DialogTitle>
          <DialogDescription>Quick walkthrough of the unified inbox and AI follow-ups.</DialogDescription>
        </DialogHeader>
        <div className='aspect-video w-full overflow-hidden rounded-md border'>
          <iframe
            title='LeadsBox demo'
            className='h-full w-full'
            src='https://www.youtube.com/embed/dQw4w9WgXcQ'
            loading='lazy'
            referrerPolicy='strict-origin-when-cross-origin'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoDialog;
