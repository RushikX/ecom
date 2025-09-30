import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { createOrder } from '../../store/slices/orderSlice';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

const CartPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading: orderLoading } = useSelector((state: RootState) => state.orders);
  
  const [address, setAddress] = useState(user?.address || '');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity > 0) {
      dispatch(updateCartItem({ productId, quantity }));
    } else {
      dispatch(removeFromCart(productId));
    }
  };

  const handleRemoveItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleCheckout = async () => {
    if (!address.trim()) {
      alert('Please enter a delivery address');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        items: items,
        address: address.trim(),
      };

      await dispatch(createOrder(orderData)).unwrap();
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      // Redirect to orders page
      navigate('/customer/orders');
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const total = items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-400 hover:text-red-300 transition-colors duration-200"
          >
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
          <p className="text-dark-400">Add some products to get started!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="card flex items-center space-x-4">
                <div className="w-20 h-20 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.images && item.product.images.length > 0 ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                      <span className="text-dark-400 text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {item.product?.title}
                  </h3>
                  <p className="text-primary-500 font-semibold">
                    ${item.product?.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 text-dark-400 hover:text-white transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-white font-medium px-3 py-1 bg-dark-700 rounded">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 text-dark-400 hover:text-white transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200 mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-dark-300">Subtotal</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Shipping</span>
                  <span className="text-white">Free</span>
                </div>
                <div className="border-t border-dark-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-lg font-semibold text-primary-500">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Address Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address..."
                  className="input w-full h-20 resize-none"
                  required
                />
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={isProcessing || orderLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing || orderLoading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
