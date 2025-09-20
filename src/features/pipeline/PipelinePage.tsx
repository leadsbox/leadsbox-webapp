// Pipeline Page Component for LeadsBox Dashboard

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus,
  DollarSign,
  Calendar,
  User,
  Building,
  MoreHorizontal,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { mockLeads, mockUsers, getLeadsByStage } from '../../data/mockData';
import { Lead, Stage, LeadLabel, leadLabelUtils } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface SortableLeadCardProps {
  lead: Lead;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({ lead }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignedUser = mockUsers.find(user => user.id === lead.assignedTo);

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-sm leading-tight">{lead.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>{lead.email}</span>
            </div>
            
            {lead.company && (
              <div className="flex items-center">
                <Building className="h-3 w-3 mr-1" />
                <span>{lead.company}</span>
              </div>
            )}
            
            {lead.value && (
              <div className="flex items-center font-medium text-foreground">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>${lead.value.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Badge variant="outline" className={getPriorityColor(lead.priority)}>
              {lead.priority}
            </Badge>
            
            {assignedUser && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignedUser.avatar} />
                <AvatarFallback className="text-xs">
                  {assignedUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}
                >
                  {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0 bg-slate-50 text-slate-700 border border-slate-200">
                  +{lead.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface PipelineStageProps {
  stage: Stage;
  title: string;
  leads: Lead[];
  color: string;
}

const PipelineStage: React.FC<PipelineStageProps> = ({ stage, title, leads, color }) => {
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

  return (
    <div className="flex-1 min-w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${color}`}></div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {leads.length}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {totalValue > 0 && (
            <div className="text-xs text-muted-foreground">
              Total: ${totalValue.toLocaleString()}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-auto">
              {leads.map((lead) => (
                <SortableLeadCard key={lead.id} lead={lead} />
              ))}
              {leads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No leads in this stage</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Lead
                  </Button>
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
};

const PipelinePage: React.FC = () => {
  const [leads, setLeads] = useState(mockLeads);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stageConfig = {
    NEW: { title: 'New Leads', color: 'bg-blue-500' },
    QUALIFIED: { title: 'Qualified', color: 'bg-amber-500' },
    IN_PROGRESS: { title: 'In Progress', color: 'bg-purple-500' },
    WON: { title: 'Won', color: 'bg-green-500' },
    LOST: { title: 'Lost', color: 'bg-red-500' },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the lead being dragged
    const draggedLead = leads.find(lead => lead.id === activeId);
    if (!draggedLead) return;

    // Determine the new stage based on the drop zone
    let newStage: Stage | null = null;
    
    // Check if dropping over another lead (same stage)
    const overLead = leads.find(lead => lead.id === overId);
    if (overLead) {
      newStage = overLead.stage;
    } else {
      // Check if dropping over a stage area
      const stageFromId = Object.keys(stageConfig).find(stage => 
        overId.includes(stage.toLowerCase())
      ) as Stage;
      if (stageFromId) {
        newStage = stageFromId;
      }
    }

    if (newStage && newStage !== draggedLead.stage) {
      // Update the lead's stage
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === activeId 
            ? { ...lead, stage: newStage!, updatedAt: new Date().toISOString() }
            : lead
        )
      );

      // Show toast notification (would use actual toast in real app)
      console.log(`Moved ${draggedLead.name} to ${newStage}`);
    }

    // Handle reordering within the same stage
    if (activeId !== overId && overLead && draggedLead.stage === overLead.stage) {
      const activeIndex = leads.findIndex(lead => lead.id === activeId);
      const overIndex = leads.findIndex(lead => lead.id === overId);
      
      setLeads(prevLeads => arrayMove(prevLeads, activeIndex, overIndex));
    }
  };

  // Calculate pipeline stats
  const pipelineStats = {
    totalValue: leads.reduce((sum, lead) => sum + (lead.value || 0), 0),
    totalLeads: leads.length,
    conversionRate: leads.length > 0 ? (leads.filter(l => l.stage === 'WON').length / leads.length) * 100 : 0,
    avgDealSize: leads.length > 0 ? leads.reduce((sum, lead) => sum + (lead.value || 0), 0) / leads.length : 0,
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track deals through your sales process</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pipelineStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineStats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Avg Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pipelineStats.avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <div className="min-h-[540px] sm:min-h-[600px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-6">
            {(Object.keys(stageConfig) as Stage[]).map((stage) => {
              const stageLeads = leads.filter(lead => lead.stage === stage);
              const config = stageConfig[stage];
              
              return (
                <PipelineStage
                  key={stage}
                  stage={stage}
                  title={config.title}
                  leads={stageLeads}
                  color={config.color}
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default PipelinePage;
