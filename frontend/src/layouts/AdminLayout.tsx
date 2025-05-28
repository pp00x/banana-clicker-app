import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Menu, 
  X, 
  Users, 
  Activity,
  ChevronRight
} from 'lucide-react';
import Button from '../components/common/Button';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auto-close sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const bananaEmoji = (
    <span className="inline-block text-2xl animate-float">🍌</span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex">
      {/* Sidebar - Desktop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block bg-secondary/95 text-white h-screen sticky top-0 shadow-xl overflow-hidden z-20"
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-6 flex items-center justify-between">
                <NavLink to="/admin" className="flex items-center space-x-2 text-2xl font-bold">
                  {bananaEmoji}
                  <span>Admin Panel</span>
                </NavLink>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              {/* Sidebar Links */}
              <nav className="flex-1 p-6 space-y-2">
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => 
                    `flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Users size={20} />
                  <span>User Management</span>
                </NavLink>
                <NavLink 
                  to="/admin/activity" 
                  className={({ isActive }) => 
                    `flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Activity size={20} />
                  <span>Activity Monitor</span>
                </NavLink>
              </nav>
              
              {/* Sidebar Footer */}
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user?.displayName} className="h-10 w-10 rounded-full" />
                    ) : (
                      <span className="text-xl">{bananaEmoji}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user?.displayName}</p>
                    <p className="text-sm text-white/70">{user?.role}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-white text-white hover:bg-white/20"
                  onClick={handleLogout}
                  leftIcon={<LogOut size={16} />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-10">
          <div className="container mx-auto h-16 flex items-center justify-between px-4">
            <div className="flex items-center">
              {/* Sidebar Toggle - Desktop */}
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden md:block p-2 mr-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu size={24} />
                </button>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              {/* Page Title */}
              <h1 className="text-xl font-bold ml-2 md:ml-0">
                {location.pathname.includes('users') ? 'User Management' : 'Activity Monitor'}
              </h1>
            </div>
            
            {/* Admin Badge */}
            <div className="hidden md:flex items-center">
              <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                Admin Dashboard
              </div>
            </div>
          </div>
        </header>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-secondary/95 text-white overflow-hidden shadow-lg z-20"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <NavLink 
                  to="/admin/users" 
                  className={({ isActive }) => 
                    `flex items-center space-x-4 p-3 rounded-lg ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Users size={20} />
                  <span>User Management</span>
                </NavLink>
                <NavLink 
                  to="/admin/activity" 
                  className={({ isActive }) => 
                    `flex items-center space-x-4 p-3 rounded-lg ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Activity size={20} />
                  <span>Activity Monitor</span>
                </NavLink>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-4 p-3 rounded-lg text-left text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
                
                {/* User info */}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center space-x-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user?.displayName} className="h-10 w-10 rounded-full" />
                      ) : (
                        <span className="text-xl">{bananaEmoji}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user?.displayName}</p>
                      <p className="text-sm text-white/70">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-secondary-dark/90 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-2 md:mb-0">
                {bananaEmoji}
                <span className="ml-2 font-bold">Banana Clicker Admin</span>
              </div>
              <div className="text-xs text-white/70">
                &copy; {new Date().getFullYear()} Banana Clicker. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;