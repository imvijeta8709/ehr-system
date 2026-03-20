import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PermissionsProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </PermissionsProvider>
    </AuthProvider>
  </React.StrictMode>
);
