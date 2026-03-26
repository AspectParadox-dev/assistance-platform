import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getDefaultDashboardPath } from '../../utils/roleHelpers';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show a contextual banner when redirected here after a token expiry
  const reason = searchParams.get('reason');
  const sessionMessage = reason === 'expired'
    ? 'Your session has expired. Please sign in again.'
    : null;

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(getDefaultDashboardPath(user.role), { replace: true });
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Assistance Platform</h1>
          <p className="text-gray-500 mt-2">Staff portal — sign in to continue</p>
        </div>
        {sessionMessage && (
          <div className="mb-4">
            <Alert variant="warning" message={sessionMessage} />
          </div>
        )}
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <Alert variant="error" message={error} />}
            <Button type="submit" className="w-full" loading={loading}>Sign In</Button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Need to submit an assistance request?{' '}
          <a href="/apply" className="text-primary-600 hover:underline">Apply here</a>
        </p>
      </div>
    </div>
  );
}
