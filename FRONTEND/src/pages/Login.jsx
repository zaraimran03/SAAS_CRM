import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Login() {
  const navigate = useNavigate();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // On mount: restore remembered email if the user had checked "Remember Me"
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const remembered = localStorage.getItem('rememberMe') === 'true';
    if (savedEmail && remembered) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ── Remember Me checkbox ──────────────────────────────────────────────────

  function handleRememberMe(e) {
    const checked = e.target.checked;
    setRememberMe(checked);

    if (checked) {
      localStorage.setItem('rememberMe', 'true');
      const trimmed = email.trim().toLowerCase();
      if (trimmed) localStorage.setItem('rememberedEmail', trimmed);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
    }
  }

  // ── Forgot password link ──────────────────────────────────────────────────

  async function handleForgotPassword(e) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address first.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/auth/check-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmedEmail }),
      });

      if (response.status === 404) {
        setError("Email isn't registered");
        return;
      }
      if (!response.ok) {
        setError('Unable to verify email.');
        return;
      }

      navigate(`/forgot-password?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  }

  // ── Login form submit ─────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await response.json().catch(() => ({}));

      // Account exists but email isn't verified yet — send to OTP page
      if (response.status === 403 && data.requiresVerification === true) {
        const unverifiedEmail = data.email || email;
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('user');
        sessionStorage.setItem('resetEmail', unverifiedEmail);
        sessionStorage.setItem('otpFlow', 'signup');
        sessionStorage.removeItem('resetPasswordVerified');
        navigate(`/reset-password?mode=signup&email=${encodeURIComponent(unverifiedEmail)}`, {
          replace: true,
        });
        return;
      }

      if (!response.ok) {
        setError(data.message || 'Invalid email or password.');
        return;
      }

      if (!data.user) {
        setError('Login succeeded, but user information was not returned.');
        return;
      }

      // Save or clear the remembered email depending on the checkbox
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', trimmedEmail);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }

      // Store session data
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) sessionStorage.setItem('accessToken', data.token);

      // Clear any leftover OTP/reset data
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetOtp');
      sessionStorage.removeItem('otpFlow');
      sessionStorage.removeItem('resetPasswordVerified');

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      title={<>Manage your<br />business smarter</>}
      subtitle="Simple, powerful and productive CRM designed to help your business grow."
    >
      <div className="auth-form-header">
        <h2>Welcome Back</h2>
        <p>Login to your Mini CRM account.</p>
      </div>

      {error && <div className="auth-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              if (rememberMe) {
                const trimmed = e.target.value.trim().toLowerCase();
                if (trimmed) localStorage.setItem('rememberedEmail', trimmed);
                else localStorage.removeItem('rememberedEmail');
              }
            }}
            autoComplete="email"
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
          autoComplete="current-password"
          required
        />

        <div className="auth-login-options">
          <label htmlFor="rememberMe" className="auth-remember-me">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMe}
            />
            <span>Remember Me</span>
          </label>

          <div className="auth-forgot-password">
            <button type="button" onClick={handleForgotPassword} className="forgot-password-btn">
              Forgot Password?
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <p className="auth-login-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
