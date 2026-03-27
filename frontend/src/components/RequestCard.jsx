function timeAgo(dateStr) {
  const now = Date.now();
  // SQLite returns UTC strings like '2023-01-01 12:00:00' without timezone. Append 'Z' to parse as UTC.
  const parsedDate = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const then = new Date(parsedDate).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RequestCard({ request, showDelete, onDelete }) {
  return (
    <div className="request-card">
      <div className="request-meta">
        <div>
          <div className="request-course">
            {request.course_number} – {request.course_name}
          </div>
          <div className="student-name">{request.student_name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className="request-time">{timeAgo(request.created_at)}</span>
          {request.status === 'matched' && (
            <span className="badge badge-success">Matched</span>
          )}
        </div>
      </div>

      {/* Swap row: Has → Wants */}
      <div className="request-swap-row">
        {/* Current section */}
        <div className="section-tag">
          <span className="st-label">Has</span>
          <span className="st-value">Section {request.current_section}</span>
          {request.current_instructor && <span className="st-sub">{request.current_instructor}</span>}
          {request.current_schedule && <span className="st-sub">{request.current_schedule}</span>}
        </div>

        <span className="swap-arrow">⇄</span>

        {/* Wanted sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <span className="st-label" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Wants any of
          </span>
          <div className="wanted-tags">
            {(request.wanted_sections || []).map((ws) => (
              <div key={ws.id} className="section-tag" style={{ minWidth: 'auto', flex: '0 0 auto' }}>
                <span className="st-value" style={{ fontSize: '0.8rem' }}>Section {ws.section_number}</span>
                {ws.instructor && <span className="st-sub">{ws.instructor}</span>}
                {ws.schedule && <span className="st-sub" style={{ fontSize: '0.68rem' }}>{ws.schedule}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDelete && (
        <div style={{ marginTop: 8 }}>
          <button
            id={`delete-request-${request.id}`}
            className="btn btn-danger btn-sm"
            onClick={() => onDelete?.(request.id)}
          >
            🗑 Delete Request
          </button>
        </div>
      )}
    </div>
  );
}
