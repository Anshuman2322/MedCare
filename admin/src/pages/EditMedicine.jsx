import React, { useEffect, useState } from 'react';
import { api } from '../api/axios.js';
import MedicineForm from '../components/MedicineForm.jsx';
import ExistingImages from '../components/ExistingImages.jsx';
import UpdateSuccessModal from '../components/UpdateSuccessModal.jsx';
import { useToast } from '../components/ToastProvider.jsx';

export default function EditMedicine({ id, onDone }) {
  const [initial, setInitial] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updatedItem, setUpdatedItem] = useState(null);
  const [showUpdatedModal, setShowUpdatedModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    api.get(`/medicines/${id}`)
      .then(({ data }) => { if (active) setInitial(data); })
      .catch((e) => {
        const msg = e?.response?.data?.error || e.message;
        if (e?.response?.status === 404) {
          showToast('This item was renamed or removed. Returning to list.', { type: 'warning' });
          onDone?.();
        } else {
          showToast(msg || 'Failed to load item', { type: 'error' });
        }
      });
    return () => { active = false; };
  }, [id]);

  async function handleSubmit(fd) {
    try {
      const { data: updated } = await api.put(`/medicines/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // If ID changed due to rename, avoid refetch to old id; go back to list
      if (updated?.id && updated.id !== id) {
        showToast('Item renamed successfully. Returning to list.', { type: 'success' });
        onDone?.();
        return;
      }
      setInitial(updated || initial);
      setUpdatedItem(updated || initial);
      setShowUpdatedModal(true);
      // Refresh with latest from server to ensure modal shows accurate data
      try {
        const { data } = await api.get(`/medicines/${id}`);
        setInitial(data);
        setUpdatedItem(data);
      } catch {
        // ignore refetch errors; keep optimistic data
      }
    } catch (e) {
      showToast(e?.response?.data?.error || e.message || 'Failed to update', { type: 'error' });
    }
  }

  async function removeExisting(url) {
    try {
      await api.delete(`/medicines/${id}/images`, { data: { url } });
      const { data } = await api.get(`/medicines/${id}`);
      setInitial(data);
    } catch (e) {
      showToast(e?.response?.data?.error || e.message || 'Failed to remove image', { type: 'error' });
    }
  }

  async function deleteProduct() {
    try {
      await api.delete(`/medicines/${id}`);
      setConfirmOpen(false);
      onDone?.();
    } catch (e) {
      showToast(e?.response?.data?.error || e.message || 'Failed to delete', { type: 'error' });
    }
  }

  if (!initial) return <div className="text-slate-500">Loading…</div>;
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit: {initial.name}</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => onDone?.()}>Back</button>
          <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => setConfirmOpen(true)}>Delete</button>
        </div>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border shadow-lg w-[90vw] max-w-md p-4">
            <h3 className="text-lg font-semibold text-red-600">Delete Medicine</h3>
            <p className="mt-2 text-sm text-slate-700">Are you sure you want to delete <span className="font-medium">{initial.name}</span>? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={deleteProduct}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
      <ExistingImages id={id} images={initial.images} onRemove={removeExisting} />
      <MedicineForm initial={initial} onSubmit={handleSubmit} submitLabel="Update" />

      {showUpdatedModal && (
        <UpdateSuccessModal
          item={updatedItem || initial}
          onClose={() => setShowUpdatedModal(false)}
          onBack={() => {
            setShowUpdatedModal(false);
            onDone?.();
          }}
        />
      )}
    </div>
  );
}
