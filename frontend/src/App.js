import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'; // <--- Import mới
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';   // <--- Import mới
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
// import GoogleCallback from './pages/Auth/GoogleCallback';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/Dashboard/DashboardPage';
import { FileProvider } from './context/FileContext';
import SearchPage from './pages/Search/SearchPage';
import ProfilePage from './pages/Profile/ProfilePage';
import FileViewerPage from './pages/FileViewer/FileViewerPage';
import IncomingRequestPage from './pages/Request/IncomingRequestPage';
import RecentPage from './pages/Recent/RecentPage';
import TrashPage from './pages/TrashPage';
import SharedPage from './pages/SharedPage';

// // Trang Home tạm thời
// const HomePage = () => <h1 className="text-3xl text-center mt-10">Chào mừng đến với SecureDoc!</h1>;

function App() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <AuthProvider>
          <FileProvider>
            <div className="App font-sans">
              <Routes>
                {/* --- ROUTE CÔNG KHAI (Public) --- */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-account" element={<VerifyEmailPage />} />

                {/* --- ROUTE ĐƯỢC BẢO VỆ (Private) --- */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    {/* Trang chủ (Root) */}
                    <Route path="/" element={<DashboardPage />} />
        
                    {/* Thư mục con */}
                    <Route path="/folders/:folderId" element={<DashboardPage />} />

                    {/* Trang tìm kiếm */}
                    <Route path="/search" element={<SearchPage />} />

                    {/* Trang thông tin tài khoản */}
                    <Route path="/profile" element={<ProfilePage />} />

                    <Route path="/file/view/:fileId" element={<FileViewerPage />} />

                    <Route path="/requests" element={<IncomingRequestPage />} />

                    <Route path="/recent" element={<RecentPage />} />

                    <Route path="/trash" element={<TrashPage />} />

                    <Route path="/shared" element={<SharedPage />} />
              
                  </Route>
                </Route>

              </Routes>
              <ToastContainer position="top-right" autoClose={3000} />
            </div>
          </FileProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;

// <Route path="/auth/callback" element={<GoogleCallback />} />