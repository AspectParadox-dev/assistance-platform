import { useEffect, useState } from 'react';
import { listFormFields, createFormField, updateFormField, deleteFormField, reorderFormFields } from '../../api/form-fields.api';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

const FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: 'Short text' },
  { value: 'TEXTAREA', label: 'Long text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'SELECT', label: 'Dropdown' },
  { value: 'DATE', label: 'Date' },
  { value: 'CHECKBOX', label: 'Checkbox (yes/no)' },
];

const FIELD_TYPE_LABELS = Object.fromEntries(FIELD_TYPE_OPTIONS.map(o => [o.value, o.label]));

const EMPTY_FORM = { label: '', fieldKey: '', fieldType: 'TEXT', required: false, placeholder: '', options: '' };

function toFieldKey(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | field object (editing)
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function load() {
    setLoading(true);
    listFormFields()
      .then(setFields)
      .catch(() => setError('Failed to load form fields'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === 'label' && !modal?.id) next.fieldKey = toFieldKey(value);
      return next;
    });
  };

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('add');
  }

  function openEdit(field) {
    setForm({
      label: field.label,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      required: field.required,
      placeholder: field.placeholder || '',
      options: Array.isArray(field.options) ? field.options.join('\n') : '',
    });
    setFormError('');
    setModal(field);
  }

  function parseOptions(raw) {
    if (!raw.trim()) return undefined;
    return raw.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        label: form.label.trim(),
        fieldKey: form.fieldKey.trim(),
        fieldType: form.fieldType,
        required: form.required,
        placeholder: form.placeholder.trim() || undefined,
        options: parseOptions(form.options),
      };
      if (modal === 'add') {
        await createFormField(payload);
      } else {
        await updateFormField(modal.id, payload);
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save field');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(field) {
    if (!confirm(`Delete field "${field.label}"? Any data already collected for this field will remain on existing applications.`)) return;
    setDeleting(field.id);
    try {
      await deleteFormField(field.id);
      load();
    } catch {
      setError('Failed to delete field');
    } finally {
      setDeleting(null);
    }
  }

  function onDragStart(index) { setDragging(index); }
  function onDragOver(e, index) { e.preventDefault(); setDragOver(index); }

  async function onDrop(e, index) {
    e.preventDefault();
    if (dragging === null || dragging === index) { setDragging(null); setDragOver(null); return; }
    const reordered = [...fields];
    const [moved] = reordered.splice(dragging, 1);
    reordered.splice(index, 0, moved);
    const withOrder = reordered.map((f, i) => ({ ...f, order: i }));
    setFields(withOrder);
    setDragging(null);
    setDragOver(null);
    try {
      await reorderFormFields(withOrder.map(f => ({ id: f.id, order: f.order })));
    } catch {
      setError('Failed to save new order');
      load();
    }
  }

  const isEditing = modal && modal !== 'add';

  return (
    <div>
      <PageHeader
        title="Intake Form Builder"
        subtitle="Custom fields appear after the standard fields on your organization's intake form."
        actions={<Button onClick={openAdd}>Add Field</Button>}
      />

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : fields.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium mb-1">No custom fields yet</p>
            <p className="text-sm">Click "Add Field" to extend your intake form.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {fields.map((field, index) => (
              <li
                key={field.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-grab ${dragOver === index ? 'bg-primary-50 border-t-2 border-primary-400' : ''}`}
              >
                <span className="text-gray-300 text-lg select-none">⠿</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{field.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono">{field.fieldKey}</span>
                    {' · '}
                    {FIELD_TYPE_LABELS[field.fieldType] || field.fieldType}
                    {field.required && <span className="ml-2 text-red-500">Required</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(field)}>Edit</Button>
                  <Button size="sm" variant="danger" loading={deleting === field.id} onClick={() => handleDelete(field)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">Drag rows to reorder. Fields are shown to applicants in this order.</p>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={isEditing ? 'Edit Field' : 'Add Custom Field'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button form="field-form" type="submit" loading={submitting}>
              {isEditing ? 'Save Changes' : 'Add Field'}
            </Button>
          </>
        }
      >
        <form id="field-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Field Label"
            placeholder="e.g. Social Security Number"
            value={form.label}
            onChange={set('label')}
            required
          />
          <Input
            label="Field Key"
            placeholder="e.g. social_security_number"
            value={form.fieldKey}
            onChange={set('fieldKey')}
            required
            helpText="Unique identifier used internally. Auto-filled from the label."
          />
          <Select
            label="Field Type"
            options={FIELD_TYPE_OPTIONS}
            value={form.fieldType}
            onChange={set('fieldType')}
          />
          {form.fieldType === 'SELECT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder={"Option A\nOption B\nOption C"}
                value={form.options}
                onChange={set('options')}
              />
            </div>
          )}
          {form.fieldType !== 'CHECKBOX' && (
            <Input
              label="Placeholder (optional)"
              placeholder="Hint text shown inside the field"
              value={form.placeholder}
              onChange={set('placeholder')}
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.required} onChange={set('required')} className="rounded" />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
          {formError && <Alert variant="error" message={formError} />}
        </form>
      </Modal>
    </div>
  );
}
