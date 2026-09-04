import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared by every protected page: reads the logged-in user out of
// sessionStorage and bounces to /login if not found.
export function useAuthUser() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    const storedUser = JSON.parse(sessionStorage.getItem("user") || "null");

    if (!isLoggedIn || !storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    setUser(storedUser);
  }, []);

  const logout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return { user, logout };
}