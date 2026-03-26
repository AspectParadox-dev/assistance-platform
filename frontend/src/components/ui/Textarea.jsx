import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, rows = 4, className = '', id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className="space-y-1">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Textarea;
