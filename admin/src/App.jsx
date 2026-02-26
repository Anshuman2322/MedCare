import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Medicines from './pages/Medicines.jsx';
import MedicineForm from './pages/MedicineForm.jsx';
import Categories from './pages/Categories.jsx';
import Inquiries from './pages/Inquiries.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'medicines', element: <Medicines /> },
      { path: 'medicines/add', element: <MedicineForm mode="create" /> },
      { path: 'medicines/edit/:id', element: <MedicineForm mode="edit" /> },
      { path: 'categories', element: <Categories /> },
      { path: 'inquiries', element: <Inquiries /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
