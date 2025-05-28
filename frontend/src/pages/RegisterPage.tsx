import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { Mail, Lock, User, Image, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    avatarUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    setLoading(true);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || formData.username,
        avatarUrl: formData.avatarUrl || undefined,
      });
      
      showNotification({
        title: 'Registration Successful',
        message: 'Welcome to Banana Clicker!',
        type: 'success',
      });
      
      navigate('/');
    } catch (err: any) {
      showNotification({
        title: 'Registration Failed',
        message: err.message || 'Failed to register. Please try again.',
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
            <p className="text-gray-600 mt-2">Create a new account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                type="text"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                placeholder="your-username"
                leftIcon={<User size={18} />}
                error={errors.username}
              />
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Input
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your-email@example.com"
                leftIcon={<Mail size={18} />}
                error={errors.email}
              />
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Input
                  type="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} />}
                  error={errors.password}
                />
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Input
                  type="password"
                  name="confirmPassword"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} />}
                  error={errors.confirmPassword}
                />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Input
                type="text"
                name="displayName"
                label="Display Name (optional)"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Your display name"
                leftIcon={<User size={18} />}
                error={errors.displayName}
              />
            </motion.div>
            
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Input
                type="url"
                name="avatarUrl"
                label="Avatar URL (optional)"
                value={formData.avatarUrl}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                leftIcon={<Image size={18} />}
                error={errors.avatarUrl}
              />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-2"
            >
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
                rightIcon={<ArrowRight size={18} />}
              >
                Register
              </Button>
            </motion.div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-2"></div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;