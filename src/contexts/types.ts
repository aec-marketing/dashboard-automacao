import { useContext } from 'react';
import type { AlertColor } from '@mui/material';

export interface Notification {
  message: string;
  severity: AlertColor;
  duration?: number;
}

export interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

// Hook movido para cá para evitar o erro do Fast Refresh
import { createContext } from 'react';

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider');
  }
  return context;
};