import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  transferOwnership,
  updateAdminRole,
  updateAdminPermissions,
} from '../api/adminApi.js';
import Modal from '../components/ui/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const roleBadge = {
  super_admin: 'bg-purple-50 text-purple-700 border border-purple-100',
  admin: 'bg-blue-50 text-blue-700 border border-blue-100',
};

export default function AdminManagement() {
  const { admin, setAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [permissionDraft, setPermissionDraft] = useState({});

  const isSuper = admin?.role === 'super_admin';

  useEffect(() => {
    if (!isSuper) return;
    load();
  }, [isSuper]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items]);

  const selectedAdmin = useMemo(() => sortedItems.find((a) => a._id === selectedAdminId), [sortedItems, selectedAdminId]);

  useEffect(() => {
    if (sortedItems.length && !selectedAdminId) {
      setSelectedAdminId(sortedItems[0]._id);
    }
  }, [sortedItems, selectedAdminId]);

  useEffect(() => {
    if (selectedAdmin) {
      setPermissionDraft(selectedAdmin.permissions || {});
    }
  }, [selectedAdmin]);

  async function load() {
    try {
      setLoading(true);
      const { data } = await listAdmins();
      setItems(data?.admins || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load admins');
    } finally {
      setLoading(false);
    }
  }

  const resetNotice = () => {
    setError('');
    setNotice('');
  };

  async function handleCreate(e) {
    e?.preventDefault?.();
    resetNotice();
    setSaving(true);
    try {
      await createAdmin(form);
      setNotice('Admin created successfully.');
      setForm({ email: '', password: '' });
      setCreateOpen(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to create admin');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    resetNotice();
    setSaving(true);
    try {
      await deleteAdmin(deleteTarget._id);
      setItems((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      setNotice('Admin deleted.');
      setDeleteTarget(null);
      if (selectedAdminId === deleteTarget._id) {
        setSelectedAdminId('');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to delete admin');
    } finally {
      setSaving(false);
    }
  }

  async function handleTransfer(targetId) {
    resetNotice();
    setSaving(true);
    try {
      const { data } = await transferOwnership(targetId);
      setNotice('Ownership transferred.');
      setItems((prev) => prev.map((a) => ({ ...a, role: a._id === targetId ? 'super_admin' : 'admin' })));
      if (admin?._id === targetId) {
        setAdmin((prev) => ({ ...prev, role: 'super_admin' }));
      } else if (admin?.role === 'super_admin') {
        setAdmin((prev) => ({ ...prev, role: 'admin' }));
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to transfer ownership');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleRole(target) {
    resetNotice();
    setSaving(true);
    const nextRole = target.role === 'super_admin' ? 'admin' : 'super_admin';
    try {
      const { data } = await updateAdminRole(target._id, nextRole);
      if (nextRole === 'super_admin') {
        setItems((prev) => prev.map((a) => ({ ...a, role: a._id === target._id ? 'super_admin' : 'admin' })));
      } else {
        setItems((prev) => prev.map((a) => (a._id === target._id ? { ...a, role: 'admin' } : a)));
      }
      setNotice('Role updated.');
      if (nextRole === 'super_admin') {
        if (admin?._id === target._id) {
          setAdmin((prev) => ({ ...prev, role: 'super_admin' }));
        } else if (admin?.role === 'super_admin') {
          setAdmin((prev) => ({ ...prev, role: 'admin' }));
        }
      } else if (target._id === admin?._id) {
        setAdmin((prev) => ({ ...prev, role: 'admin' }));
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update role');
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(key) {
    setPermissionDraft((prev) => ({ ...prev, [key]: !prev?.[key] }));
  }

  async function handleSavePermissions() {
    if (!selectedAdmin) return;
    resetNotice();
    const isTargetSuper = selectedAdmin.role === 'super_admin';
    if (isTargetSuper) return;

    setSavingPermissions(true);
    const previousItems = items;
    const updatedItems = items.map((item) =>
      item._id === selectedAdmin._id ? { ...item, permissions: { ...permissionDraft } } : item
    );
    setItems(updatedItems);

    try {
      await updateAdminPermissions(selectedAdmin._id, permissionDraft);
      setNotice('Permissions updated.');
    } catch (err) {
      setItems(previousItems);
      setError(err?.response?.data?.error || 'Unable to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  }

  if (!isSuper) {
    return (
      <div className="space-y-4">
        <div className="section-title">Access</div>
        <h2 className="text-xl font-semibold">Admin Management</h2>
        <div className="card p-4 text-sm text-slate-700">Only super admins can view this page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 shadow-lg">
          {notice}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="section-title">Team</div>
          <h2 className="text-xl font-semibold">Admin Management</h2>
          <p className="text-sm text-slate-600">Manage admins, ownership, and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
        >
          Create New Admin
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">{notice}</div>}

      <div className="card p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-500">Loading admins...</td>
                </tr>
              )}
              {!loading && sortedItems.map((item) => {
                const isSelf = admin?._id === item._id;
                const canDelete = item.role === 'admin' && !isSelf;
                const canTransfer = !isSelf;
                const toggleLabel = item.role === 'super_admin' ? 'Demote to Admin' : 'Promote to Super Admin';
                const isSelected = item._id === selectedAdminId;
                return (
                  <tr
                    key={item._id}
                    className={`align-middle cursor-pointer ${isSelected ? 'bg-emerald-50/60' : ''}`}
                    onClick={() => setSelectedAdminId(item._id)}
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">{item.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleBadge[item.role] || roleBadge.admin}`}>
                        {item.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving || (item.role === 'super_admin' && isSelf)}
                        onClick={() => handleToggleRole(item)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {toggleLabel}
                      </button>
                      <button
                        type="button"
                        disabled={saving || !canTransfer}
                        onClick={() => handleTransfer(item._id)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Transfer Ownership
                      </button>
                      <button
                        type="button"
                        disabled={saving || !canDelete}
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="section-title">Access Modules</div>
            <h3 className="text-lg font-semibold">Manage Permissions</h3>
            <p className="text-sm text-slate-600">Control what this admin can access.</p>
          </div>
          {selectedAdmin?.role === 'super_admin' && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
              Full Access (Super Admin)
            </span>
          )}
        </div>

        {!selectedAdmin && <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">Select an admin to manage permissions.</div>}

        {selectedAdmin && (
          <div className="space-y-4">
            <div className="space-y-2">
              {[{ key: 'dashboard', label: 'Dashboard' }, { key: 'medicines', label: 'Medicines' }, { key: 'categories', label: 'Categories' }, { key: 'inquiries', label: 'Inquiries' }, { key: 'adminManagement', label: 'Admin Management' }].map((perm) => {
                const enabled = Boolean(permissionDraft?.[perm.key]);
                return (
                  <div
                    key={perm.key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-slate-800">{perm.label}</div>
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.key)}
                      disabled={savingPermissions || selectedAdmin.role === 'super_admin'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      } ${selectedAdmin.role === 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={savingPermissions || selectedAdmin.role === 'super_admin'}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingPermissions ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        title="Create New Admin"
        description="Invite another admin to manage the store. New admins start with the Admin role."
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreate}
        confirmLabel={saving ? 'Creating...' : 'Create'}
        tone="primary"
      >
        <form className="space-y-3" onSubmit={handleCreate}>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="admin@cureneed.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-800">
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="Strong password"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete Admin"
        description={`Delete ${deleteTarget?.email || ''}? This cannot be undone.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel={saving ? 'Deleting...' : 'Delete'}
      />
    </div>
  );
}
