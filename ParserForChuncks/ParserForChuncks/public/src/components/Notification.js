import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { NOTIFICATION_TIMEOUT } from '../constants/config';
/**
 * Component for displaying notifications to user
 * Automatically hides after specified timeout
 */
const Notification = ({ notification, onClose }) => {
    const { message, type, visible } = notification;
    // Automatically hide notification after NOTIFICATION_TIMEOUT ms
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onClose, NOTIFICATION_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);
    // If notification is not visible, don't render anything
    if (!visible)
        return null;
    // Colors for different notification types
    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warn': return '#f59e0b';
            default: return '#3b82f6'; // info
        }
    };
    const style = {
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
    return (_jsx("div", { style: style, children: message }));
};
export default Notification;
