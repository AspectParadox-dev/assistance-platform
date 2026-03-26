import { useRef, useState } from 'react';

export default function FileUpload({ multiple = false, accept, onChange, label = 'Upload files' }) {
  const inputRef = useRef();
  const [files, setFiles] = useState([]);

  function handleChange(e) {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    onChange(selected);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
      >
        <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Click to browse or drag and drop</p>
        <input ref={inputRef} type="file" multiple={multiple} accept={accept} className="hidden" onChange={handleChange} />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}-${f.lastModified}`} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-green-500">✓</span> {f.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
