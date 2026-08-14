import Modal from './Modal';

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
