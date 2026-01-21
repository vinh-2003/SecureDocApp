import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from '../context/AuthContext';
import { FileProvider } from '../context/FileContext';

/**
 * Component bọc tất cả providers của ứng dụng
 */
const AppProviders = ({ children }) => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <Router>
                <AuthProvider>
                    <FileProvider>
                        {children}
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="light"
                        />
                    </FileProvider>
                </AuthProvider>
            </Router>
        </GoogleOAuthProvider>
    );
};

export default AppProviders;