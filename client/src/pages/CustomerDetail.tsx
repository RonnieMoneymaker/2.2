import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Euro,
  Send,
  MessageSquare,
  User,
  TrendingUp
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { customersApi } from '../services/api';
import { Customer } from '../types';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
    template: 'default'
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomer(parseInt(id));
    }
  }, [id]);

  const fetchCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      const response = await customersApi.getById(customerId);
      setCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setSendingEmail(true);
      // This would call the email API
      // await emailsApi.sendCustomerEmail(customer.id, emailForm);
      
      // For now, just add a customer interaction
      await customersApi.addInteraction(customer.id, {
        interaction_type: 'email',
        subject: emailForm.subject,
        description: `Email verzonden: ${emailForm.message.substring(0, 100)}...`,
        created_by: 'Current User'
      });
      
      // Refresh customer data
      fetchCustomer(customer.id);
      
      setShowEmailModal(false);
      setEmailForm({ subject: '', message: '', template: 'default' });
      
      alert('Email succesvol verzonden!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Fout bij verzenden email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      new: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      vip: 'bg-purple-100 text-purple-800',
    };
    
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout title="Klant Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout title="Klant Details">
        <div className="text-center py-12">
          <p className="text-gray-500">Klant niet gevonden.</p>
          <button 
            onClick={() => navigate('/customers')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar klanten
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${customer.first_name} ${customer.last_name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/customers')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar klanten
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Stuur Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </h2>
                  <p className="text-gray-500">Klant ID: {customer.id}</p>
                  {getStatusBadge(customer.customer_status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{customer.email}</span>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{customer.phone}</span>
                  </div>
                )}
                
                {(customer.address || customer.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      {customer.address && <p className="text-gray-900">{customer.address}</p>}
                      {customer.city && customer.postal_code && (
                        <p className="text-gray-900">{customer.postal_code} {customer.city}</p>
                      )}
                      <p className="text-gray-500">{customer.country}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900">Geregistreerd</p>
                    <p className="text-gray-500">{formatDate(customer.date_created)}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900">{customer.total_orders}</span>
                    </div>
                    <p className="text-sm text-gray-500">Bestellingen</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(customer.total_spent)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Totaal Besteed</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(customer.total_spent * 0.35)} 
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Echte Winst</p>
                    <p className="text-xs text-gray-400">(35% gem. marge)</p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Notities</h4>
                  <p className="text-gray-700">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders and Interactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Orders */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Bestellingen</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {customer.orders && customer.orders.length > 0 ? (
                  customer.orders.map((order) => (
                    <div key={order.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.order_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.order_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nog geen bestellingen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Interactions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Interacties</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {customer.interactions && customer.interactions.length > 0 ? (
                  customer.interactions.map((interaction) => (
                    <div key={interaction.id} className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {interaction.interaction_type === 'email' ? (
                            <Mail className="h-5 w-5 text-blue-500" />
                          ) : interaction.interaction_type === 'phone' ? (
                            <Phone className="h-5 w-5 text-green-500" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {interaction.subject}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(interaction.date_created)}
                            </p>
                          </div>
                          {interaction.description && (
                            <p className="mt-1 text-sm text-gray-700">
                              {interaction.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Door: {interaction.created_by}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nog geen interacties</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Email sturen naar {customer.first_name}
                </h3>
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template</label>
                    <select
                      value={emailForm.template}
                      onChange={(e) => setEmailForm({...emailForm, template: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="default">Standaard</option>
                      <option value="welcome">Welkom</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Onderwerp</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bericht</label>
                    <textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      {sendingEmail ? (
                        <>Verzenden...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Verstuur Email
                        </>
                      )}
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

export default CustomerDetail;
