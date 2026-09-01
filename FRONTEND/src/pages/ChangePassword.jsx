import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import PasswordRequirements, { passwordMeetsAllRules } from '../components/PasswordRequirements';
import Button from '../components/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ChangePassword() {
  const navigate = useNavigate();
  const email = new URLSearchParams(useLocation().search).get('email')?.trim().toLowerCase() || '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [successMsg,      setSuccessMsg]      = useState('');

  const passwordsMatch  = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordValid = passwordMeetsAllRules(password);

  // If there is no email in the URL, redirect back to forgot-password
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Reset session is invalid. Please start again.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet all the required conditions.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // The reset token was stored in sessionStorage after OTP verification
      const resetToken = sessionStorage.getItem('resetToken');
      const headers = { 'Content-Type': 'application/json' };
      if (resetToken) headers.Authorization = `Bearer ${resetToken}`;

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || data.error || 'Unable to change password.');
        return;
      }

      sessionStorage.removeItem('resetToken');
      setSuccessMsg(data.message || 'Password changed successfully!');
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={<>Secure your<br />account easily</>}
      subtitle="Create a strong new password and keep your Mini CRM account safe and secure."
    >
      <div className="auth-form-header">
        <h2>Change Password</h2>
        <p>Enter a strong new password for your account.</p>
      </div>

      {successMsg && <div className="auth-success-message" role="alert">{successMsg}</div>}
      {error      && <div className="auth-error-message"   role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <PasswordInput
          id="password"
          name="password"
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccessMsg(''); }}
          autoComplete="new-password"
          required
        />

        {confirmPassword && (
          <div className={passwordsMatch ? 'auth-password-match success' : 'auth-password-match error'}>
            {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
          </div>
        )}

        <PasswordRequirements password={password} />

        <Button type="submit" disabled={loading || !isPasswordValid || !passwordsMatch}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <p className="auth-login-link">
        Remember your password?{' '}
        <button type="button" onClick={() => navigate('/login', { replace: true })}>
          Login
        </button>
      </p>
    </AuthLayout>
  );
}

export default ChangePassword;
