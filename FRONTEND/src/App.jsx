import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Register       from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import ResetPassword  from "./pages/ResetPassword";
import Dashboard      from "./pages/Dashboard";
import Customers      from "./pages/Customers";
import Leads          from "./pages/Leads";
import Deals          from "./pages/Deals";
import Tasks          from "./pages/Tasks";
import Activities     from "./pages/Activities";
import Reports        from "./pages/Reports";
import OrgSettings    from "./pages/OrgSettings";
import Members        from "./pages/Members";
import AcceptInvitation from "./pages/AcceptInvitation";

const isLoggedIn = () => sessionStorage.getItem("isLoggedIn") === "true";

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
        <Route path="/change-password" element={<PublicOnlyRoute><ChangePassword /></PublicOnlyRoute>} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leads"     element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/deals"     element={<ProtectedRoute><Deals /></ProtectedRoute>} />
        <Route path="/tasks"      element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
        <Route path="/members"    element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><OrgSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
