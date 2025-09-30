import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchProduct, clearCurrentProduct } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProduct, loading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (currentProduct) {
      dispatch(addToCart({ productId: currentProduct.id, quantity: 1 }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-white mb-2">Product not found</h3>
        <button
          onClick={() => navigate('/customer/products')}
          className="btn-primary"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/customer/products')}
        className="flex items-center text-dark-400 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {currentProduct.images && currentProduct.images.length > 0 ? (
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-dark-700">
              <img
                src={currentProduct.images[0]}
                alt={currentProduct.title}
                className="h-96 w-full object-cover object-center"
              />
            </div>
          ) : (
            <div className="aspect-w-1 aspect-h-1 w-full bg-dark-700 rounded-lg flex items-center justify-center">
              <span className="text-dark-400">No image available</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentProduct.title}
            </h1>
            <p className="text-2xl font-bold text-primary-500 mb-4">
              ${currentProduct.price.toFixed(2)}
            </p>
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm text-dark-400">
                Stock: {currentProduct.stock} available
              </span>
              <span className="text-sm text-dark-400">
                Category: {currentProduct.category}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-dark-300 leading-relaxed">
              {currentProduct.description}
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={currentProduct.stock === 0}
              className="btn-primary flex items-center justify-center flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {currentProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
