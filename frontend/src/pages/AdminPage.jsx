import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminPage() {
  const { token, logout } = useAuth();
  const toast = useToast();
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = () => {
    setLoading(true);
    api.get('/admin/courses', token)
      .then(setCourses)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast('Please select a file first', 'error');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.upload('/admin/upload', formData, token);
      toast(res.message, 'success');
      setFile(null);
      document.getElementById('csv-upload').value = '';
      fetchCourses();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteCourse = async (id) => {
    try {
      await api.del(`/admin/courses/${id}`, token);
      toast('Course deleted', 'success');
      fetchCourses();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const deleteSection = async (id) => {
    try {
      await api.del(`/admin/sections/${id}`, token);
      toast('Section deleted', 'success');
      fetchCourses();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '20px' }}>
      <div className="navbar" style={{ marginBottom: 20 }}>
        <div className="navbar-inner">
          <div className="navbar-logo">
            <div className="logo-icon">🛡️</div>
            Admin Portal
          </div>
          <div className="navbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Import CSV Data</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Upload the university courses CSV file to merge new courses and sections. Existing data will not be overwritten.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input 
                id="csv-upload"
                type="file" 
                accept=".csv" 
                onChange={(e) => setFile(e.target.files[0])}
                style={{ flex: 1, padding: 8, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'white' }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleUpload} 
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Manage Data</h3>
            <button className="btn btn-ghost btn-sm" onClick={fetchCourses}>🔄 Refresh</button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-screen">
                <div className="spinner" />
                <span>Loading courses...</span>
              </div>
            ) : courses.length === 0 ? (
               <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>No courses available in the database.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {courses.map(course => (
                  <div key={course.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--color-surface-elevated)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--color-text-primary)' }}>
                        <strong>{course.course_number}</strong> – {course.course_name}
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(course.id)}>🗑 Delete Course</button>
                    </div>
                    {course.sections && course.sections.length > 0 && (
                      <div style={{ padding: '8px 16px', background: 'var(--color-surface)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {course.sections.map(section => (
                           <div key={section.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Section {section.section_number}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{section.instructor}</div>
                              </div>
                              <button style={{ background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} title="Delete Section" onClick={() => deleteSection(section.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
