import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import file CSS toàn cục (chứa Tailwind)
import App from './App';

// Tạo root và render ứng dụng vào thẻ div có id="root"
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);