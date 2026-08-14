import { useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';

export default function CreateRoomModal({ onClose, onCreated }) {
  const { push } = useToast();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createRoom({ name, location, description });
      push(res.message || 'Room created.', 'success');
      onCreated(res.data);
      onClose();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Create Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="room-name">
            Name
          </label>
          <input
            id="room-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Greenhouse A"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="room-location">
            Location <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="room-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="North Wing"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="room-description">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            id="room-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          The room ID is generated automatically by the backend — you don't set it here.
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </Modal>
  );
}
