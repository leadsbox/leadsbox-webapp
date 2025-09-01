import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Tag as TagIcon, X } from 'lucide-react';

export const TagsTab: React.FC = () => {
  const [tags, setTags] = useState<string[]>(['hot-lead', 'enterprise', 'startup', 'demo-requested', 'negotiation', 'follow-up']);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <TagIcon className='h-5 w-5 mr-2' />
          Lead Tags
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <Input placeholder='Add new tag...' value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag()} />
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
  );
};

export default TagsTab;

