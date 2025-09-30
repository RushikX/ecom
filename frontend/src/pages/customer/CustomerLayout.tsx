import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { 
  ShoppingBag, 
  Home, 
  ShoppingCart, 
  Package, 
  User, 
  LogOut,
  Menu,
  X,
  Search
} from 'lucide-react';

const CustomerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navigation = [
    { name: 'Products', href: '/customer/products', icon: Home },
    { name: 'Cart', href: '/customer/cart', icon: ShoppingCart, count: cartItems.length },
    { name: 'Orders', href: '/customer/orders', icon: Package },
    { name: 'Profile', href: '/customer/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-dark-800 border-r border-dark-700">
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-bold text-white">E-Shop</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-dark-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500 border-r-2 border-primary-500'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-dark-800 border-r border-dark-700">
          <div className="flex items-center p-4 border-b border-dark-700">
            <ShoppingBag className="h-6 w-6 text-primary-500" />
            <span className="ml-2 text-lg font-bold text-white">E-Shop</span>
          </div>
          <nav className="mt-4 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-500 border-r-2 border-primary-500'
                      : 'text-dark-300 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-dark-400">Customer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-dark-800 border-b border-dark-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-dark-400 hover:text-white mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-dark-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </form>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/customer/cart"
                className="relative p-2 text-dark-400 hover:text-white transition-colors duration-200"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
