import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import "../styles/auth.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/accept-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.get("token"), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to accept invitation.");
      setMessage(data.message);
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1>Accept invitation</h1>
        <p>Set your password to join Mini CRM.</p>
        <form onSubmit={handleSubmit}>
          <PasswordInput label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <PasswordInput label="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <Button type="submit" disabled={loading}>{loading ? "Accepting..." : "Accept invitation"}</Button>
        </form>
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}

export default AcceptInvitation;
