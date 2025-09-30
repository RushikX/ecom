import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  ShoppingCart, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navigation = [
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
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
              <span className="text-lg font-bold text-white">E-Shop Admin</span>
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
            <span className="ml-2 text-lg font-bold text-white">E-Shop Admin</span>
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
                <p className="text-xs text-dark-400">Administrator</p>
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-dark-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">
              {navigation.find(item => item.href === location.pathname)?.name || 'Admin Dashboard'}
            </h1>
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

export default AdminLayout;
