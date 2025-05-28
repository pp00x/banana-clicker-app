import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../hooks/useNotification';
import { useSocket } from '../hooks/useSocket'; // Import useSocket
import { userService } from '../services/userService';
import { User } from '../contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock,
  ChevronLeft,
  ChevronRight,
  // MoreHorizontal, // Removed as unused
  X,
  // Check, // Removed as unused
  Save
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const AdminUserManagementPage = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]); // Stores all users fetched from backend
  const [page, setPage] = useState(1); // Current page for client-side pagination
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    avatarUrl: '',
    role: 'player' as 'player' | 'admin',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const { showNotification } = useNotification();
  const { socket, isConnected } = useSocket(); // Get socket instance
  
  const LIMIT = 10;

  useEffect(() => {
    // Fetch all users when the component mounts
    loadInitialUsers();
  }, []);

  // New useEffect for Socket.IO listener to update banana counts and online status in real-time
  useEffect(() => {
    if (socket && isConnected) {
      const handleUserStatusUpdate = (data: {
        userId: string; // This is _id from backend
        username: string;
        status: 'online' | 'offline';
        bananaCount: number;
        // activeSockets might also be present if needed
      }) => {
        setAllUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === data.userId
              ? { ...user, bananaCount: data.bananaCount, isOnline: data.status === 'online' }
              : user
          )
        );
      };

      socket.on('user_status_update', handleUserStatusUpdate);

      return () => {
        socket.off('user_status_update', handleUserStatusUpdate);
      };
    }
  }, [socket, isConnected]); // Rerun when socket or connection status changes

  const loadInitialUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(); // Fetches all users
      setAllUsers(response.users);
      // setTotal is no longer needed from response, will be derived from allUsers or filteredUsers length
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to fetch users',
        type: 'error',
      });
      setAllUsers([]); // Ensure allUsers is an empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh the user list, e.g., after CUD operations
  const refreshUsersList = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      setAllUsers(response.users);
      setPage(1); // Optionally reset to first page after refresh
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to refresh users list',
        type: 'error',
      });
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      displayName: '',
      avatarUrl: '',
      role: 'player',
      password: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      displayName: user.displayName || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role,
      password: '', // Don't populate password for security
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (modalMode === 'create' && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.avatarUrl && !/^https?:\/\/.+/.test(formData.avatarUrl)) {
      newErrors.avatarUrl = 'Avatar URL must be a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        await userService.createUser(formData);
        showNotification({
          title: 'Success',
          message: 'User created successfully',
          type: 'success',
        });
      } else if (modalMode === 'edit' && selectedUser) {
        await userService.updateUser(selectedUser._id, formData);
        showNotification({
          title: 'Success',
          message: 'User updated successfully',
          type: 'success',
        });
      }
      
      setIsModalOpen(false);
      refreshUsersList(); // Refresh the list after create/update
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.message || `Failed to ${modalMode} user`,
        type: 'error',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin') {
      showNotification({
        title: 'Error',
        message: 'Cannot delete admin users',
        type: 'error',
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
      try {
        await userService.deleteUser(user._id);
        showNotification({
          title: 'Success',
          message: 'User deleted successfully',
          type: 'success',
        });
        refreshUsersList(); // Refresh the list after delete
      } catch (error: any) {
        showNotification({
          title: 'Error',
          message: error.message || 'Failed to delete user',
          type: 'error',
        });
      }
    }
  };

  const handleToggleBlockUser = async (user: User) => {
    if (user.role === 'admin') {
      showNotification({
        title: 'Error',
        message: 'Cannot block admin users',
        type: 'error',
      });
      return;
    }
    
    const action = user.isBlocked ? 'unblock' : 'block';
    const confirmMsg = `Are you sure you want to ${action} ${user.username}?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        if (user.isBlocked) {
          await userService.unblockUser(user._id);
        } else {
          await userService.blockUser(user._id);
        }
        
        showNotification({
          title: 'Success',
          message: `User ${action}ed successfully`,
          type: 'success',
        });
        
        refreshUsersList(); // Refresh the list after block/unblock
      } catch (error: any) {
        showNotification({
          title: 'Error',
          message: error.message || `Failed to ${action} user`,
          type: 'error',
        });
      }
    }
  };

  // Client-side filtering
  const filteredUsers = useMemo(() =>
    allUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [allUsers, searchTerm]);

  // Client-side pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * LIMIT;
    const endIndex = startIndex + LIMIT;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page, LIMIT]);
  
  const totalPages = Math.ceil(filteredUsers.length / LIMIT); // totalPages based on filtered list

  return (
    <div className="pb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-500">Manage all users and their permissions</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
              className="w-full sm:w-64"
            />
            
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              New User
            </Button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">User</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Email</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Role</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500 text-right">Bananas</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? ( // Check paginatedUsers
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm && allUsers.length > 0 ? `No users found matching "${searchTerm}"` : (allUsers.length === 0 && !loading ? 'No users available' : 'No users found')}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => ( // Map over paginatedUsers
                    <motion.tr
                      key={user._id} // Assuming user._id is the unique key
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-secondary-light/20 flex items-center justify-center mr-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName || user.username}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-secondary">
                                {user.displayName?.charAt(0) || user.username.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.displayName || user.username}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{user.bananaCount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isBlocked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleToggleBlockUser(user)}
                            className={`p-1 rounded-full transition-colors ${
                              user.isBlocked 
                                ? 'hover:bg-green-100 text-green-600' 
                                : 'hover:bg-red-100 text-red-600'
                            }`}
                            title={user.isBlocked ? 'Unblock user' : 'Block user'}
                            disabled={user.role === 'admin'}
                          >
                            {user.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                            title="Delete user"
                            disabled={user.role === 'admin'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && allUsers.length > 0 && ( // Check allUsers.length instead of total
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {/* Update displayed count logic */}
              Showing {paginatedUsers.length > 0 ? (page - 1) * LIMIT + 1 : 0}-
              {Math.min(page * LIMIT, filteredUsers.length)} of {filteredUsers.length} users
              {searchTerm && ` (filtered from ${allUsers.length} total)`}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft size={16} />}
              >
                Prev
              </Button>
              
              <div className="text-sm text-gray-600 px-2">
                Page {page} of {totalPages}
              </div>
              
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'create' ? 'Create New User' : 'Edit User'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      error={errors.username}
                      required
                    />
                    
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      required
                    />
                    
                    <Input
                      label="Display Name (optional)"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      error={errors.displayName}
                    />
                    
                    <Input
                      label="Avatar URL (optional)"
                      name="avatarUrl"
                      value={formData.avatarUrl}
                      onChange={handleInputChange}
                      error={errors.avatarUrl}
                    />
                    
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-300"
                      >
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <Input
                      label={modalMode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={errors.password}
                      required={modalMode === 'create'}
                    />
                  </div>
                  
                  {/* Form Buttons */}
                  <div className="mt-8 flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                      leftIcon={<X size={18} />}
                      disabled={formSubmitting}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={formSubmitting}
                      leftIcon={modalMode === 'create' ? <Plus size={18} /> : <Save size={18} />}
                    >
                      {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserManagementPage;