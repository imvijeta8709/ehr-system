import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './context/PermissionsContext';

import LandingPage from './pages/LandingPage';
import DonorRegister from './pages/DonorRegister';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import RecordForm from './pages/RecordForm';
import RecordDetail from './pages/RecordDetail';
import Appointments from './pages/Appointments';
import AppointmentForm from './pages/AppointmentForm';
import Profile from './pages/Profile';
import Vitals from './pages/Vitals';
import Timeline from './pages/Timeline';
import AuditLogs from './pages/AuditLogs';
import BloodBank from './pages/BloodBank';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import DoctorAvailability from './pages/DoctorAvailability';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import BillingHistory from './pages/BillingHistory';
import Layout from './components/Layout';

// Role-based auth guard
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" />;
  return children;
};

// Permission-based feature guard (checks 'view' action)
const FeatureRoute = ({ children, feature }) => {
  const { canDo, loading } = usePermissions();
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (loading) return null;
  if (!canDo(feature, 'view')) return <Navigate to="/app/dashboard" />;
  return children;
};

export default function App() {
  const { user } = useAuth();

  const getDashboard = () => {
    if (user?.role === 'superadmin') return <SuperAdminDashboard />;
    if (user?.role === 'patient')    return <PatientDashboard />;
    return <DoctorDashboard />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/donate"          element={<DonorRegister />} />

        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/dashboard" />} />

          <Route path="dashboard" element={getDashboard()} />

          <Route path="patients" element={
            <FeatureRoute feature="patients">
              <PrivateRoute roles={['superadmin', 'admin', 'doctor']}><Patients /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="doctors" element={
            <FeatureRoute feature="doctors">
              <PrivateRoute roles={['superadmin', 'admin', 'doctor']}><Doctors /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="records/new" element={
            <FeatureRoute feature="records">
              <PrivateRoute roles={['superadmin', 'admin', 'doctor']}><RecordForm /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="records/:id/edit" element={
            <FeatureRoute feature="records">
              <PrivateRoute roles={['superadmin', 'admin', 'doctor']}><RecordForm /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="records/:id" element={
            <FeatureRoute feature="records"><RecordDetail /></FeatureRoute>
          } />

          <Route path="appointments" element={
            <FeatureRoute feature="appointments"><Appointments /></FeatureRoute>
          } />

          <Route path="appointments/new" element={
            <FeatureRoute feature="appointments"><AppointmentForm /></FeatureRoute>
          } />

          <Route path="vitals" element={
            <FeatureRoute feature="vitals"><Vitals /></FeatureRoute>
          } />

          <Route path="timeline" element={
            <FeatureRoute feature="timeline"><Timeline /></FeatureRoute>
          } />

          <Route path="timeline/:patientId" element={
            <FeatureRoute feature="timeline">
              <PrivateRoute roles={['superadmin', 'admin', 'doctor']}><Timeline /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="audit" element={
            <FeatureRoute feature="audit">
              <PrivateRoute roles={['superadmin', 'admin']}><AuditLogs /></PrivateRoute>
            </FeatureRoute>
          } />

          <Route path="profile" element={<Profile />} />

          <Route path="blood-bank" element={<BloodBank />} />

          <Route path="documents" element={<Documents />} />

          <Route path="notifications" element={<Notifications />} />

          <Route path="availability" element={
            <PrivateRoute roles={['doctor', 'admin', 'superadmin']}><DoctorAvailability /></PrivateRoute>
          } />

          <Route path="symptom-checker" element={<SymptomCheckerPage />} />

          <Route path="billing" element={<BillingHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
