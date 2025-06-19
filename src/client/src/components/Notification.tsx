import React, { CSSProperties, useEffect } from 'react';
import { Notification as NotificationType } from '../types';
import { NOTIFICATION_TIMEOUT } from '../constants/config';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

/**
 * Компонент для отображения уведомлений пользователю
 * Автоматически скрывается через заданный промежуток времени
 */
const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const { message, type, visible } = notification;
  
  // Автоматически скрываем уведомление через NOTIFICATION_TIMEOUT мс
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, NOTIFICATION_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  // Если уведомление не видимо, не рендерим ничего
  if (!visible) return null;
  
  // Цвета для разных типов уведомлений
  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      default: return '#3b82f6'; // info
    }
  };
  
  const style: CSSProperties = {
    position: 'fixed',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: getBackgroundColor(),
    color: 'white',
    fontWeight: 600,
    fontSize: '0.875rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'opacity 0.3s ease',
    opacity: visible ? 1 : 0,
  };

  return (
    <div style={style}>
      {message}
    </div>
  );
};

export default Notification; 