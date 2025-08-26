import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';
import type { Notification, NotificationContextType } from './types';
import { NotificationContext } from './types';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, severity: AlertColor = 'info', duration: number = 4000) => {
    setNotification({ message, severity, duration });
  };

  const showSuccess = (message: string, duration: number = 4000) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration: number = 6000) => {
    showNotification(message, 'error', duration);
  };

  const showWarning = (message: string, duration: number = 5000) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message: string, duration: number = 4000) => {
    showNotification(message, 'info', duration);
  };

  const handleClose = () => {
    setNotification(null);
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={notification?.duration || 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {notification ? (
          <Alert
            onClose={handleClose}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationContext.Provider>
  );
};