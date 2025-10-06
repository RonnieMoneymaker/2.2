import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { productsApi, categoriesApi } from '../services/api';
import { Product, Category } from '../types/api';
import axios from 'axios';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    description: '',
    priceCents: 0,
    stockQuantity: 0,
    categoryId: '',
    images: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
  });
  
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ search: searchTerm }),
        categoriesApi.getAll(),
      ]);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    
    try {
      const response = await axios.post('http://localhost:2000/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = `http://localhost:2000${response.data.url}`;
      setImagePreview(imageUrl);
      setFormData(prev => ({ ...prev, images: imageUrl }));
      alert('✅ Afbeelding geüpload!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Fout bij uploaden afbeelding');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        priceCents: Number(formData.priceCents),
        stockQuantity: Number(formData.stockQuantity),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
      } else {
        await productsApi.create(data);
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        sku: '',
        description: '',
        priceCents: 0,
        stockQuantity: 0,
        categoryId: '',
        images: '',
        metaTitle: '',
        metaDescription: '',
        tags: '',
      });
      setImagePreview('');
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      description: product.description || '',
      priceCents: product.priceCents,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId?.toString() || '',
      images: product.images || '',
      metaTitle: '',
      metaDescription: '',
      tags: '',
    });
    setImagePreview(product.images || '');
    setShowForm(true);
  };

  const duplicateProduct = async (product: Product) => {
    try {
      await productsApi.create({
        name: `${product.name} (kopie)`,
        slug: `${product.slug}-kopie-${Date.now()}`,
        sku: product.sku ? `${product.sku}-COPY` : undefined,
        description: product.description,
        priceCents: product.priceCents,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId,
        images: product.images,
      });
      fetchData();
      alert('✅ Product gedupliceerd!');
    } catch (error) {
      console.error('Error duplicating:', error);
      alert('❌ Fout bij dupliceren');
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`${selectedProducts.length} producten verwijderen?`)) return;
    
    try {
      await Promise.all(selectedProducts.map(id => productsApi.delete(id)));
      setSelectedProducts([]);
      fetchData();
      alert('✅ Producten verwijderd!');
    } catch (error) {
      alert('❌ Fout bij verwijderen');
    }
  };

  const bulkPriceUpdate = async () => {
    if (selectedProducts.length === 0) return;
    const percent = prompt('Percentage wijziging (bijv. 10 voor +10%, -10 voor -10%):');
    if (!percent) return;
    
    const change = parseFloat(percent) / 100;
    
    try {
      for (const id of selectedProducts) {
        const product = products.find(p => p.id === id);
        if (product) {
          const newPrice = Math.round(product.priceCents * (1 + change));
          await productsApi.update(id, { priceCents: newPrice });
        }
      }
      setSelectedProducts([]);
      fetchData();
      alert(`✅ ${selectedProducts.length} prijzen bijgewerkt!`);
    } catch (error) {
      alert('❌ Fout bij prijsupdate');
    }
  };

  const filteredProducts = products.filter(p => {
    const priceInEuros = p.priceCents / 100;
    if (priceFilter.min && priceInEuros < parseFloat(priceFilter.min)) return false;
    if (priceFilter.max && priceInEuros > parseFloat(priceFilter.max)) return false;
    
    if (stockFilter === 'low' && p.stockQuantity > 10) return false;
    if (stockFilter === 'out' && p.stockQuantity > 0) return false;
    if (stockFilter === 'instock' && p.stockQuantity === 0) return false;
    
    return true;
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        await productsApi.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Producten</h1>
          <p className="mt-2 text-sm text-gray-700">
            Beheer je productcatalogus
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nieuw product
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek producten..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
          <input
            type="number"
            placeholder="Min prijs (€)"
            className="input-field"
            value={priceFilter.min}
            onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
          />
          <input
            type="number"
            placeholder="Max prijs (€)"
            className="input-field"
            value={priceFilter.max}
            onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
          />
          <select
            className="input-field"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">Alle voorraad</option>
            <option value="instock">Op voorraad</option>
            <option value="low">Lage voorraad (&lt;10)</option>
            <option value="out">Uitverkocht</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="card bg-primary-50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{selectedProducts.length} geselecteerd</span>
            <div className="flex gap-2">
              <button onClick={bulkPriceUpdate} className="btn-secondary">
                Bulk Prijs Update
              </button>
              <button onClick={bulkDelete} className="btn-secondary text-red-600">
                Verwijder Alle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={() => {
                      if (selectedProducts.length === filteredProducts.length) {
                        setSelectedProducts([]);
                      } else {
                        setSelectedProducts(filteredProducts.map(p => p.id));
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prijs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voorraad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categorie
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => {
                          setSelectedProducts(prev =>
                            prev.includes(product.id)
                              ? prev.filter(id => id !== product.id)
                              : [...prev, product.id]
                          );
                        }}
                        className="rounded border-gray-300 text-primary-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {product.images ? (
                          <img src={product.images} alt={product.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{(product.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{product.stockQuantity}</span>
                        {product.stockQuantity === 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Uit</span>
                        )}
                        {product.stockQuantity > 0 && product.stockQuantity <= 10 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Laag</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        title="Bewerken"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => duplicateProduct(product)}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Dupliceren"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProduct ? 'Product bewerken' : 'Nieuw product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Naam</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product beschrijving..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prijs (centen)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Voorraad</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categorie</label>
                <select
                  className="input-field"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Geen categorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Afbeelding</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, images: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-primary-600 hover:text-primary-800 font-medium">
                          {uploading ? 'Uploaden...' : 'Klik om afbeelding te uploaden'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF tot 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">SEO Optimalisatie</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meta Title</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder={formData.name || "Product naam voor SEO"}
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60 karakters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Korte beschrijving voor zoekmachines"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160 karakters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="smartphone, electronics, 5g (komma gescheiden)"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                    setImagePreview('');
                  }}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Bijwerken' : 'Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;



