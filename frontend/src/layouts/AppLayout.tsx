import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Trophy, Home } from 'lucide-react';
import Button from '../components/common/Button';

const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 text-gradient text-2xl font-bold">
            {bananaEmoji}
            <span>Banana Clicker</span>
          </NavLink>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/ranks" 
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              Rankings
            </NavLink>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              leftIcon={<LogOut size={16} />}
            >
              Logout
            </Button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
            className="md:hidden bg-white/90 backdrop-blur-md overflow-hidden shadow-lg"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-3 rounded-lg ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-gray-100'
                  }`
                }
                end
              >
                <Home size={20} />
                <span>Home</span>
              </NavLink>
              <NavLink 
                to="/ranks" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-3 rounded-lg ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-gray-100'
                  }`
                }
              >
                <Trophy size={20} />
                <span>Rankings</span>
              </NavLink>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 p-3 rounded-lg text-left hover:bg-gray-100"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
              
              {/* User info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center p-3 rounded-lg bg-yellow-50">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user?.displayName} className="h-10 w-10 rounded-full" />
                    ) : (
                      <span className="text-xl">{bananaEmoji}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">{user?.bananaCount} bananas</p>
                  </div>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-yellow-900/90 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              {bananaEmoji}
              <span className="ml-2 font-bold">Banana Clicker</span>
            </div>
            <div className="text-sm text-yellow-200">
              &copy; {new Date().getFullYear()} Banana Clicker. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;