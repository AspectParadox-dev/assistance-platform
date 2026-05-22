import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getApplication, assignApplication, updateStatus } from '../../api/applications.api';
import { listFormFields } from '../../api/form-fields.api';
import { listUsers } from '../../api/users.api';
import { useAuth } from '../../auth/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import StatusTimeline from '../../components/applications/StatusTimeline';
import StatusBadge from '../../components/applications/StatusBadge';
import Tabs from '../../components/ui/Tabs';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import NoteList from '../../components/notes/NoteList';
import NoteForm from '../../components/notes/NoteForm';
import DocumentList from '../../components/documents/DocumentList';
import DocumentUpload from '../../components/documents/DocumentUpload';
import ComplianceChecklist from '../../components/compliance/ComplianceChecklist';
import DecisionForm from '../../components/decisions/DecisionForm';
import DisbursementForm from '../../components/disbursements/DisbursementForm';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Modal from '../../components/ui/Modal';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'notes', label: 'Notes' },
  { key: 'documents', label: 'Documents' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'decision', label: 'Decision' },
  { key: 'disbursement', label: 'Disbursement' },
];

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseManagers, setCaseManagers] = useState([]);
  const [assigningId, setAssigningId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [disbModal, setDisbModal] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [formFields, setFormFields] = useState([]);

  const canAssign = ['CASE_MANAGER', 'ADMIN'].includes(user?.role);
  const canAdvanceStatus = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'].includes(user?.role);
  const isPresident = ['PRESIDENT', 'ADMIN'].includes(user?.role);
  const isTreasurer = ['TREASURER', 'ADMIN'].includes(user?.role);
  const isComplianceOfficer = ['COMPLIANCE_OFFICER', 'ADMIN'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    getApplication(id)
      .then(setApp)
      .catch(() => setError('Failed to load application'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (canAssign) {
      listUsers()
        .then((users) => setCaseManagers(users.filter((u) => ['CASE_MANAGER', 'ADMIN'].includes(u.role))))
        .catch(() => {});
    }
  }, [canAssign]);

  useEffect(() => {
    listFormFields().then(setFormFields).catch(() => {});
  }, []);

  async function handleAssign() {
    if (!assigningId) return;
    setAssignLoading(true);
    try {
      await assignApplication(id, assigningId);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to assign case manager');
    } finally {
      setAssignLoading(false);
    }
  }

  async function advanceToCompliance() {
    setStatusError('');
    try {
      await updateStatus(id, 'COMPLIANCE_REVIEW');
      load();
    } catch (err) {
      setStatusError(err?.response?.data?.error || 'Failed to advance status');
    }
  }

  async function advanceToPendingDecision() {
    setStatusError('');
    try {
      await updateStatus(id, 'PENDING_DECISION');
      load();
    } catch (err) {
      setStatusError(err?.response?.data?.error || 'Failed to advance status');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;
  if (!app) return null;

  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'decision' && !isPresident) return false;
    if (t.key === 'disbursement' && !isTreasurer) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Application ${app.referenceNumber}`}
        subtitle={`${app.firstName} ${app.lastName} · Submitted ${formatDate(app.createdAt)}`}
        actions={<StatusBadge status={app.status} />}
      />

      <div className="overflow-x-auto pb-2">
        <StatusTimeline status={app.status} />
      </div>

      <Tabs tabs={visibleTabs} activeTab={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Applicant Information">
            <dl className="space-y-3 text-sm">
              {[
                ['Name', `${app.firstName} ${app.lastName}`],
                ['Email', app.email],
                ['Phone', app.phone],
                ['Address', `${app.address}, ${app.city}, ${app.state} ${app.zip}`],
                ['Household Size', app.householdSize],
                ['Monthly Income', formatCurrency(app.monthlyIncome)],
                ['Employment', app.employmentStatus],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{val}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Request Details">
            <dl className="space-y-3 text-sm">
              {[
                ['Assistance Type', app.assistanceType],
                ['Requested Amount', formatCurrency(app.requestedAmount)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{val}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Hardship Description</p>
              <p className="text-sm text-gray-800">{app.hardshipDescription}</p>
            </div>
          </Card>

          {app.customData && formFields.length > 0 && (
            <Card title="Additional Information">
              <dl className="space-y-3 text-sm">
                {formFields.map((field) => {
                  const val = app.customData[field.fieldKey];
                  if (val === undefined || val === null || val === '') return null;
                  const display = field.fieldType === 'CHECKBOX'
                    ? (val === 'true' || val === true ? 'Yes' : 'No')
                    : String(val);
                  return (
                    <div key={field.fieldKey} className="flex justify-between">
                      <dt className="text-gray-500">{field.label}</dt>
                      <dd className="font-medium text-gray-900 text-right">{display}</dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          )}

          <Card title="Case Management" actions={
            canAssign && (
              <div className="flex items-center gap-2">
                <Select
                  options={[{ value: '', label: 'Select…' }, ...caseManagers.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]}
                  value={assigningId}
                  onChange={(e) => setAssigningId(e.target.value)}
                />
                <Button size="sm" onClick={handleAssign} loading={assignLoading} disabled={!assigningId}>Assign</Button>
              </div>
            )
          }>
            <p className="text-sm text-gray-600">
              <span className="text-gray-500">Assigned to: </span>
              {app.assignedCaseManager ? `${app.assignedCaseManager.firstName} ${app.assignedCaseManager.lastName}` : 'Unassigned'}
            </p>

            {canAdvanceStatus && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {statusError && <Alert variant="error" message={statusError} />}
                {app.status === 'UNDER_REVIEW' && app.assignedCaseManager && (
                  <Button size="sm" onClick={advanceToCompliance}>Advance to Compliance Review</Button>
                )}
                {app.status === 'COMPLIANCE_REVIEW' && isComplianceOfficer && (
                  <Button size="sm" onClick={advanceToPendingDecision}>Advance to Pending Decision</Button>
                )}
              </div>
            )}
          </Card>

          {isTreasurer && app.status === 'APPROVED' && (
            <Card title="Disbursement">
              <Button onClick={() => setDisbModal(true)}>Schedule Disbursement</Button>
            </Card>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <Card title="Notes">
          <div className="space-y-6">
            <NoteList notes={app.notes} />
            {(canAssign || isComplianceOfficer) && <NoteForm applicationId={id} onCreated={load} />}
          </div>
        </Card>
      )}

      {tab === 'documents' && (
        <Card title="Documents">
          <div className="space-y-6">
            <DocumentList applicationId={id} documents={app.documents} onDeleted={load} />
            {canAssign && <DocumentUpload applicationId={id} onUploaded={load} />}
          </div>
        </Card>
      )}

      {tab === 'compliance' && (
        <Card title="Compliance Checklist">
          <ComplianceChecklist
            applicationId={id}
            checklistData={app.complianceChecklistData}
            editable={isComplianceOfficer}
            onSaved={load}
          />
        </Card>
      )}

      {tab === 'decision' && isPresident && (
        <Card title="President Decision">
          <DecisionForm applicationId={id} decisions={app.decisions} onDecisionMade={load} />
        </Card>
      )}

      {tab === 'disbursement' && isTreasurer && (
        <Card title="Disbursement">
          {app.status === 'APPROVED' && (
            <div className="mb-6">
              <DisbursementForm applicationId={id} onCreated={load} />
            </div>
          )}
          {app.disbursements?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Disbursement History</h4>
              <ul className="divide-y divide-gray-100">
                {app.disbursements.map((d) => (
                  <li key={d.id} className="py-3 text-sm flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatCurrency(d.amount)} via {d.method}</p>
                      <p className="text-gray-500">Scheduled: {formatDate(d.scheduledDate)} · Status: {d.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={disbModal} onClose={() => setDisbModal(false)} title="Schedule Disbursement">
        <DisbursementForm applicationId={id} onCreated={() => { setDisbModal(false); load(); }} />
      </Modal>
    </div>
  );
}
