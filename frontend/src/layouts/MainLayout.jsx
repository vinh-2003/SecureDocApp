import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar cố định bên trái */}
      <Sidebar />

      {/* Khu vực nội dung chính bên phải */}
      <div className="flex-1 flex flex-col">
        <Header />
        
        {/* Nội dung thay đổi (Dashboard, Shared, Trash...) */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default MainLayout;