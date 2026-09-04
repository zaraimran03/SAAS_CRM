import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ResetPassword() {
  const navigate = useNavigate();
  const params   = new URLSearchParams(useLocation().search);
  const mode     = params.get('mode')  || sessionStorage.getItem('otpFlow')   || 'reset';
  const email    = params.get('email') || sessionStorage.getItem('resetEmail') || '';

  const [otp,            setOtp]            = useState('');
  const [loading,        setLoading]        = useState(false);
  const [resending,      setResending]      = useState(false);
  const [error,          setError]          = useState('');
  const [message,        setMessage]        = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  // Keep sessionStorage in sync
  useEffect(() => {
    if (email) sessionStorage.setItem('resetEmail', email);
    if (mode)  sessionStorage.setItem('otpFlow', mode);
  }, [email, mode]);

  // Count down the resend cooldown every second
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── OTP input — only allow up to 6 digits ────────────────────────────────

  function handleOtpChange(e) {
    const value = e.target.value;
    if (!/^\d*$/.test(value) || value.length > 6) return;
    setOtp(value);
    setError('');
    setMessage('');
  }

  // ── Edit email button ─────────────────────────────────────────────────────

  function handleEditEmail() {
    navigate(email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password');
  }

  // ── Submit OTP ────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (!email) {
      setError('Email is missing. Please start the process again.');
      return;
    }

    try {
      setLoading(true);

      // Different endpoint depending on whether this is signup verification or password reset
      const endpoint = mode === 'signup' ? '/auth/verify-otp' : '/auth/verify-reset-otp';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Invalid OTP.');
        return;
      }

      if (mode === 'signup') {
        // Email verified — go to login
        sessionStorage.removeItem('otpFlow');
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetPasswordVerified');
        setMessage('Email verified successfully. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 1000);
        return;
      }

      // Password reset OTP verified — go to change password page
      setMessage('OTP verified successfully. Redirecting...');
      if (data.resetToken) sessionStorage.setItem('resetToken', data.resetToken);
      setTimeout(() => {
        navigate(`/change-password?email=${encodeURIComponent(email)}`, { replace: true });
      }, 800);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────

  async function handleResend() {
    if (resending || resendCooldown > 0) return;
    setError('');
    setMessage('');
    setOtp('');

    if (!email) {
      setError('Email is missing. Please start again.');
      return;
    }

    try {
      setResending(true);

      const endpoint = mode === 'signup' ? '/auth/resend-otp' : '/auth/forgot-password';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Unable to resend OTP.');
        if (data.remainingSeconds) setResendCooldown(Number(data.remainingSeconds));
        return;
      }

      setMessage(data.message || 'A new OTP has been sent.');
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Unable to connect to server.');
    } finally {
      setResending(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const description =
    mode === 'signup'
      ? 'Enter the 6-digit code sent to your email to verify your account.'
      : 'Enter the 6-digit code sent to your email to reset your password.';

  return (
    <AuthLayout
      title={<>Verify your<br />account securely</>}
      subtitle="Enter the verification code sent to your registered email address."
    >
      <div className="auth-form-header">
        <h2>Verify OTP</h2>
        <p>{description}</p>
      </div>

      {/* Show email with an Edit button */}
      {email && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px', background: '#f8f9fa', padding: '10px 15px', borderRadius: '8px',
        }}>
          <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>{email}</span>
          <button
            type="button"
            onClick={handleEditEmail}
            style={{ background: 'none', border: 'none', color: '#5b4bff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Edit
          </button>
        </div>
      )}

      {message && <div className="auth-success-message">{message}</div>}
      {error   && <div className="auth-error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-input-group">
          <label>Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={handleOtpChange}
            maxLength={6}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <div className="auth-otp-resend">
          Didn't receive the code?{' '}
          {resendCooldown > 0 ? (
            <span style={{ color: '#9ca3af' }}>Resend in {resendCooldown}s</span>
          ) : (
            <button type="button" className="resend-btn" onClick={handleResend} disabled={resending}>
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        <p className="auth-login-link">
          Remember your password?{' '}
          <Link to="/login" replace>Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
