import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiShield, FiMail, FiUser, FiCheckCircle } from 'react-icons/fi';
import { emailService } from '../../services/emailService';
import AuthLayout from '../../components/AuthLayout';
import Button from '../../components/Button';

const SetupPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!email || !token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      return;
    }

    verifyToken();
  }, [email, token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const user = await emailService.verifyInvitationToken(email, token);
      setUserData(user);
      setTokenValid(true);
      setError('');
    } catch (error) {
      setError(error.message || 'Invalid or expired invitation link.');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await emailService.activateUserAccount(email, formData.password);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading && !tokenValid) {
    return (
      <AuthLayout 
        title="Verifying Invitation"
        subtitle="Please wait while we verify your invitation link..."
        className="setup-password-page"
      >
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Verifying your invitation...</p>
        </div>
      </AuthLayout>
    );
  }

  if (!tokenValid) {
    return (
      <AuthLayout 
        title="Invalid Invitation"
        subtitle="The invitation link is invalid or has expired"
        className="setup-password-page"
      >
        <div className="error-container">
          <FiShield size={48} className="error-icon" />
          <p className="error-message">{error}</p>
          <Button 
            variant="primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Set Up Your Password"
      subtitle={`Welcome ${userData?.name}! Please set up your password to activate your account.`}
      className="setup-password-page"
    >
      <div className="user-info-card">
        <div className="user-details">
          <FiUser size={16} />
          <span className="user-name">{userData?.name}</span>
        </div>
        <div className="user-details">
          <FiMail size={16} />
          <span className="user-email">{email}</span>
        </div>
        <div className="user-details">
          <FiCheckCircle size={16} />
          <span className="user-role">{userData?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        <Button 
          variant="primary"
          type="submit" 
          loading={loading}
          className="submit-btn"
        >
          {loading ? 'Activating Account...' : 'Activate Account'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SetupPassword; 