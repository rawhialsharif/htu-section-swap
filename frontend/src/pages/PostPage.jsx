import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MatchModal from '../components/MatchModal';

export default function PostPage({ onSuccess }) {
  const { token } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const [wantedSections, setWantedSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    api.get('/courses').then(setCourses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) { setSections([]); return; }
    setLoadingSections(true);
    setCurrentSection('');
    setWantedSections([]);
    api.get(`/courses/${selectedCourse}/sections`)
      .then(setSections)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoadingSections(false));
  }, [selectedCourse]);

  const toggleWanted = (sectionId) => {
    setWantedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) { toast('Please select a course.', 'error'); return; }
    if (!currentSection) { toast('Please select your current section.', 'error'); return; }
    if (wantedSections.length === 0) { toast('Please select at least one wanted section.', 'error'); return; }

    setLoading(true);
    try {
      const data = await api.post('/requests', {
        course_id: parseInt(selectedCourse),
        current_section_id: parseInt(currentSection),
        wanted_section_ids: wantedSections.map(Number),
      }, token);

      if (data.match) {
        setMatchResult(data.match);
      } else {
        toast('Request posted! We\'ll notify you when a match is found.', 'success');
        onSuccess?.();
        resetForm();
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCourse('');
    setCurrentSection('');
    setWantedSections([]);
    setSections([]);
  };

  const handleMatchDismiss = (keepRequest) => {
    setMatchResult(null);
    if (keepRequest) {
      toast('Request kept active – we\'ll look for more matches!', 'success');
    } else {
      toast('Request deleted.', 'info');
    }
    onSuccess?.();
    resetForm();
  };

  const availableWanted = sections.filter((s) => s.id !== parseInt(currentSection));

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-title">Post a Swap Request</div>
          <div className="page-subtitle">Tell us your course, current section, and where you'd like to be.</div>
        </div>

        <div className="card">
          <div className="card-body">
            <form id="post-swap-form" onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Course selection */}
                <div className="form-group">
                  <label className="form-label" htmlFor="select-course">Course</label>
                  <select
                    id="select-course"
                    className="form-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">— Select a course —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_number} – {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current section */}
                {selectedCourse && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="select-current">Your Current Section</label>
                    {loadingSections ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--color-text-muted)' }}>
                        <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'var(--color-primary)' }} />
                        Loading sections…
                      </div>
                    ) : (
                      <select
                        id="select-current"
                        className="form-select"
                        value={currentSection}
                        onChange={(e) => { setCurrentSection(e.target.value); setWantedSections([]); }}
                      >
                        <option value="">— Select your section —</option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            Section {s.section_number}
                            {s.instructor ? ` – ${s.instructor}` : ''}
                            {s.schedule ? ` (${s.schedule})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Wanted sections – multi-select chips */}
                {currentSection && availableWanted.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">
                      Sections I'd Accept
                      {wantedSections.length > 0 && (
                        <span className="badge badge-primary" style={{ marginLeft: 8 }}>
                          {wantedSections.length} selected
                        </span>
                      )}
                    </label>
                    <div className="section-grid">
                      {availableWanted.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          id={`wanted-section-${s.id}`}
                          className={`section-chip ${wantedSections.includes(s.id) ? 'selected' : ''}`}
                          onClick={() => toggleWanted(s.id)}
                        >
                          <span className="chip-label">Section {s.section_number}</span>
                          {s.instructor && <span className="chip-instructor">{s.instructor}</span>}
                          {s.schedule && <span className="chip-schedule">{s.schedule}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  id="submit-request-btn"
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={loading || !selectedCourse || !currentSection || wantedSections.length === 0}
                >
                  {loading ? <span className="spinner" /> : '🔄'}
                  {loading ? 'Posting…' : 'Post Swap Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Match found modal */}
      {matchResult && (
        <MatchModal match={matchResult} onDismiss={handleMatchDismiss} />
      )}
    </div>
  );
}
