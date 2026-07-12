import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navAccess } from "../lib/roles";

/**
 * Wrap any route element with this to require a logged-in session.
 * Pass `page="maintenance"` (etc.) to additionally enforce RBAC nav access —
 * roles without access are bounced to the dashboard instead of seeing a blank page.
 */
export default function ProtectedRoute({ children, page }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (page && !navAccess(role).includes(page)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
