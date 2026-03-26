import { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { importDonationsCsv } from '../../api/donations.api';

export default function CsvImportModal({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const closeTimerRef = useRef(null);

  // Auto-close the modal 2 seconds after a successful import so the user sees
  // the confirmation message before it dismisses.
  useEffect(() => {
    if (result) {
      closeTimerRef.current = setTimeout(() => {
        handleClose();
      }, 2000);
    }
    return () => clearTimeout(closeTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function handleImport() {
    if (!file) return;

    // Client-side type guard — accept .csv by extension or CSV MIME types
    const csvMimeTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];
    const isValidType = csvMimeTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv');
    if (!isValidType) {
      setError('Only CSV files are accepted. Please select a file with a .csv extension.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      const res = await importDonationsCsv(formData);
      setResult(res);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Donations from CSV"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          <Button onClick={handleImport} loading={loading} disabled={!file || !!result}>Import</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          CSV must include columns: <code className="bg-gray-100 px-1 rounded">donorName</code>, <code className="bg-gray-100 px-1 rounded">amount</code>, <code className="bg-gray-100 px-1 rounded">method</code>, <code className="bg-gray-100 px-1 rounded">receivedDate</code>.<br />
          Optional: <code className="bg-gray-100 px-1 rounded">donorEmail</code>, <code className="bg-gray-100 px-1 rounded">referenceNumber</code>, <code className="bg-gray-100 px-1 rounded">notes</code>
        </p>
        {!result && (
          <FileUpload accept=".csv" onChange={(files) => setFile(files[0] || null)} label="Select CSV file" />
        )}
        {error && <Alert variant="error" message={error} />}
        {result && (
          <Alert variant="success" message={`Successfully imported ${result.count} donation${result.count !== 1 ? 's' : ''}.`} />
        )}
      </div>
    </Modal>
  );
}
