import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../auth/AuthContext';
import { getDefaultDashboardPath } from '../../utils/roleHelpers';
import { resendVerification } from '../../api/auth.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { login, googleLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const reason = searchParams.get('reason');
  const sessionMessage = reason === 'expired' ? 'Your session has expired. Please sign in again.' : null;

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverifiedEmail('');
    setResendStatus('');
    try {
      const u = await login(email, password);
      navigate(getDefaultDashboardPath(u.role), { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email);
        setError(err.response.data.message || 'Your email has not been verified. Check your inbox.');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setGoogleLoading(true);
    setError('');
    setUnverifiedEmail('');
    setResendStatus('');
    try {
      const u = await googleLogin(credentialResponse.credential);
      navigate(getDefaultDashboardPath(u.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed. Please try again or use your email and password.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleResend() {
    setResendStatus('sending');
    try {
      await resendVerification(unverifiedEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
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

            {unverifiedEmail && (
              <div className="text-center">
                {resendStatus === 'sent' ? (
                  <p className="text-sm text-green-600">Verification email sent — check your inbox.</p>
                ) : resendStatus === 'error' ? (
                  <p className="text-sm text-red-500">Failed to send. Please try again.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    className="text-sm text-primary-600 hover:underline disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading || googleLoading}>Sign In</Button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Sign-In failed. Please try again.')}
                  useOneTap={false}
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need to submit an assistance request?{' '}
          <a href="/apply" className="text-primary-600 hover:underline">Apply here</a>
        </p>
      </div>
    </div>
  );
}
