import  { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddLeave from './pages/AddLeave';
import LeaveList from './pages/LeaveList';
import AddPermission from './pages/AddPermission';
import EditPermission from './pages/EditPermission';
import PermissionList from './pages/PermissionList';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeesList from './pages/admin/EmployeesList';
import AddEmployee from './pages/admin/AddEmployee';
import EditEmployee from './pages/admin/EditEmployee';
import LeavesSummary from './pages/admin/LeavesSummary';
import DailyPresence from './pages/admin/DailyPresence';
import PendingApprovals from './pages/admin/PendingApprovals';
import Holidays from './pages/admin/Holidays';
import LeaveCarryover from './pages/admin/LeaveCarryover';
import Layout from './components/Layout';
import { UserProvider, useUserContext } from './context/UserContext';
import { LeaveProvider } from './context/LeaveContext';
import { AdminProvider } from './context/AdminContext';
import EditLeave from './pages/EditLeave';
import EmployeeAbsenceDetails from './pages/admin/EmployeeAbsenceDetails';
import HolidayCalendar from './pages/holidays/HolidayCalendar';
import HolidayList from './pages/holidays/HolidayList';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useUserContext();
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoggedIn } = useUserContext();
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { isLoggedIn, currentUser, isAdmin } = useUserContext();
  
  if (!isLoggedIn || !currentUser) {
    return (
      <Routes>
        <Route path="/" element={<Login onLogin={() => {}} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={
        <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />
      } />
      
      <Route path="/login" element={
        <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/conge/ajouter" element={
        <ProtectedRoute>
          <Layout>
            <AddLeave />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/conge/liste" element={
        <ProtectedRoute>
          <Layout>
            <LeaveList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/conge/edit/:id" element={
        <ProtectedRoute>
          <Layout>
            <EditLeave />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/permission/ajouter" element={
        <ProtectedRoute>
          <Layout>
            <AddPermission />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/permission/liste" element={
        <ProtectedRoute>
          <Layout>
            <PermissionList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/permission/edit/:id" element={
        <ProtectedRoute>
          <Layout>
            <EditPermission />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/holidays/calendar" element={
        <ProtectedRoute>
          <Layout>
            <HolidayCalendar />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/holidays/list" element={
        <ProtectedRoute>
          <Layout>
            <HolidayList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <Layout>
            <AdminDashboard />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/employees" element={
        <AdminRoute>
          <Layout>
            <EmployeesList />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/employees/add" element={
        <AdminRoute>
          <Layout>
            <AddEmployee />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/employees/edit/:id" element={
        <AdminRoute>
          <Layout>
            <EditEmployee />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/holidays" element={
        <AdminRoute>
          <Layout>
            <Holidays />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/leaves" element={
        <AdminRoute>
          <Layout>
            <LeavesSummary />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/leaves/carryover" element={
        <AdminRoute>
          <Layout>
            <LeaveCarryover />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/presence" element={
        <AdminRoute>
          <Layout>
            <DailyPresence />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/approvals" element={
        <AdminRoute>
          <Layout>
            <PendingApprovals />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="/admin/employee-absences" element={
        <AdminRoute>
          <Layout>
            <EmployeeAbsenceDetails />
          </Layout>
        </AdminRoute>
      } />
      
      <Route path="*" element={
        <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <LeaveProvider>
          <AdminProvider>
            <AppRoutes />
          </AdminProvider>
        </LeaveProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
 