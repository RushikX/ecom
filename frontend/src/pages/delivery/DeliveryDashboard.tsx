import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchAssignedOrders, markAsDelivered } from '../../store/slices/orderSlice';
import { logout } from '../../store/slices/authSlice';
import { Truck, CheckCircle, Package, Clock, MapPin, RefreshCw, Filter, Eye, EyeOff, AlertCircle, Calendar, LogOut, TrendingUp, DollarSign, Navigation } from 'lucide-react';

const DeliveryDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    dispatch(fetchAssignedOrders());
  }, [dispatch]);

  const handleMarkDelivered = async (orderId: string) => {
    if (window.confirm('Are you sure you want to mark this order as delivered?')) {
      try {
        await dispatch(markAsDelivered(orderId)).unwrap();
        setShowSuccessMessage(`Order #${orderId.slice(-6)} marked as delivered successfully!`);
        setTimeout(() => setShowSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Failed to mark order as delivered:', error);
        alert('Failed to mark order as delivered. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchAssignedOrders());
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await dispatch(logout());
      navigate('/login');
    }
  };


  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const searchMatch = searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalValue: orders.reduce((sum, order) => sum + order.total, 0)
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary-500/10 rounded-xl">
            <Truck className="h-8 w-8 text-primary-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Delivery Dashboard</h1>
            <p className="text-dark-400 mt-1">Welcome back, {user?.email}</p>
            <p className="text-dark-500 text-sm">Manage your assigned delivery orders</p>
          </div>
        </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="btn-outline flex items-center text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              <p className="text-xs text-dark-500 mt-1">All assigned orders</p>
            </div>
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Package className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              <p className="text-xs text-dark-500 mt-1">Ready for pickup</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm font-medium">Shipped</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{stats.shipped}</p>
              <p className="text-xs text-dark-500 mt-1">Out for delivery</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Truck className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.delivered}</p>
              <p className="text-xs text-dark-500 mt-1">Successfully completed</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm font-medium">Total Value</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">${stats.totalValue.toFixed(2)}</p>
              <p className="text-xs text-dark-500 mt-1">Orders value</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card bg-gradient-to-r from-dark-800 to-dark-700 border border-dark-600">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Filter className="h-4 w-4 text-primary-400" />
            </div>
            <div>
              <label className="text-xs text-dark-400 font-medium">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-40 mt-1"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <label className="text-xs text-dark-400 font-medium">Sort by</label>
              <div className="flex items-center space-x-2 mt-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input w-32"
                >
                  <option value="createdAt">Date</option>
                  <option value="total">Total</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn-outline px-3 py-2 hover:bg-primary-500/10"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 flex-1 min-w-80">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Navigation className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-dark-400 font-medium">Search Orders</label>
              <input
                type="text"
                placeholder="Search by order ID, address, or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input flex-1 mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-6 bg-dark-700/50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Truck className="h-12 w-12 text-dark-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            {statusFilter === 'all' ? 'No assigned orders' : `No ${statusFilter} orders`}
          </h3>
          <p className="text-dark-400 max-w-md mx-auto">
            {statusFilter === 'all' 
              ? "You don't have any orders assigned to you yet. Check back later or contact your supervisor."
              : `You don't have any ${statusFilter} orders at the moment.`
            }
          </p>
          <button
            onClick={handleRefresh}
            className="btn-primary mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Orders
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order: any) => (
            <div key={order.id} className="card border border-dark-700 hover:shadow-xl transition-all duration-300 hover:border-primary-500/30">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-dark-700/50 rounded-xl">
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Order #{order.id.slice(-6)}
                    </h3>
                    <div className="flex items-center space-x-6 text-sm text-dark-400 mt-1">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-500">
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="btn-outline p-3 hover:bg-primary-500/10 hover:border-primary-500/40"
                    title={expandedOrders.has(order.id) ? 'Hide details' : 'Show details'}
                  >
                    {expandedOrders.has(order.id) ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start space-x-3 mb-6 p-4 bg-dark-700/30 rounded-lg border border-dark-600">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark-300 mb-1">Delivery Address</p>
                  <p className="text-white text-lg leading-relaxed">{order.address}</p>
                </div>
              </div>

              {/* Expandable Order Details */}
              {expandedOrders.has(order.id) && (
                <div className="border-t border-dark-700 pt-4 space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-3">Order Items ({order.items.length})</h4>
                    <div className="space-y-2">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-dark-700/50 rounded-lg">
                          <div className="w-10 h-10 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product?.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                                <Package className="h-4 w-4 text-dark-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {item.product?.title || 'Product not found'}
                            </p>
                            <p className="text-dark-400 text-xs">
                              Qty: {item.quantity} × ${item.product?.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">
                              ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex items-center justify-between pt-6 border-t border-dark-700">
                <div className="text-sm text-dark-400">
                  <p className="mb-1">Order ID: <span className="text-white font-mono text-base">{order.id}</span></p>
                  {order.assignedTo && (
                    <p>Assigned to: <span className="text-white font-medium">{order.assignedTo}</span></p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {order.status === 'pending' && (
                    <div className="flex items-center text-yellow-400 text-sm bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Ready for pickup</span>
                    </div>
                  )}
                  {order.status === 'shipped' && (
                    <div className="flex items-center text-blue-400 text-sm bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                      <Truck className="h-4 w-4 mr-2" />
                      <span className="font-medium">Out for delivery</span>
                    </div>
                  )}
                  {order.status !== 'delivered' ? (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      className="btn-primary flex items-center px-6 py-3 text-base font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark as Delivered
                    </button>
                  ) : (
                    <div className="flex items-center text-green-400 bg-green-500/10 px-4 py-3 rounded-lg border border-green-500/20">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-semibold text-base">Delivered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )          )}
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;
