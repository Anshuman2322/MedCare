import React, { useState, useEffect } from 'react';
import { api } from '../api/axios.js';

export default function ExistingImages({ images = [], onRemove, id }) {
  const [order, setOrder] = useState(images);
  const [dragIndex, setDragIndex] = useState(null);
  useEffect(() => setOrder(images), [images]);

  if (!images?.length) return null;
  const move = (i, dir) => {
    setOrder((arr) => {
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return arr;
      const copy = arr.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  const saveOrder = async () => {
    try {
      await api.put(`/medicines/${id}/images/order`, { order });
      alert('Images order saved');
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to save order');
    }
  };

  const onDragStart = (index) => (e) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };
  const onDragOver = (overIndex) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === overIndex) return;
    setOrder((arr) => {
      const next = arr.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      setDragIndex(overIndex);
      return next;
    });
  };
  const onDrop = () => {
    setDragIndex(null);
  };

  return (
    <div className="grid gap-2">
      <div className="text-sm text-slate-600 flex items-center justify-between">
        <span>Existing Images</span>
        <button type="button" onClick={saveOrder} className="px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700">Save Order</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {order.map((url, i) => (
          <div
            key={url}
            className={`relative ${dragIndex===i?'ring-2 ring-emerald-400':''}`}
            draggable
            onDragStart={onDragStart(i)}
            onDragOver={onDragOver(i)}
            onDrop={onDrop}
          >
            <img src={url} className="h-28 w-full object-cover rounded border bg-white" />
            <div className="absolute left-1 top-1 flex gap-1">
              <button type="button" onClick={() => move(i,'up')} className="bg-white/90 border rounded px-1 text-xs">↑</button>
              <button type="button" onClick={() => move(i,'down')} className="bg-white/90 border rounded px-1 text-xs">↓</button>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
