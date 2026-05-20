import { useLocation, useParams, Link } from 'react-router-dom';

export default function IntakeSuccessPage() {
  const { state } = useLocation();
  const { orgSlug } = useParams();
  const ref = state?.referenceNumber;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-xl shadow-md p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-gray-600 mb-6">Thank you for submitting your application. Our team will review it shortly.</p>

          {ref && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-700 mb-1">Your reference number is</p>
              <p className="text-2xl font-bold text-primary-800 font-mono">{ref}</p>
              <p className="text-xs text-primary-600 mt-2">Please save this number to track your application status.</p>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-6">
            A case manager will be assigned to your application. You may be contacted if additional information is needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/status/${orgSlug}`} className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Check Application Status
            </Link>
            <Link to={`/apply/${orgSlug}`} className="inline-block text-primary-600 hover:underline text-sm py-2.5">
              Submit another application
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
