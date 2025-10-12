import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { productsApi } from '../services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  weight_grams?: number;
  supplier?: string;
  shipping_cost?: number;
  primary_image_url?: string;
  gross_margin: number;
  margin_percentage: number;
  quantity_sold?: number;
  revenue?: number;
  real_profit?: number;
  orders_count?: number;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'Kleding',
    purchase_price: '',
    selling_price: '',
    stock_quantity: '',
    weight_grams: '',
    shipping_cost: '5.95',
    supplier: '',
    primary_image_url: ''
  });

  // No mock products - empty array

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ search: searchTerm });
      
      // Transform API data to include shipping costs and real profit
      const productsWithProfit = response.data.products.map((product: any) => ({
        ...product,
        shipping_cost: product.shipping_cost || 5.95,
        gross_margin: product.selling_price - product.purchase_price - (product.shipping_cost || 5.95),
        margin_percentage: ((product.selling_price - product.purchase_price - (product.shipping_cost || 5.95)) / product.selling_price) * 100,
        real_profit: (product.quantity_sold || 0) * (product.selling_price - product.purchase_price - (product.shipping_cost || 5.95))
      }));
      
      setProducts(productsWithProfit);
    } catch (error) {
      console.error('Error fetching products:', error);
      // No mock data - set empty array
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        weight_grams: parseInt(formData.weight_grams) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, productData);
        alert('Product bijgewerkt!');
        
        // Update local state
        setProducts(products.map(p => 
          p.id === editingProduct.id 
            ? { ...p, ...productData, 
                gross_margin: productData.selling_price - productData.purchase_price,
                margin_percentage: ((productData.selling_price - productData.purchase_price) / productData.selling_price) * 100
              }
            : p
        ));
      } else {
        const response = await productsApi.create(productData);
        alert('Product toegevoegd!');
        
        // Add to local state
        const newProduct = {
          ...productData,
          id: Date.now(), // Temporary ID
          gross_margin: productData.selling_price - productData.purchase_price,
          margin_percentage: ((productData.selling_price - productData.purchase_price) / productData.selling_price) * 100,
          quantity_sold: 0,
          revenue: 0,
          real_profit: 0,
          orders_count: 0
        };
        setProducts([...products, newProduct]);
      }
      
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Er is een fout opgetreden bij het opslaan.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        await productsApi.delete(id);
        alert('Product verwijderd!');
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Er is een fout opgetreden bij het verwijderen.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: 'Kleding',
      purchase_price: '',
      selling_price: '',
      stock_quantity: '',
      weight_grams: '',
      shipping_cost: '',
      supplier: '',
      primary_image_url: ''
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      weight_grams: (product.weight_grams || 500).toString(),
      shipping_cost: (product.shipping_cost || 5.95).toString(),
      supplier: product.supplier || '',
      primary_image_url: product.primary_image_url || ''
    });
    setShowAddModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout title="Producten">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Producten">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Productenbeheer</h1>
            <p className="mt-1 text-sm text-gray-500">
              Beheer je producten, inkoopprijzen en winstmarges
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Zoek op naam of SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Alle categorieën</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inkoopprijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verkoopprijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verzendkosten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Echte Winst/stuk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Winst %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voorraad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verkocht
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totale Winst
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10">
                          {product.primary_image_url ? (
                            <img 
                              src={product.primary_image_url} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.purchase_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.selling_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(product.shipping_cost || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-green-600">
                          +{formatCurrency(product.gross_margin)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Excl. BTW (€{(product.selling_price * 0.21).toFixed(2)})
                        </div>
                        <div className="text-xs text-gray-400">
                          {product.selling_price.toFixed(2)} - {product.purchase_price.toFixed(2)} - {(product.shipping_cost || 0).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${product.margin_percentage > 50 ? 'text-green-600' : product.margin_percentage > 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {product.margin_percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${product.stock_quantity < 25 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock_quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity_sold || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        +{formatCurrency(product.real_profit || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.quantity_sold || 0} × €{product.gross_margin.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Bewerken"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900" 
                          title="Verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingProduct ? 'Product Bewerken' : 'Nieuw Product'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Productnaam</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categorie</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="Kleding">Kleding</option>
                      <option value="Schoenen">Schoenen</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Elektronica">Elektronica</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Inkoopprijs (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Verkoopprijs (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Voorraad</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gewicht (gram)</label>
                    <input
                      type="number"
                      value={formData.weight_grams}
                      onChange={(e) => setFormData({...formData, weight_grams: e.target.value})}
                      placeholder="500"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verzendkosten (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Foto URL</label>
                    <input
                      type="url"
                      value={formData.primary_image_url}
                      onChange={(e) => setFormData({...formData, primary_image_url: e.target.value})}
                      placeholder="https://example.com/product-image.jpg"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leverancier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {formData.purchase_price && formData.selling_price && formData.shipping_cost && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-bold text-green-800 mb-2">💰 Winst Berekening:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Verkoopprijs (excl. BTW):</span>
                          <span className="font-medium text-green-600">+{formatCurrency(parseFloat(formData.selling_price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inkoopprijs:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(parseFloat(formData.purchase_price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verzendkosten:</span>
                          <span className="font-medium text-orange-600">-{formatCurrency(parseFloat(formData.shipping_cost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>BTW (21%):</span>
                          <span className="font-medium text-blue-600">-{formatCurrency(parseFloat(formData.selling_price) * 0.21)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>ECHTE WINST per stuk:</span>
                          <span className="text-green-600">
                            +{formatCurrency(parseFloat(formData.selling_price) - parseFloat(formData.purchase_price) - parseFloat(formData.shipping_cost) - (parseFloat(formData.selling_price) * 0.21))}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Winstmarge:</span>
                          <span>
                            {(((parseFloat(formData.selling_price) - parseFloat(formData.purchase_price) - parseFloat(formData.shipping_cost) - (parseFloat(formData.selling_price) * 0.21)) / parseFloat(formData.selling_price)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProduct(null);
                        setFormData({
                          name: '',
                          sku: '',
                          description: '',
                          category: 'Kleding',
                          purchase_price: '',
                          selling_price: '',
                          stock_quantity: '',
                          weight_grams: '',
                          shipping_cost: '',
                          supplier: '',
                          primary_image_url: ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      {editingProduct ? 'Bijwerken' : 'Toevoegen'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
