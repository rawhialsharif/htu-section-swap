import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState('feed');

  // If user logs in/out, redirect appropriately
  useEffect(() => {
    if (!user && (page === 'post' || page === 'dashboard' || page === 'admin')) {
      setPage('auth');
    }
  }, [user]);

  // Handle auth success and admin routing
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && page !== 'admin') {
        setPage('admin');
      } else if (user.role !== 'admin' && page === 'auth') {
        setPage('feed');
      }
    }
  }, [user, page]);

  const renderPage = () => {
    if (page === 'auth') return <AuthPage />;
    if (user?.role === 'admin' || page === 'admin') return <AdminPage />;
    if (page === 'post') return user ? <PostPage onSuccess={() => setPage('dashboard')} /> : <AuthPage />;
    if (page === 'dashboard') return user ? <DashboardPage /> : <AuthPage />;
    return <FeedPage />;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {page !== 'auth' && !isAdmin && <Navbar page={page} setPage={setPage} />}
      <main>
        {renderPage()}
      </main>
      {page !== 'auth' && !isAdmin && <BottomNav page={page} setPage={setPage} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
