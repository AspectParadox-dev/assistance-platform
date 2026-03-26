import { useState, useEffect, useRef, useCallback } from 'react';
import { listDonations } from '../../api/donations.api';
import DonationTable from '../../components/donations/DonationTable';
import DonationForm from '../../components/donations/DonationForm';
import CsvImportModal from '../../components/donations/CsvImportModal';
import PageHeader from '../../components/layout/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [csvModal, setCsvModal] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listDonations()
      .then((res) => {
        if (!mountedRef.current) return;
        setDonations(res.data);
        setTotal(res.total);
      })
      .catch(() => { if (mountedRef.current) setError('Failed to load donations'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, []);

  useEffect(load, [load]);

  return (
    <div>
      <PageHeader
        title="Donations"
        subtitle={`${total} total`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCsvModal(true)}>Import CSV</Button>
            <Button onClick={() => setAddModal(true)}>Add Donation</Button>
          </>
        }
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><Alert variant="error" message={error} /></div>
        ) : (
          <DonationTable donations={donations} onDeleted={load} />
        )}
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Donation">
        <DonationForm onCreated={() => { setAddModal(false); load(); }} onCancel={() => setAddModal(false)} />
      </Modal>

      <CsvImportModal isOpen={csvModal} onClose={() => setCsvModal(false)} onImported={load} />
    </div>
  );
}
