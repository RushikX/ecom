import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchProducts, setFilters } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { 
  Search, 
  ShoppingCart, 
  Loader2,
  Grid,
  List,
  Package
} from 'lucide-react';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const dispatch = useDispatch<AppDispatch>();
  const { products, categories, loading, filters, pagination } = useSelector(
    (state: RootState) => state.products
  );

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    dispatch(setFilters({ search, category, sortBy, sortOrder }));
    dispatch(fetchProducts({ page, category, search, sortBy, sortOrder }));
  }, [dispatch, searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleAddToCart = (productId: string) => {
    dispatch(addToCart({ productId, quantity: 1 }));
  };

  const ProductCard = ({ product }: { product: any }) => (
    <div className="card group hover:shadow-lg transition-all duration-200">
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-dark-700 mb-4">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="h-48 w-full bg-dark-600 flex items-center justify-center">
            <span className="text-dark-400">No image</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-dark-300 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary-500">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-dark-400">
            Stock: {product.stock}
          </span>
        </div>
        <button
          onClick={() => handleAddToCart(product.id)}
          disabled={product.stock === 0}
          className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <div className="card flex items-center space-x-4 group hover:shadow-lg transition-all duration-200">
      <div className="w-24 h-24 bg-dark-700 rounded-lg overflow-hidden flex-shrink-0">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-dark-600 flex items-center justify-center">
            <span className="text-dark-400 text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-white mb-1 truncate">
          {product.title}
        </h3>
        <p className="text-dark-300 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-500">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-sm text-dark-400">
            Stock: {product.stock}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={() => handleAddToCart(product.id)}
          disabled={product.stock === 0}
          className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-dark-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="input"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Name: A to Z</option>
            <option value="title-desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
          <p className="text-dark-400">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <ProductListItem key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => handleFilterChange('page', (pagination.page - 1).toString())}
                disabled={pagination.page === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-dark-300 px-4">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => handleFilterChange('page', (pagination.page + 1).toString())}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
