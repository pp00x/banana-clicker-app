import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const loggedInUser = await login(email, password); // Capture the returned user
      showNotification({
        title: 'Login Successful',
        message: 'Welcome back to Banana Clicker!',
        type: 'success',
      });
      if (loggedInUser && loggedInUser.role === 'admin') {
        navigate('/admin/users'); // Redirect admin to admin page
      } else {
        navigate('/'); // Redirect player to player homepage
      }
    } catch (err: any) {
      showNotification({
        title: 'Login Failed',
        message: err.message || 'Failed to log in. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const bananaEmoji = (
    <span className="inline-block text-2xl animate-float">🍌</span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {bananaEmoji}
            </motion.div>
            <h1 className="text-3xl font-bold text-center text-gradient">Banana Clicker</h1>
            <p className="text-gray-600 mt-2">Log in to start clicking!</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                leftIcon={<Mail size={18} />}
                error={errors.email}
              />
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                error={errors.password}
              />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-2"
            >
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight size={18} />}
              >
                Log In
              </Button>
            </motion.div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
          
          {/* Removed Demo Accounts section */}
        </div>
        
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-2"></div>
      </motion.div>
    </div>
  );
};

export default LoginPage;