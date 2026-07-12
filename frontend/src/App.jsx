import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleRegistry from "./pages/VehicleRegistry";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelExpenses from "./pages/FuelExpenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/fleet" element={<ProtectedRoute page="fleet"><VehicleRegistry /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute page="drivers"><Drivers /></ProtectedRoute>} />
        <Route path="/trips" element={<ProtectedRoute page="trips"><Trips /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute page="maintenance"><Maintenance /></ProtectedRoute>} />
        <Route path="/fuel-expenses" element={<ProtectedRoute page="fuel-expenses"><FuelExpenses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute page="analytics"><Analytics /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute page="settings"><Settings /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
