import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import ProductsAdmin from './ProductsAdmin';
import UsersAdmin from './UsersAdmin';
import OrdersAdmin from './OrdersAdmin';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<ProductsAdmin />} />
        <Route path="/products" element={<ProductsAdmin />} />
        <Route path="/users" element={<UsersAdmin />} />
        <Route path="/orders" element={<OrdersAdmin />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
