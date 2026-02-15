import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Package, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImportDialog } from './ProductImportDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ProductsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('_ALL_');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmLabel: string;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
    confirmLabel: 'Confirm',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    unitPrice: '',
    currency: 'NGN',
    imageUrl: '',
    inStock: true,
    stockQuantity: '',
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, category: categoryFilter }],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        category: categoryFilter === '_ALL_' ? undefined : categoryFilter,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => productsApi.categories(),
  });

  // Fetch pending products
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['products', 'pending'],
    queryFn: () => productsApi.getPending(),
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      closeDialog();
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      closeDialog();
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  // Approve product
  const approveMutation = useMutation({
    mutationFn: productsApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product approved and added to catalog');
    },
    onError: () => {
      toast.error('Failed to approve product');
    },
  });

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        category: product.category || '',
        unitPrice: product.unitPrice.toString(),
        currency: product.currency,
        imageUrl: product.imageUrl || '',
        inStock: product.inStock,
        stockQuantity: product.stockQuantity?.toString() || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        category: '',
        unitPrice: '',
        currency: 'NGN',
        imageUrl: '',
        inStock: true,
        stockQuantity: '',
      });
    }
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description || undefined,
      sku: formData.sku || undefined,
      category: formData.category || undefined,
      unitPrice: parseFloat(formData.unitPrice),
      currency: formData.currency,
      imageUrl: formData.imageUrl || undefined,
      inStock: formData.inStock,
      stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const products = productsData?.data?.products || [];
  const categories = categoriesData?.data?.categories || [];
  const pendingProducts = pendingData?.data?.products || [];

  const handleApprove = (productId: string) => {
    setAlertConfig({
      open: true,
      title: 'Approve Product',
      description: 'Are you sure you want to approve this product and add it to your catalog?',
      action: () => approveMutation.mutate(productId),
      confirmLabel: 'Approve',
      variant: 'default',
    });
  };

  const confirmDelete = (productId: string) => {
    setAlertConfig({
      open: true,
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product? This action cannot be undone.',
      action: () => deleteMutation.mutate(productId),
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
  };

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Products</h1>
          <p className='text-muted-foreground'>Manage your product catalog</p>
        </div>
        <div className='flex gap-2'>
          <ProductImportDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })} />
          <Button onClick={() => openDialog()}>
            <Plus className='h-4 w-4 mr-2' />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Products</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{products.length}</div>
            <p className='text-xs text-muted-foreground'>In your catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Review</CardTitle>
            <Sparkles className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pendingProducts.length}</div>
            <p className='text-xs text-muted-foreground'>AI-detected products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>In Stock</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{products.filter((p) => p.inStock).length}</div>
            <p className='text-xs text-muted-foreground'>Available products</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Products Section */}
      {pendingProducts.length > 0 && (
        <Card className='border-yellow-200 bg-yellow-50/50'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-yellow-600' />
              <div>
                <CardTitle>Pending Review - AI-Detected Products</CardTitle>
                <CardDescription>
                  Products automatically detected from sales conversations. Review and approve to add them to your catalog.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='border rounded-lg bg-white'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>AI Confidence</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className='h-4 w-[150px]' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-[80px]' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-[100px]' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-[60px]' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-8 w-[100px] ml-auto' />
                          </TableCell>
                        </TableRow>
                      ))
                    : pendingProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className='font-medium'>
                            <div className='flex items-center gap-2'>
                              {product.name}
                              {product.isAutoDetected && (
                                <Badge variant='outline' className='text-xs bg-yellow-100 text-yellow-700 border-yellow-300'>
                                  AI-Detected
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.unitPrice.toLocaleString()} {product.currency}
                          </TableCell>
                          <TableCell>{product.category || '—'}</TableCell>
                          <TableCell>
                            {product.detectionMetadata?.aiConfidence ? (
                              <Badge
                                variant='outline'
                                className={
                                  product.detectionMetadata.aiConfidence > 0.8
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : product.detectionMetadata.aiConfidence > 0.6
                                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                      : 'bg-red-100 text-red-700 border-red-300'
                                }
                              >
                                {Math.round(product.detectionMetadata.aiConfidence * 100)}%
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className='text-right space-x-2'>
                            <Button variant='outline' size='sm' onClick={() => openDialog(product)}>
                              <Edit className='h-3 w-3 mr-1' />
                              Edit
                            </Button>
                            <Button
                              variant='default'
                              size='sm'
                              onClick={() => handleApprove(product.id)}
                              disabled={approveMutation.isPending}
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <CheckCircle2 className='h-3 w-3 mr-1' />
                              Approve
                            </Button>
                            <Button variant='ghost' size='sm' onClick={() => confirmDelete(product.id)}>
                              <Trash2 className='h-3 w-3' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className='flex gap-4'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search products...' value={search} onChange={(e) => setSearch(e.target.value)} className='pl-10' />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='All Categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='_ALL_'>All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-4 w-[150px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-[80px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-[100px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-[90px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-[80px]' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-[80px]' />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Skeleton className='h-8 w-8' />
                      <Skeleton className='h-8 w-8' />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8'>
                  <Package className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
                  <p className='text-muted-foreground'>No products found</p>
                  <Button variant='link' onClick={() => openDialog()}>
                    Create your first product
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className='font-medium'>{product.name}</TableCell>
                  <TableCell>{product.sku || '—'}</TableCell>
                  <TableCell>{product.category || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={
                        product.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : product.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.unitPrice.toLocaleString()} {product.currency}
                  </TableCell>
                  <TableCell>
                    {product.inStock ? <span className='text-green-600'>In Stock</span> : <span className='text-red-600'>Out of Stock</span>}
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant='ghost' size='icon' onClick={() => openDialog(product)}>
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button variant='ghost' size='icon' onClick={() => confirmDelete(product.id)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
            <DialogDescription>{editingProduct ? 'Update product information' : 'Add a new product to your catalog'}</DialogDescription>
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
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='sku'>SKU</Label>
                  <Input id='sku' value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='category'>Category</Label>
                  <Input id='category' value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='unitPrice'>Price *</Label>
                  <Input
                    id='unitPrice'
                    type='number'
                    step='0.01'
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    required
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='NGN'>NGN</SelectItem>
                      <SelectItem value='USD'>USD</SelectItem>
                      <SelectItem value='EUR'>EUR</SelectItem>
                      <SelectItem value='GBP'>GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='imageUrl'>Image URL</Label>
                <Input id='imageUrl' type='url' value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Switch id='inStock' checked={formData.inStock} onCheckedChange={(checked) => setFormData({ ...formData, inStock: checked })} />
                  <Label htmlFor='inStock'>In Stock</Label>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='stockQuantity'>Stock Quantity</Label>
                  <Input
                    id='stockQuantity'
                    type='number'
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={closeDialog}>
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={alertConfig.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                alertConfig.action();
              }}
            >
              {alertConfig.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;
