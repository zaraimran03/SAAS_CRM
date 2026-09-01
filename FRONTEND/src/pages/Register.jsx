import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import PasswordRequirements, { passwordMeetsAllRules } from '../components/PasswordRequirements';
import Button from '../components/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Register() {
  const navigate = useNavigate();

  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!passwordMeetsAllRules(password)) {
      setError('Please make sure your password meets all the requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fullName, email, phone, password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Registration failed.');
        return;
      }

      const registeredEmail = data.email || email;
      sessionStorage.setItem('resetEmail', registeredEmail);
      sessionStorage.setItem('otpFlow', 'signup');
      sessionStorage.removeItem('otpVerified');
      sessionStorage.removeItem('resetPasswordVerified');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('user');

      navigate(`/reset-password?mode=signup&email=${encodeURIComponent(registeredEmail)}`, {
        replace: true,
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={<>Manage your<br />business smarter</>}
      subtitle="Organize customers, track activity and grow your business with Mini CRM."
    >
      <div className="auth-form-header">
        <h2>Create Account</h2>
        <p>Create your Mini CRM account to get started.</p>
      </div>

      {error && <div className="auth-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setError(''); }}
            autoComplete="name"
            required
          />
        </div>

        <div className="auth-input-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoComplete="email"
            required
          />
        </div>

        <div className="auth-input-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            autoComplete="tel"
            required
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          autoComplete="new-password"
          required
        />

        <PasswordRequirements password={password} />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
          autoComplete="new-password"
          required
        />

        {confirmPassword && (
          <div className={password === confirmPassword ? 'auth-password-match success' : 'auth-password-match error'}>
            {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="auth-login-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
