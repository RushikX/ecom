import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchOrder, clearCurrentOrder } from '../../store/slices/orderSlice';
import { ArrowLeft, Package, Clock, Truck, CheckCircle } from 'lucide-react';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentOrder, loading } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrder(id));
    }
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-white mb-2">Order not found</h3>
        <button
          onClick={() => navigate('/customer/orders')}
          className="btn-primary"
        >
          Back to Orders
        </button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/customer/orders')}
        className="flex items-center text-dark-400 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6">Order Items ({currentOrder.items.length})</h3>
            <div className="space-y-6">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
                  <div className="w-20 h-20 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                        <Package className="h-6 w-6 text-dark-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-lg mb-2">
                      {item.product?.title || 'Product not found'}
                    </h4>
                    {item.product?.description && (
                      <p className="text-dark-300 text-sm mb-3 line-clamp-2">
                        {item.product.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-dark-400">Quantity:</span>
                        <span className="text-white font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-dark-400">Unit Price:</span>
                        <span className="text-white font-medium">${item.product?.price?.toFixed(2) || '0.00'}</span>
                      </div>
                      {item.product?.category && (
                        <div className="flex items-center space-x-2">
                          <span className="text-dark-400">Category:</span>
                          <span className="text-primary-400 font-medium">{item.product.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-500 mb-1">
                      ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-dark-400 text-sm">
                      {item.quantity} × ${item.product?.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Order ID</span>
                <span className="text-white font-mono text-sm">#{currentOrder.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Status</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(currentOrder.status)}
                  <span className="text-white capitalize font-medium">{currentOrder.status}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Order Date</span>
                <span className="text-white text-sm">
                  {new Date(currentOrder.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Items</span>
                <span className="text-white font-medium">{currentOrder.items.length}</span>
              </div>
              <div className="border-t border-dark-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-2xl font-bold text-primary-500">
                    ${currentOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Shipping Address</h3>
            <div className="p-4 bg-dark-700/50 rounded-lg border border-dark-600">
              <p className="text-white leading-relaxed">{currentOrder.address}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
