'use client';

import { useState } from 'react';
import { moderationAPI } from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPublicId?: number;
  roomId?: string;
  onSuccess?: () => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetPublicId,
  roomId,
  onSuccess,
}: ReportModalProps) {
  const [publicId, setPublicId] = useState(targetPublicId ? String(targetPublicId) : '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const quickReasons = [
    'Harassment / Abusive behavior',
    'Spam / Commercial advertising',
    'Inappropriate or explicit content',
    'Threats or safety concerns',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(publicId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      setError('Please provide a valid numeric public ID');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the report');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await moderationAPI.report({
        targetPublicId: idNum,
        roomId,
        reason: reason.trim(),
      });
      setSuccess('Report submitted to administrators. Thank you for keeping Cordit safe.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-brutal bg-card w-full max-w-md p-6 border-4 border-black relative">
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-black">
          <div>
            <h2 className="text-xl font-black text-dark uppercase">REPORT A CONCERN</h2>
            <p className="text-xs font-bold text-dim">Confidential review by administrators</p>
          </div>
          <button
            onClick={onClose}
            className="btn-brutal bg-error text-white font-black text-xs px-2.5 py-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-black mb-1 uppercase text-dark">
              REPORTED USER PUBLIC ID
            </label>
            <input
              type="number"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value)}
              placeholder="e.g. 2134"
              required
              className="input-brutal w-full font-bold text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black mb-1.5 uppercase text-dark">
              QUICK REASONS
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="badge-brutal text-[11px] font-bold bg-surface hover:bg-yellow transition-colors cursor-pointer py-1 px-2"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-1 uppercase text-dark">
              DETAILS / EXPLANATION
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue or policy violation..."
              rows={3}
              maxLength={1000}
              required
              className="input-brutal w-full text-xs font-medium bg-white"
            />
          </div>

          {error && (
            <div className="p-2.5 border-2 border-black font-bold text-xs bg-error text-white">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2.5 border-2 border-black font-bold text-xs bg-success text-white">
              {success}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-brutal bg-surface text-dark flex-1 py-2 font-black text-xs uppercase"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-brutal bg-error text-white flex-1 py-2 font-black text-xs uppercase"
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

