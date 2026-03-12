import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Medicines from './pages/Medicines.jsx';
import MedicineForm from './pages/MedicineForm.jsx';
import Categories from './pages/Categories.jsx';
import Inquiries from './pages/Inquiries.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import AdminManagement from './pages/AdminManagement.jsx';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredPermission="dashboard">
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'medicines',
        element: (
          <ProtectedRoute requiredPermission="medicines">
            <Medicines />
          </ProtectedRoute>
        ),
      },
      {
        path: 'medicines/add',
        element: (
          <ProtectedRoute requiredPermission="medicines">
            <MedicineForm mode="create" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'medicines/edit/:id',
        element: (
          <ProtectedRoute requiredPermission="medicines">
            <MedicineForm mode="edit" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories',
        element: (
          <ProtectedRoute requiredPermission="categories">
            <Categories />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inquiries',
        element: (
          <ProtectedRoute requiredPermission="inquiries">
            <Inquiries />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manage-admins',
        element: (
          <ProtectedRoute requireSuperAdmin>
            <AdminManagement />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
