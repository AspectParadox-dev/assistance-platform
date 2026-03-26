import { useState } from 'react';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { createNote } from '../../api/notes.api';

export default function NoteForm({ applicationId, onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canMarkInternal = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(user?.role);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const note = await createNote(applicationId, { content, isInternal });
      setContent('');
      setIsInternal(false);
      onCreated?.(note);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        label="Add a note"
        placeholder="Write your note here…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      {canMarkInternal && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
          Mark as internal (not visible to applicant)
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>Add Note</Button>
    </form>
  );
}
