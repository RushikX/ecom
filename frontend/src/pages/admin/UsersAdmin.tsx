import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import api from '../../utils/api';

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/block`);
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/unblock`);
      fetchUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
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
      <h1 className="text-3xl font-bold text-white">Users Management</h1>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <div key={user.id} className="card">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.email}</h3>
                  <p className="text-sm text-dark-400 capitalize">{user.role}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-dark-300">
                  Status: <span className={user.isActive ? 'text-green-400' : 'text-red-400'}>
                    {user.isActive ? 'Active' : 'Blocked'}
                  </span>
                </p>
                <p className="text-sm text-dark-300">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                {user.isActive ? (
                  <button
                    onClick={() => handleBlockUser(user.id)}
                    className="btn-outline flex-1 flex items-center justify-center text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Block
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnblockUser(user.id)}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Unblock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
