function buildWhatsAppUrl(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `https://wa.me/${cleaned.replace('+', '')}`;
}

/**
 * Shown right after a request is submitted and a match is immediately found.
 * onDismiss(keepRequest: boolean)
 */
export default function MatchModal({ match, onDismiss }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss(true)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
        <div className="modal-header">
          <div>
            <div id="match-modal-title" className="modal-title" style={{ color: 'var(--color-success)' }}>
              🎯 Instant Match Found!
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Your request was matched immediately
            </div>
          </div>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Great news! <strong style={{ color: 'var(--color-text-primary)' }}>{match.student_name}</strong> is
            in the section you want and wants to switch to yours. Reach out to coordinate the swap!
          </p>

          <div className="match-contact">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                {match.student_name}
              </div>
              <div className="match-phone">{match.student_phone}</div>
            </div>
            <a
              href={buildWhatsAppUrl(match.student_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success btn-sm"
              id="match-modal-whatsapp"
            >
              💬 WhatsApp
            </a>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: '1px solid var(--color-border)',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
          }}>
            💡 <strong>Next step:</strong> Message {match.student_name}, agree on the swap, then both of you visit
            the registrar together (or follow HTU's official section change process).
          </div>
        </div>

        <div className="modal-footer">
          <button
            id="match-modal-delete"
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={() => onDismiss(false)}
          >
            🗑 Delete My Request
          </button>
          <button
            id="match-modal-keep"
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => onDismiss(true)}
          >
            ✓ Keep Active
          </button>
        </div>
      </div>
    </div>
  );
}
