import { FC, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AutomationBuilder from '../builder/AutomationBuilder';
import { AutomationFlow } from '../builder/types';
import { createDefaultFlow } from '../builder/utils';

interface NewAutomationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFlow?: AutomationFlow;
  onSave?: (flow: AutomationFlow) => void;
}

const NewAutomationModal: FC<NewAutomationModalProps> = ({ open, onOpenChange, initialFlow, onSave }) => {
  const [flow] = useState<AutomationFlow>(initialFlow ?? createDefaultFlow());

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        onOpenChange(false);
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent className='h-[100vh] max-h-[100vh] w-[100vw] max-w-[100vw] overflow-hidden border-0 bg-background p-0'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Build automation</DialogTitle>
        </DialogHeader>
        <AutomationBuilder
          initialFlow={flow}
          onSave={onSave}
          onClose={(response) => {
            onOpenChange(false);
            if (response?.saved && response.flow) {
              onSave?.(response.flow);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewAutomationModal;
