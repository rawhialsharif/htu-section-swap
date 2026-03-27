import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import RequestCard from '../components/RequestCard';

export default function FeedPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    api.get('/courses').then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const courseParam = filterCourse ? `&course_id=${filterCourse}` : '';
    api.get(`/requests?page=${page}${courseParam}`)
      .then((data) => {
        setRequests(data.requests);
        setTotal(data.total);
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [page, filterCourse]);

  const handleCourseFilter = (e) => {
    setFilterCourse(e.target.value);
    setPage(1);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="hero-banner">
          <h1>Find Your Section Swap</h1>
          <p>Browse open swap requests from your fellow students.</p>
        </div>

        {/* Filter */}
        <div className="filter-bar">
          <select
            id="feed-filter-course"
            className="form-select"
            value={filterCourse}
            onChange={handleCourseFilter}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_number} – {c.course_name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {total} active {total === 1 ? 'request' : 'requests'}
          </span>
        </div>

        {/* Feed */}
        <div className="card">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" />
              <span>Loading requests…</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No requests yet</div>
              <div className="empty-state-desc">Be the first to post a section swap request!</div>
            </div>
          ) : (
            requests.map((r) => <RequestCard key={r.id} request={r} />)
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '32px' }}>
              Page {page} of {Math.ceil(total / LIMIT)}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page * LIMIT >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
