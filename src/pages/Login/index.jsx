import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import AuthLayout from '../../components/AuthLayout';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  }, [error, success]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [login, formData, navigate]);

  const handleForgotPassword = useCallback(async () => {
    if (!formData.email.trim()) {
      setError('Please enter your email to reset your password');
      setSuccess('');
      return;
    }
    setError('');
    setSuccess('');
    try {
      setResetLoading(true);
      const result = await resetPassword(formData.email);
      if (result.success) {
        setSuccess('Check your email for the password reset link.');
      } else {
        setError(result.error || 'Failed to send password reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setResetLoading(false);
    }
  }, [formData.email, resetPassword]);

  return (
    <AuthLayout 
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      className="login-page"
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {success && (
          <motion.div 
            className="success-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{error}</span>
          </motion.div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              className={error ? 'error' : ''}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              className={error ? 'error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>
        <div className="d-flex justify-content-end mb-3">
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={handleForgotPassword}
            disabled={resetLoading || isLoading}
          >
            {resetLoading ? 'Sending reset link...' : 'Forgot password?'}
          </button>
        </div>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isLoading}
          loadingText="Signing In..."
          className="w-100"
        >
          Sign In
        </Button>
        <p className="text-center mt-3 mb-0">
          <Link to="/" className="btn btn-link p-0">
            Back to home
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login; 