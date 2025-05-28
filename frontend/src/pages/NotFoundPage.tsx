import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  const bananaEmoji = (
    <span className="inline-block text-7xl animate-float">🍌</span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="mb-8"
        >
          {bananaEmoji}
        </motion.div>
        
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-3xl font-bold text-yellow-800 mb-6">Page Not Found</h2>
        
        <p className="text-lg text-gray-600 mb-8">
          Oops! Looks like the banana you're looking for has gone missing. Let's get you back to a page that exists.
        </p>
        
        <Link to="/">
          <Button
            variant="primary"
            leftIcon={<Home size={18} />}
            className="px-8 py-4"
          >
            Go Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;