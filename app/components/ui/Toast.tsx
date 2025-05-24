'use client';

import { Toaster } from 'react-hot-toast';

export function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          fontSize: '14px',
          maxWidth: '400px'
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff'
          }
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff'
          }
        }
      }}
    />
  );
}
