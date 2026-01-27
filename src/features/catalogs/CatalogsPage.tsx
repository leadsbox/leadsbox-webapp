import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogsApi, Catalog } from '@/api/catalogs';
import { productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Share2, BookOpen, Copy, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const CatalogsPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    isPublic: false,
    selectedProducts: [] as string[],
  });

  // Fetch catalogs
  const { data: catalogsData, isLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => catalogsApi.list(),
  });

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  });

  // Create catalog
  const createMutation = useMutation({
    mutationFn: catalogsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Catalog created successfully');
      closeDialog();
    },
    onError: () => {
      toast.error('Failed to create catalog');
    },
  });

  // Update catalog
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Catalog> }) => catalogsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Catalog updated successfully');
      closeDialog();
    },
    onError: () => {
      toast.error('Failed to update catalog');
    },
  });

  // Delete catalog
  const deleteMutation = useMutation({
    mutationFn: catalogsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Catalog deleted');
    },
    onError: () => {
      toast.error('Failed to delete catalog');
    },
  });

  // Generate share link
  const shareLinkMutation = useMutation({
    mutationFn: catalogsApi.generateShareLink,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      setShareLink(data.data.shareUrl);
      setShowShareDialog(true);
      toast.success('Share link generated');
    },
    onError: () => {
      toast.error('Failed to generate share link');
    },
  });

  const openDialog = (catalog?: Catalog) => {
    if (catalog) {
      setEditingCatalog(catalog);
      setFormData({
        name: catalog.name,
        description: catalog.description || '',
        isActive: catalog.isActive,
        isPublic: catalog.isPublic,
        selectedProducts: catalog.items.map((item) => item.productId),
      });
    } else {
      setEditingCatalog(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
        isPublic: false,
        selectedProducts: [],
      });
    }
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingCatalog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCatalog) {
      updateMutation.mutate({
        id: editingCatalog.id,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          isActive: formData.isActive,
          isPublic: formData.isPublic,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        productIds: formData.selectedProducts,
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard');
  };

  const catalogs = catalogsData?.data?.catalogs || [];
  const products = productsData?.data?.products || [];

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Catalogs</h1>
          <p className='text-muted-foreground'>Organize products into shareable collections</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className='h-4 w-4 mr-2' />
          Create Catalog
        </Button>
      </div>

      {/* Catalogs Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : catalogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8'>
                  <BookOpen className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
                  <p className='text-muted-foreground'>No catalogs found</p>
                  <Button variant='link' onClick={() => openDialog()}>
                    Create your first catalog
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              catalogs.map((catalog) => (
                <TableRow key={catalog.id}>
                  <TableCell className='font-medium'>{catalog.name}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{catalog.items.length} products</Badge>
                  </TableCell>
                  <TableCell>{catalog.isActive ? <Badge variant='default'>Active</Badge> : <Badge variant='outline'>Inactive</Badge>}</TableCell>
                  <TableCell>{catalog.isPublic ? <Badge variant='default'>Public</Badge> : <Badge variant='secondary'>Private</Badge>}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant='ghost' size='icon' onClick={() => shareLinkMutation.mutate(catalog.id)} title='Generate share link'>
                      <Share2 className='h-4 w-4' />
                    </Button>
                    <Button variant='ghost' size='icon' onClick={() => openDialog(catalog)}>
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this catalog?')) {
                          deleteMutation.mutate(catalog.id);
                        }
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Catalog Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingCatalog ? 'Edit Catalog' : 'Create Catalog'}</DialogTitle>
            <DialogDescription>{editingCatalog ? 'Update catalog information' : 'Create a new product collection'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Name *</Label>
                <Input id='name' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Description</Label>
                <Input id='description' value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <Switch id='isActive' checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch id='isPublic' checked={formData.isPublic} onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })} />
                  <Label htmlFor='isPublic'>Public</Label>
                </div>
              </div>

              {!editingCatalog && (
                <div className='grid gap-2'>
                  <Label>Select Products</Label>
                  <div className='border rounded-lg p-4 max-h-60 overflow-y-auto'>
                    {products.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>No products available. Create products first.</p>
                    ) : (
                      products.map((product) => (
                        <div key={product.id} className='flex items-center space-x-2 py-2'>
                          <Checkbox
                            id={product.id}
                            checked={formData.selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  selectedProducts: [...formData.selectedProducts, product.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedProducts: formData.selectedProducts.filter((id) => id !== product.id),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={product.id} className='text-sm font-normal cursor-pointer'>
                            {product.name} - {product.unitPrice} {product.currency}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={closeDialog}>
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCatalog ? 'Update' : 'Create'} Catalog
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Link Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Public Share Link</DialogTitle>
            <DialogDescription>Anyone with this link can view the catalog without logging in</DialogDescription>
          </DialogHeader>
          <div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
            <Input value={shareLink} readOnly className='flex-1' />
            <Button size='icon' variant='ghost' onClick={copyShareLink}>
              <Copy className='h-4 w-4' />
            </Button>
            <Button size='icon' variant='ghost' onClick={() => window.open(shareLink, '_blank')}>
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogsPage;
