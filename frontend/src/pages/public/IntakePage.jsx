import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createApplication } from '../../api/applications.api';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const STEPS = ['Personal Info', 'Household & Employment', 'Hardship & Request', 'Review & Submit'];

const EMPLOYMENT_OPTIONS = [
  { value: 'Full-time', label: 'Full-time employed' },
  { value: 'Part-time', label: 'Part-time employed' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Disabled', label: 'Unable to work / Disabled' },
];

const ASSISTANCE_OPTIONS = [
  { value: 'Rent', label: 'Rent / Housing' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Food', label: 'Food / Groceries' },
  { value: 'Medical', label: 'Medical expenses' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Childcare', label: 'Childcare' },
  { value: 'Other', label: 'Other' },
];

const INITIAL = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '',
  householdSize: '', monthlyIncome: '', employmentStatus: 'Full-time',
  hardshipDescription: '', assistanceType: 'Rent', requestedAmount: '',
};

export default function IntakePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validateStep(s) {
    if (s === 0) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'A valid email address is required.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!form.address.trim()) return 'Street address is required.';
      if (!form.city.trim()) return 'City is required.';
      if (!form.state.trim()) return 'State is required.';
      if (!form.zip.trim()) return 'ZIP code is required.';
    }
    if (s === 1) {
      if (!form.householdSize || parseInt(form.householdSize) < 1) return 'Household size must be at least 1.';
      if (form.monthlyIncome === '' || parseFloat(form.monthlyIncome) < 0) return 'Monthly income must be 0 or greater.';
    }
    if (s === 2) {
      if (!form.hardshipDescription.trim()) return 'Please describe your hardship.';
      if (!form.requestedAmount || parseFloat(form.requestedAmount) < 1) return 'Requested amount must be at least $1.';
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const data = {
        ...form,
        householdSize: parseInt(form.householdSize),
        monthlyIncome: parseFloat(form.monthlyIncome),
        requestedAmount: parseFloat(form.requestedAmount),
      };
      const app = await createApplication(data);
      navigate('/apply/success', { state: { referenceNumber: app.referenceNumber } });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Submission failed. Please check your information.');
      // Stay on the review step so the user can see their data and the error before going back
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Request Assistance</h1>
          <p className="text-gray-500 mt-2">Please complete all sections of this application.</p>
        </div>
        <div className="flex justify-between items-center mb-4">
          <Link to="/status" className="text-sm text-primary-600 hover:underline">Check existing application status</Link>
          <Link to="/login" className="text-sm text-primary-600 hover:underline">Staff Login</Link>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < step ? 'bg-primary-600 text-white' : i === step ? 'border-2 border-primary-600 text-primary-600' : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="ml-2 text-xs text-gray-500 hidden sm:inline">{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </li>
          ))}
        </ol>

        <div className="bg-white rounded-xl shadow-md p-8">
          {error && <Alert variant="error" message={error} className="mb-4" />}

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={form.firstName} onChange={set('firstName')} required />
                <Input label="Last Name" value={form.lastName} onChange={set('lastName')} required />
              </div>
              <Input label="Email Address" type="email" value={form.email} onChange={set('email')} required />
              <Input label="Phone Number" type="tel" value={form.phone} onChange={set('phone')} required />
              <Input label="Street Address" value={form.address} onChange={set('address')} required />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1"><Input label="City" value={form.city} onChange={set('city')} required /></div>
                <div><Input label="State" value={form.state} onChange={set('state')} maxLength={2} placeholder="IL" required /></div>
                <div><Input label="ZIP Code" value={form.zip} onChange={set('zip')} required /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Household & Employment</h3>
              <Input label="Household Size (number of people)" type="number" min="1" value={form.householdSize} onChange={set('householdSize')} required />
              <Input label="Gross Monthly Household Income ($)" type="number" min="0" step="0.01" value={form.monthlyIncome} onChange={set('monthlyIncome')} required />
              <Select label="Employment Status" options={EMPLOYMENT_OPTIONS} value={form.employmentStatus} onChange={set('employmentStatus')} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hardship & Assistance Request</h3>
              <Textarea
                label="Describe your hardship"
                placeholder="Please explain your current situation and what led to your need for assistance…"
                value={form.hardshipDescription}
                onChange={set('hardshipDescription')}
                rows={5}
                required
              />
              <Select label="Type of Assistance Needed" options={ASSISTANCE_OPTIONS} value={form.assistanceType} onChange={set('assistanceType')} />
              <Input label="Amount Requested ($)" type="number" min="1" step="0.01" value={form.requestedAmount} onChange={set('requestedAmount')} required />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Your Application</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Name', `${form.firstName} ${form.lastName}`],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['Address', `${form.address}, ${form.city}, ${form.state} ${form.zip}`],
                  ['Household Size', form.householdSize],
                  ['Monthly Income', `$${form.monthlyIncome}`],
                  ['Employment', form.employmentStatus],
                  ['Assistance Type', form.assistanceType],
                  ['Requested Amount', `$${form.requestedAmount}`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p className="text-xs text-gray-500 mb-1">Hardship Description</p>
                <p className="text-gray-800">{form.hardshipDescription}</p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                By submitting, you certify that all information provided is accurate and complete to the best of your knowledge.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="secondary" onClick={() => { setError(''); setStep((s) => s - 1); }} disabled={step === 0}>Back</Button>
            {step < STEPS.length - 1
              ? <Button onClick={handleNext}>Next</Button>
              : <Button onClick={handleSubmit} loading={loading}>Submit Application</Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
