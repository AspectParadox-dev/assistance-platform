import { formatDateTime } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/roleHelpers';

export default function NoteList({ notes }) {
  if (!notes || notes.length === 0) {
    return <p className="text-sm text-gray-400 italic">No notes yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className={`rounded-lg p-4 ${note.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">
              {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown User'}
              {note.author && (
                <span className="ml-2 text-xs text-gray-500">({ROLE_LABELS[note.author.role] || note.author.role})</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {note.isInternal && (
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Internal</span>
              )}
              <span className="text-xs text-gray-400">{formatDateTime(note.createdAt)}</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
        </li>
      ))}
    </ul>
  );
}
