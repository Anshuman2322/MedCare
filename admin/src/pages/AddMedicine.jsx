import React from 'react';
import { api } from '../api/axios.js';
import MedicineForm from '../components/MedicineForm.jsx';

export default function AddMedicine({ onDone }) {
  async function handleSubmit(fd) {
    try {
      await api.post('/medicines', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone?.();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to create');
    }
  }
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">Add Medicine</h2>
      <MedicineForm onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  );
}
