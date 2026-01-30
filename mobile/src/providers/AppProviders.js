// src/providers/AppProviders.js
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { FileProvider } from '../context/FileContext'; 

/**
 * Component bọc tất cả providers của ứng dụng Mobile
 */
const AppProviders = ({ children }) => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* FileProvider cần được bọc trong AuthProvider để lấy user info nếu cần */}
        <FileProvider>
          {children}
        </FileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default AppProviders;