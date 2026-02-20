import React, { useMemo } from 'react';
import { Lead, LeadLabel, leadLabelUtils } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WhatsAppIcon } from '@/components/brand-icons';
import { formatDistanceToNow } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LeadsBoardViewProps {
  leads: Lead[];
  onLeadMove: (leadId: string, newLabel: string) => void;
  onLeadClick: (lead: Lead) => void;
}

// Draggable Lead Card Component
const SortableLeadCard = ({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const displayName = lead.contact?.name || lead.name || 'Unknown';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${isDragging ? 'z-50 shadow-lg' : 'shadow-sm'}`}
      onClick={(e) => {
        // Prevent click when dragging
        if (!isDragging) onClick(lead);
      }}
    >
      <CardContent className='p-3 space-y-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8 text-xs'>
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='flex flex-col overflow-hidden'>
              <span className='font-medium text-sm truncate'>{displayName}</span>
              <span className='text-xs text-muted-foreground truncate'>{lead.contact?.phone || lead.phone || lead.email}</span>
            </div>
          </div>
          <div className='shrink-0 mt-1'>{lead.source === 'whatsapp' && <WhatsAppIcon className='h-3.5 w-3.5 text-green-500' />}</div>
        </div>

        {lead.Deal && lead.Deal.length > 0 && (
          <div className='flex items-center gap-1'>
            <Badge variant='outline' className='text-xs bg-muted/50 font-normal'>
              {lead.Deal.length} Deal{lead.Deal.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        <div className='flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground'>
          <span className='truncate mr-2'>{lead.assignedTo?.name || 'Unassigned'}</span>
          <span className='whitespace-nowrap'>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Column Component
const BoardColumn = ({
  title,
  labelValue,
  leads,
  onLeadClick,
}: {
  title: string;
  labelValue: string;
  leads: Lead[];
  onLeadClick: (l: Lead) => void;
}) => {
  return (
    <div className='flex-1 min-w-[300px] max-w-[350px] flex flex-col bg-muted/30 rounded-lg overflow-hidden border'>
      <div className='p-3 border-b bg-muted/50 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold text-sm'>{title}</h3>
          <Badge variant='secondary' className='rounded-full h-5 px-1.5 text-xs'>
            {leads.length}
          </Badge>
        </div>
      </div>

      <div className='flex-1 p-2 overflow-y-auto space-y-2 min-h-[150px]'>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className='h-full flex items-center justify-center p-4 text-center border-2 border-dashed rounded-lg border-muted-foreground/20'>
            <span className='text-xs text-muted-foreground'>Drop leads here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const LeadsBoardView = ({ leads, onLeadMove, onLeadClick }: LeadsBoardViewProps) => {
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null);

  // Group leads by stage/label
  const mappedGroups = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    const ALL_LABELS = leadLabelUtils.getAllLabelOptions();

    // Initialize all columns
    ALL_LABELS.forEach((opt) => {
      groups[opt.value] = [];
    });

    // Add fallback column for UNKNOWN or missing tags
    groups['UNLABELED'] = [];

    leads.forEach((lead) => {
      const label = (lead.tags?.[0] || lead.stage || 'UNLABELED') as string;
      if (groups[label]) {
        groups[label].push(lead);
      } else {
        // Fallback for labels that somehow don't exist in config
        groups['UNLABELED'].push(lead);
      }
    });

    return groups;
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag distance before firing (prevents accidental clicks as drags)
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;

    // Find what container we dropped into or onto
    let targetLabel = '';

    // Check if we dropped over a sortable item (another lead)
    const overLead = leads.find((l) => l.id === over.id);
    if (overLead) {
      targetLabel = overLead.tags?.[0] || overLead.stage || 'UNLABELED';
    }
    // If not dropped over a lead, check if dropped over a column container (would need explicit droppable IDs setup)
    // For simplicity in this demo, if it's over the container, extract from the parent.
    // Usually dnd-kit uses collision detection to find the closest droppable.

    // Get the original label of the dragged item
    const originalLead = leads.find((l) => l.id === leadId);
    const originalLabel = originalLead?.tags?.[0] || originalLead?.stage || 'UNLABELED';

    // If destination is different, trigger API/state update
    if (targetLabel && targetLabel !== originalLabel) {
      onLeadMove(leadId, targetLabel);
    }
  };

  const columns = leadLabelUtils.getAllLabelOptions();

  return (
    <div className='flex h-full w-full overflow-x-auto pb-4 pt-2 gap-4 snap-x'>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {columns.map((col) => (
          <BoardColumn key={col.value} title={col.label} labelValue={col.value} leads={mappedGroups[col.value] || []} onLeadClick={onLeadClick} />
        ))}
        {mappedGroups['UNLABELED'].length > 0 && (
          <BoardColumn key='UNLABELED' title='Unlabeled' labelValue='UNLABELED' leads={mappedGroups['UNLABELED']} onLeadClick={onLeadClick} />
        )}

        {/* Drag Overlay for smooth visuals while dragging */}
        <DragOverlay>{activeLead ? <SortableLeadCard lead={activeLead} onClick={() => {}} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
};
