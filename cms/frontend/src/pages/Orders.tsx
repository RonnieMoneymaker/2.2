import React, { useEffect, useState } from 'react';
import { Plus, Package, User, Calendar, Euro, Eye, Trash2, Filter } from 'lucide-react';
import { ordersApi, customersApi, productsApi } from '../services/api';
import { Order, Customer, Product } from '../types/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  pending: 'In afwachting',
  processing: 'In behandeling',
  shipped: 'Verzonden',
  delivered: 'Geleverd',
  cancelled: 'Geannuleerd',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', quantity: 1 }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      setFilteredOrders(orders.filter(o => o.status === statusFilter));
    } else {
      setFilteredOrders(orders);
    }
  }, [statusFilter, orders]);

  const fetchData = async () => {
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        ordersApi.getAll({}),
        customersApi.getAll({}),
        productsApi.getAll({}),
      ]);
      setOrders(ordersRes.data.orders);
      setFilteredOrders(ordersRes.data.orders);
      setCustomers(customersRes.data.customers);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        customerId: Number(formData.customerId),
        items: formData.items.map(item => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })).filter(item => item.productId && item.quantity > 0),
      };

      if (data.items.length === 0) {
        alert('Voeg minimaal 1 product toe aan de bestelling');
        return;
      }

      await ordersApi.create(data);
      setShowForm(false);
      setFormData({
        customerId: '',
        items: [{ productId: '', quantity: 1 }],
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Fout bij aanmaken bestelling');
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij updaten status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) {
      alert('Selecteer minimaal 1 bestelling');
      return;
    }

    if (!window.confirm(`Weet je zeker dat je ${selectedOrders.length} bestelling(en) wilt verwijderen?`)) {
      return;
    }

    try {
      await Promise.all(selectedOrders.map(id => ordersApi.delete(id)));
      setSelectedOrders([]);
      fetchData();
      alert('✅ Bestellingen succesvol verwijderd');
    } catch (error) {
      console.error('Error deleting orders:', error);
      alert('❌ Fout bij verwijderen bestellingen');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      alert('Selecteer minimaal 1 bestelling');
      return;
    }

    try {
      await Promise.all(selectedOrders.map(id => ordersApi.updateStatus(id, newStatus)));
      setSelectedOrders([]);
      fetchData();
      alert(`✅ ${selectedOrders.length} bestelling(en) geüpdatet naar: ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`);
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('❌ Fout bij updaten bestellingen');
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const viewOrderDetails = async (orderId: number) => {
    try {
      const order = await ordersApi.getById(orderId);
      setSelectedOrder(order.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Fout bij laden bestelling details');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
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
          <h1 className="text-2xl font-bold text-gray-900">Bestellingen</h1>
          <p className="mt-2 text-sm text-gray-700">
            Beheer alle bestellingen ({filteredOrders.length})
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nieuwe bestelling
        </button>
      </div>

      {/* Filter and Bulk Actions Bar */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Alle statussen</option>
              <option value="pending">In afwachting</option>
              <option value="processing">In behandeling</option>
              <option value="shipped">Verzonden</option>
              <option value="delivered">Geleverd</option>
              <option value="cancelled">Geannuleerd</option>
            </select>
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">{selectedOrders.length} geselecteerd</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="input-field text-sm"
              >
                <option value="">Bulk status wijzigen...</option>
                <option value="pending">→ In afwachting</option>
                <option value="processing">→ In behandeling</option>
                <option value="shipped">→ Verzonden</option>
                <option value="delivered">→ Geleverd</option>
                <option value="cancelled">→ Geannuleerd</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Verwijder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              checked={selectedOrders.length === filteredOrders.length}
              onChange={toggleAllOrders}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">Selecteer alles</span>
          </div>
        )}

        {filteredOrders.map((order) => (
          <div key={order.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.id)}
                onChange={() => toggleOrderSelection(order.id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customer?.firstName} {order.customer?.lastName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString('nl-NL')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          €{(order.totalCents / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewOrderDetails(order.id)}
                      className="text-primary-600 hover:text-primary-900 p-2"
                      title="Details bekijken"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="pending">In afwachting</option>
                      <option value="processing">In behandeling</option>
                      <option value="shipped">Verzonden</option>
                      <option value="delivered">Geleverd</option>
                      <option value="cancelled">Geannuleerd</option>
                    </select>
                  </div>
                </div>
                
                {order.items && order.items.length > 0 && (
                  <div className="mt-3 pl-9 text-xs text-gray-500">
                    {order.items.length} product(en): {' '}
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx}>
                        {item.product?.name} ({item.quantity}x)
                        {idx < Math.min(2, order.items!.length - 1) && ', '}
                      </span>
                    ))}
                    {order.items.length > 3 && ` +${order.items.length - 3} meer`}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-gray-500 mt-4">
            <p className="text-lg">Geen bestellingen gevonden</p>
            <p className="text-sm mt-2">
              {statusFilter ? 'Probeer een ander filter' : 'Maak je eerste bestelling aan om te beginnen'}
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-[700px] shadow-2xl rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Bestelling Details</h3>
                <p className="text-gray-600 mt-1">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Klantgegevens</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Naam:</span> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customer?.email}</p>
                  {selectedOrder.customer?.phone && <p><span className="font-medium">Telefoon:</span> {selectedOrder.customer.phone}</p>}
                  {selectedOrder.customer?.address && (
                    <p><span className="font-medium">Adres:</span> {selectedOrder.customer.address}, {selectedOrder.customer.postalCode} {selectedOrder.customer.city}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Bestelde Producten</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Prijs</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Aantal</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Totaal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.product?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">€{(item.unitCents / 100).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}x</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">€{(item.totalCents / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Totaal:</td>
                        <td className="px-4 py-3 text-lg font-bold text-gray-900 text-right">
                          €{(selectedOrder.totalCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Dates */}
              <div className="flex justify-between text-sm text-gray-600 pt-4 border-t">
                <div>
                  <span className="font-medium">Aangemaakt:</span>{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString('nl-NL')}
                </div>
                <div>
                  <span className="font-medium">Laatst bijgewerkt:</span>{' '}
                  {new Date(selectedOrder.updatedAt).toLocaleString('nl-NL')}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-primary"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Nieuwe bestelling
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Klant *</label>
                <select
                  required
                  className="input-field"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                >
                  <option value="">Selecteer een klant</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Producten *</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      required
                      className="input-field flex-1"
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    >
                      <option value="">Selecteer product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - €{(product.priceCents / 100).toFixed(2)} (voorraad: {product.stockQuantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      className="input-field w-24"
                      placeholder="Aantal"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn-secondary px-3"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-secondary text-sm mt-2"
                >
                  + Product toevoegen
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      customerId: '',
                      items: [{ productId: '', quantity: 1 }],
                    });
                  }}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button type="submit" className="btn-primary">
                  Bestelling aanmaken
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;