import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchOrders } from '../../store/slices/orderSlice';
import { Package, Clock, Truck, CheckCircle } from 'lucide-react';

const OrdersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No orders yet</h3>
          <p className="text-dark-400">Start shopping to see your orders here!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card hover:shadow-lg transition-all duration-200 border border-dark-700"
            >
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
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary-500">
                    ${order.total.toFixed(2)}
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-dark-300 mb-3">Items ({order.items.length})</h4>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
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
                  {order.items.length > 3 && (
                    <p className="text-dark-400 text-sm text-center py-2">
                      +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                <div className="text-sm text-dark-400">
                  <p>Delivery Address: {order.address}</p>
                </div>
                <Link
                  to={`/customer/orders/${order.id}`}
                  className="btn-outline text-sm px-4 py-2"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
