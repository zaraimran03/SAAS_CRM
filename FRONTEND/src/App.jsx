import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Leads = lazy(() => import("./pages/Leads"));
const Deals = lazy(() => import("./pages/Deals"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Activities = lazy(() => import("./pages/Activities"));
const Reports = lazy(() => import("./pages/Reports"));
const OrgSettings = lazy(() => import("./pages/OrgSettings"));
const Members = lazy(() => import("./pages/Members"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));

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
      <Suspense fallback={<div role="status">Loading page...</div>}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
