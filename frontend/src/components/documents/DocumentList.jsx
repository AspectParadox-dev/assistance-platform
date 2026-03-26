import { formatDate } from '../../utils/formatters';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { deleteDocument, downloadDocument } from '../../api/documents.api';
import { useAuth } from '../../auth/AuthContext';
import { useState } from 'react';

export default function DocumentList({ applicationId, documents, onDeleted }) {
  const { user } = useAuth();
  const canDelete = ['CASE_MANAGER', 'ADMIN'].includes(user?.role);
  const [deleting, setDeleting] = useState(null);
  const [docError, setDocError] = useState('');

  async function handleDownload(doc) {
    setDocError('');
    try {
      const blob = await downloadDocument(applicationId, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      // Anchor must be in the DOM for programmatic click to trigger a download
      // in all browsers (e.g. Firefox, Safari).
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revocation so the browser has time to start the download before
      // the object URL is invalidated (synchronous revoke fails in Firefox/Safari).
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setDocError(`Failed to download "${doc.originalName}"`);
    }
  }

  async function handleDelete(doc) {
    if (!confirm(`Delete "${doc.originalName}"?`)) return;
    setDeleting(doc.id);
    setDocError('');
    try {
      await deleteDocument(applicationId, doc.id);
      onDeleted?.(doc.id);
    } catch {
      setDocError(`Failed to delete "${doc.originalName}"`);
    } finally {
      setDeleting(null);
    }
  }

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-gray-400 italic">No documents uploaded.</p>;
  }

  return (
    <>
      {docError && <Alert variant="error" message={docError} />}
    <ul className="divide-y divide-gray-100">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">{doc.originalName}</p>
            <p className="text-xs text-gray-400">
              Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName} · {formatDate(doc.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleDownload(doc)}>Download</Button>
            {canDelete && (
              <Button size="sm" variant="danger" loading={deleting === doc.id} onClick={() => handleDelete(doc)}>Delete</Button>
            )}
          </div>
        </li>
      ))}
    </ul>
    </>
  );
}
