import { useState } from 'react';

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Alert({ variant = 'info', message, dismissible = false }) {
  const [visible, setVisible] = useState(true);
  if (!visible || !message) return null;

  return (
    <div className={`flex items-start gap-3 border rounded-md px-4 py-3 text-sm ${STYLES[variant]}`}>
      <span className="flex-1">{message}</span>
      {dismissible && (
        <button onClick={() => setVisible(false)} className="text-current opacity-60 hover:opacity-100">&times;</button>
      )}
    </div>
  );
}
