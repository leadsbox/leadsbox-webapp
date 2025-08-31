// Settings Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Users,
  Building,
  Tag,
  MessageSquare,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Save,
  User as UserIcon,
  X,
  Check,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { mockUsers, mockOrganization } from '../../data/mockData';
import { User } from '../../types';
import { ThemeSettings } from './components/ThemeSettings';
import client from '../../api/client';
import { API_BASE, endpoints } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { WhatsAppIcon, TelegramIcon } from '@/components/brand-icons';

// brand icons imported from shared file

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [organization, setOrganization] = useState(mockOrganization);
  const [members, setMembers] = useState(mockUsers);
  const [tags, setTags] = useState(['hot-lead', 'enterprise', 'startup', 'demo-requested', 'negotiation', 'follow-up']);
  const [newTag, setNewTag] = useState('');
  const { user, refreshAuth } = useAuth();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const apiRoot = React.useMemo(() => API_BASE.replace(/\/api\/?$/, ''), []);
  const webhookUrl = `${apiRoot}/api/whatsapp/webhook`;

  useEffect(() => {
    // initialize profile fields from user if available
    if (user) {
      setName(user.name || '');
      setAvatar(user.profileImage || user.avatar || '');
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      await client.patch('/user/profile', { name, profileImage: avatar });
      toast.success('Profile updated');
      await refreshAuth();
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  // Check for WhatsApp connect status from query param
  useEffect(() => {
    const status = searchParams.get('whatsapp');
    if (status === 'connected') {
      setWaConnected(true);
      toast.success('WhatsApp connected');
      searchParams.delete('whatsapp');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'error') {
      toast.error('WhatsApp connection failed');
      searchParams.delete('whatsapp');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const startWhatsAppConnect = () => {
    window.location.href = `${apiRoot}/api/provider/whatsapp`;
  };

  const handleSaveOrganization = () => {
    // In a real app, this would make an API call
    console.log('Saving organization settings:', organization);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'OWNER':
        return 'bg-red-500/10 text-red-400';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-400';
      case 'AGENT':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Settings</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage your organization and preferences</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='w-full overflow-x-auto flex gap-2 sm:grid sm:grid-cols-8'>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='integrations'>Integrations</TabsTrigger>
          <TabsTrigger value='organization'>Organization</TabsTrigger>
          <TabsTrigger value='members'>Members</TabsTrigger>
          <TabsTrigger value='tags'>Tags</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          <TabsTrigger value='appearance'>Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <UserIcon className='h-5 w-5 mr-2' />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <div>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input 
                    id='name' 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder='John Doe' 
                  />
                </div>
                <div>
                  <Label htmlFor='avatar'>Avatar URL</Label>
                  <Input 
                    id='avatar' 
                    value={avatar} 
                    onChange={(e) => setAvatar(e.target.value)} 
                    placeholder='https://...' 
                  />
                </div>
              </div>
              <div className='flex justify-end'>
                <Button onClick={saveProfile}>
                  <Save className='h-4 w-4 mr-2' /> Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value='appearance'>
          <ThemeSettings />
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value='organization' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Building className='h-5 w-5 mr-2' />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='org-name'>Organization Name</Label>
                  <Input id='org-name' value={organization.name} onChange={(e) => setOrganization({ ...organization, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor='plan'>Current Plan</Label>
                  <Select value={organization.plan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='STARTER'>Starter</SelectItem>
                      <SelectItem value='PRO'>Pro</SelectItem>
                      <SelectItem value='ENTERPRISE'>Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Select value={organization.settings.timezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='UTC'>UTC</SelectItem>
                      <SelectItem value='America/New_York'>Eastern Time</SelectItem>
                      <SelectItem value='America/Chicago'>Central Time</SelectItem>
                      <SelectItem value='America/Denver'>Mountain Time</SelectItem>
                      <SelectItem value='America/Los_Angeles'>Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select value={organization.settings.currency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='USD'>USD ($)</SelectItem>
                      <SelectItem value='EUR'>EUR (€)</SelectItem>
                      <SelectItem value='GBP'>GBP (£)</SelectItem>
                      <SelectItem value='CAD'>CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveOrganization}>
                <Save className='h-4 w-4 mr-2' />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Management */}
        <TabsContent value='members' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='flex items-center'>
                <Users className='h-5 w-5 mr-2' />
                Team Members
              </CardTitle>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
              <Table className='min-w-[720px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{member.name}</div>
                            <div className='text-sm text-muted-foreground'>{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='bg-green-500/10 text-green-400'>
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <Button variant='ghost' size='icon'>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='ghost' size='icon' className='text-destructive'>
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name} from the organization? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Management */}
        <TabsContent value='tags' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Tag className='h-5 w-5 mr-2' />
                Lead Tags
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Input
                  placeholder='Add new tag...'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag}>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              <div className='flex flex-wrap gap-2'>
                {tags.map((tag) => (
                  <Badge key={tag} variant='secondary' className='flex items-center space-x-1'>
                    <span>{tag}</span>
                    <button onClick={() => handleRemoveTag(tag)} className='ml-1 hover:text-destructive'>
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value='templates' className='space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='flex items-center'>
                <MessageSquare className='h-5 w-5 mr-2' />
                Message Templates
              </CardTitle>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[
                  { name: 'Welcome Message', content: 'Hi there! Thanks for reaching out. How can I help you today?' },
                  { name: 'Follow Up', content: 'Hi {name}, I wanted to follow up on our previous conversation...' },
                  { name: 'Meeting Reminder', content: 'This is a reminder about our meeting scheduled for {date} at {time}.' },
                ].map((template, index) => (
                  <Card key={index} className='border-muted'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <h4 className='font-medium mb-2'>{template.name}</h4>
                          <p className='text-sm text-muted-foreground'>{template.content}</p>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Button variant='ghost' size='icon'>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='icon' className='text-destructive'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Bell className='h-5 w-5 mr-2' />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h4 className='font-medium mb-4'>Email Notifications</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>New Leads</Label>
                      <p className='text-sm text-muted-foreground'>Receive emails when new leads are created</p>
                    </div>
                    <Switch checked={organization.settings.notifications.email.newLeads} />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Task Reminders</Label>
                      <p className='text-sm text-muted-foreground'>Get reminded about upcoming tasks</p>
                    </div>
                    <Switch checked={organization.settings.notifications.email.taskReminders} />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>System Updates</Label>
                      <p className='text-sm text-muted-foreground'>Product updates and announcements</p>
                    </div>
                    <Switch checked={organization.settings.notifications.email.systemUpdates} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className='font-medium mb-4'>Push Notifications</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>New Messages</Label>
                      <p className='text-sm text-muted-foreground'>Instant notifications for new messages</p>
                    </div>
                    <Switch checked={organization.settings.notifications.push.newMessages} />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Task Deadlines</Label>
                      <p className='text-sm text-muted-foreground'>Alerts for approaching deadlines</p>
                    </div>
                    <Switch checked={organization.settings.notifications.push.taskDeadlines} />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Lead Updates</Label>
                      <p className='text-sm text-muted-foreground'>Notifications when leads change status</p>
                    </div>
                    <Switch checked={organization.settings.notifications.push.leadUpdates} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value='integrations' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Globe className='h-5 w-5 mr-2' />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* WhatsApp */}
                <Card className='border-muted'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div>
                          <WhatsAppIcon className='h-4 w-4' />
                        </div>
                        <div>
                          <h3 className='font-medium'>WhatsApp Business</h3>
                          <p className='text-sm text-muted-foreground'>Connect your WhatsApp account</p>
                        </div>
                      </div>
                      {waConnected ? (
                        <Badge variant='outline' className='bg-green-500/10 text-green-400'>Connected</Badge>
                      ) : (
                        <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>Not Connected</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div>
                        <Label>Webhook URL</Label>
                        <Input value={webhookUrl} readOnly />
                      </div>
                      <div className='flex space-x-2'>
                        <Button onClick={startWhatsAppConnect} className='flex-1'>
                          {waConnected ? 'Reconnect' : 'Connect WhatsApp'}
                        </Button>
                        <Button variant='outline' className='text-destructive' disabled={!waConnected}>
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Telegram */}
                <Card className='border-muted'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div>
                          <TelegramIcon className='h-4 w-4' />
                        </div>
                        <div>
                          <h3 className='font-medium'>Telegram</h3>
                          <p className='text-sm text-muted-foreground'>Connect your Telegram bot</p>
                        </div>
                      </div>
                      <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                        Not Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div>
                        <Label>Bot Token</Label>
                        <Input placeholder='Enter your bot token' />
                      </div>
                      <Button className='w-full' onClick={() => toast.info('Telegram integration coming soon')}>
                        Connect Telegram
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Instagram */}
                <Card className='border-muted'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 rounded-lg flex items-center justify-center bg-pink-500/10 border border-pink-500/30'>
                          <InstagramIcon className='h-5 w-5 text-pink-500' />
                        </div>
                        <div>
                          <h3 className='font-medium'>Instagram</h3>
                          <p className='text-sm text-muted-foreground'>Connect your Instagram account</p>
                        </div>
                      </div>
                      <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                        Not Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <Button className='w-full' onClick={() => toast.info('Instagram integration coming soon')}>
                        Connect Instagram
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Facebook */}
                <Card className='border-muted'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600/10 border border-blue-600/30'>
                          <FacebookIcon className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                          <h3 className='font-medium'>Facebook</h3>
                          <p className='text-sm text-muted-foreground'>Connect your Facebook account</p>
                        </div>
                      </div>
                      <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                        Not Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <Button className='w-full' onClick={() => toast.info('Facebook integration coming soon')}>
                        Connect Facebook
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
