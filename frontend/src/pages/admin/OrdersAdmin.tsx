import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAllOrders, updateOrderStatus, assignOrderToDelivery, fetchDeliveryAgents } from '../../store/slices/orderSlice';
import { ShoppingCart, Clock, Truck, CheckCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

const OrdersAdmin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, deliveryAgents } = useSelector((state: RootState) => state.orders);
  
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllOrders());
    dispatch(fetchDeliveryAgents());
  }, [dispatch]);

  const handleStatusUpdate = async (orderId: string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled') => {
    await dispatch(updateOrderStatus({ id: orderId, status: { status } }));
  };

  const handleAssignOrder = async (orderId: string, deliveryId: string) => {
    setAssigningOrder(orderId);
    await dispatch(assignOrderToDelivery({ orderId, deliveryId }));
    setAssigningOrder(null);
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
        return <ShoppingCart className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    assigned: orders.filter(o => o.assignedTo).length,
    totalValue: orders.reduce((sum, order) => sum + order.total, 0)
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Orders Management</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Shipped</p>
              <p className="text-2xl font-bold text-blue-400">{stats.shipped}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">Assigned</p>
              <p className="text-2xl font-bold text-purple-400">{stats.assigned}</p>
            </div>
            <UserPlus className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No orders found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="card border border-dark-700">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Order #{order.id.slice(-6)}
                    </h3>
                    <p className="text-dark-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {order.assignedTo && (
                      <p className="text-xs text-green-400">Assigned to delivery agent</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-500">
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="btn-outline p-2"
                  >
                    {expandedOrders.has(order.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
                                <ShoppingCart className="h-4 w-4 text-dark-400" />
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

                  {/* Delivery Address */}
                  <div>
                    <h4 className="text-sm font-medium text-dark-300 mb-2">Delivery Address</h4>
                    <p className="text-white text-sm bg-dark-700/50 p-3 rounded-lg">{order.address}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-dark-700">
                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'shipped')}
                      className="btn-outline text-sm"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                      className="btn-primary text-sm"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>

                {/* Assignment Section */}
                <div className="flex items-center space-x-2">
                  {!order.assignedTo ? (
                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignOrder(order.id, e.target.value);
                          }
                        }}
                        disabled={assigningOrder === order.id}
                        className="input text-sm w-48"
                        defaultValue=""
                      >
                        <option value="">Assign to delivery agent</option>
                        {deliveryAgents.map((agent: any) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.email}
                          </option>
                        ))}
                      </select>
                      {assigningOrder === order.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-green-400">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersAdmin;
