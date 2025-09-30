import { Routes, Route } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import ProductsPage from './ProductsPage';
import ProductDetailsPage from './ProductDetailsPage';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import OrderDetailsPage from './OrderDetailsPage';
import ProfilePage from './ProfilePage';

const CustomerDashboard = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
