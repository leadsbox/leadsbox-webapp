// Leads Page Component for LeadsBox Dashboard

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Tag,
  Calendar,
  DollarSign,
  MessageCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { mockLeads, mockUsers } from '../../data/mockData';
import { Lead, Stage } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const LeadsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'QUALIFIED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'WON':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'LOST':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

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

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'whatsapp':
        return '💬';
      case 'telegram':
        return '✈️';
      case 'website':
        return '🌐';
      case 'manual':
        return '📝';
      default:
        return '📝';
    }
  };

  const getAssignedUser = (userId: string) => {
    return mockUsers.find(user => user.id === userId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage and track your leads</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={stageFilter} onValueChange={(value) => setStageFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="NEW">New</TabsTrigger>
            <TabsTrigger value="QUALIFIED">Qualified</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="WON">Won</TabsTrigger>
            <TabsTrigger value="LOST">Lost</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLeads.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockLeads.filter(l => l.stage === 'QUALIFIED').length}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockLeads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const assignedUser = getAssignedUser(lead.assignedTo || '');
                
                return (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {lead.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {lead.company && (
                          <>
                            <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{lead.company}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="mr-1">{getSourceIcon(lead.source)}</span>
                        <span className="capitalize text-sm">{lead.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStageColor(lead.stage)}>
                        {lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedUser && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignedUser.avatar} />
                            <AvatarFallback className="text-xs">
                              {assignedUser.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignedUser.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.value && (
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="font-medium">{lead.value.toLocaleString()}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {lead.lastActivity && formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[600px] sm:w-[600px]">
                          <SheetHeader>
                            <SheetTitle>Lead Profile</SheetTitle>
                            <SheetDescription>
                              View and manage lead information
                            </SheetDescription>
                          </SheetHeader>
                          
                          {selectedLead && (
                            <div className="mt-6 space-y-6">
                              {/* Lead Header */}
                              <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                    {selectedLead.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h2 className="text-2xl font-semibold">{selectedLead.name}</h2>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-muted-foreground">{selectedLead.email}</span>
                                    {selectedLead.phone && (
                                      <span className="text-muted-foreground">{selectedLead.phone}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="icon">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Status and Priority */}
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline" className={getStageColor(selectedLead.stage)}>
                                  {selectedLead.stage}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(selectedLead.priority)}>
                                  {selectedLead.priority}
                                </Badge>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span className="mr-1">{getSourceIcon(selectedLead.source)}</span>
                                  <span className="capitalize">{selectedLead.source}</span>
                                </div>
                              </div>

                              {/* Lead Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Company</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center">
                                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>{selectedLead.company || 'Not specified'}</span>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Value</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {selectedLead.value ? `$${selectedLead.value.toLocaleString()}` : 'Not set'}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Created</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>
                                        {formatDistanceToNow(new Date(selectedLead.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Assigned To</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {selectedLead.assignedTo && (
                                      <div className="flex items-center">
                                        <Avatar className="h-6 w-6 mr-2">
                                          <AvatarImage src={getAssignedUser(selectedLead.assignedTo)?.avatar} />
                                          <AvatarFallback className="text-xs">
                                            {getAssignedUser(selectedLead.assignedTo)?.name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span>{getAssignedUser(selectedLead.assignedTo)?.name}</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Tags */}
                              {selectedLead.tags.length > 0 && (
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center">
                                      <Tag className="h-4 w-4 mr-2" />
                                      Tags
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedLead.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Notes */}
                              {selectedLead.notes && (
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Notes</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {selectedLead.notes}
                                    </p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Actions */}
                              <div className="flex space-x-2 pt-4 border-t">
                                <Button className="flex-1">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Lead
                                </Button>
                                <Button variant="outline">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                                <Button variant="outline" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsPage;