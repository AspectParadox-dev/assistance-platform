import { useState } from 'react';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';
import { uploadDocuments } from '../../api/documents.api';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function DocumentUpload({ applicationId, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFilesSelected(selected) {
    setError('');
    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`);
      setFiles([]);
      return;
    }
    const badType = selected.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (badType) {
      setError(`"${badType.name}" is not an allowed file type. Use PDF, JPG, PNG, or DOCX.`);
      setFiles([]);
      return;
    }
    setFiles(selected);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const docs = await uploadDocuments(applicationId, formData);
      setFiles([]);
      onUploaded?.(docs);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FileUpload multiple accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={handleFilesSelected} label={`Upload supporting documents (PDF, JPG, PNG, DOCX — max ${MAX_FILE_SIZE_MB} MB each)`} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" loading={loading} disabled={files.length === 0}>Upload</Button>
    </form>
  );
}
