function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function buildWhatsAppUrl(phone) {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `https://wa.me/${cleaned.replace('+', '')}`;
}

export default function MatchCard({ match, onDelete }) {
  const { my_request, their_request, matched_at } = match;

  return (
    <div className="match-card">
      <div className="match-header">
        <div className="match-icon">🎯</div>
        <div>
          <div className="match-title">Match Found!</div>
          <div className="match-subtitle">
            {my_request?.course_name || my_request?.course_number} · {timeAgo(matched_at)}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="section-tag">
          <span className="st-label">Your Section</span>
          <span className="st-value">Section {my_request?.current_section}</span>
          {my_request?.current_schedule && <span className="st-sub">{my_request.current_schedule}</span>}
        </div>
        <span style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>⇄</span>
        <div className="section-tag">
          <span className="st-label">Their Section</span>
          <span className="st-value">Section {their_request?.current_section}</span>
          {their_request?.schedule && <span className="st-sub">{their_request.schedule}</span>}
          {their_request?.instructor && <span className="st-sub">{their_request.instructor}</span>}
        </div>
      </div>

      {/* Contact info */}
      <div className="match-contact">
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
            {their_request?.student_name}
          </div>
          <div className="match-phone">{their_request?.student_phone}</div>
        </div>
        <a
          href={buildWhatsAppUrl(their_request?.student_phone || '')}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-success btn-sm"
          id={`whatsapp-${match.match_id}`}
        >
          💬 WhatsApp
        </a>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          id={`delete-after-match-${match.match_id}`}
          className="btn btn-danger btn-sm"
          onClick={() => onDelete?.(my_request?.id)}
          style={{ flex: 1 }}
        >
          🗑 Delete Request
        </button>
        <button
          id={`keep-after-match-${match.match_id}`}
          className="btn btn-ghost btn-sm"
          title="Keep request active to find more potential matches"
          style={{ flex: 1 }}
        >
          ✓ Keep Active
        </button>
      </div>
    </div>
  );
}
