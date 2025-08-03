import { DEBUG_LOGS } from '../constants/config';
/**
 * Стили для разных типов логов
 */
const logStyles = {
    info: 'background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px;',
    success: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 4px;',
    warn: 'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px;',
    error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px;',
    event: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px;',
    data: 'background: #6b7280; color: white; padding: 2px 6px; border-radius: 4px;',
    time: 'background: #0f766e; color: white; padding: 2px 6px; border-radius: 4px;',
};
/**
 * Функция для логирования с форматированием
 * @param type Тип сообщения
 * @param message Содержание сообщения
 * @param data Опциональные данные
 */
export function logDebug(type, message, data) {
    if (!DEBUG_LOGS) {
        // Оставляем только важные типы
        if (!['error', 'warn', 'success', 'event', 'info'].includes(type))
            return;
    }
    const style = logStyles[type] || logStyles.info;
    if (data) {
        console.log(`%c[${type.toUpperCase()}]%c ${message}`, style, 'color: inherit', data);
    }
    else {
        console.log(`%c[${type.toUpperCase()}]%c ${message}`, style, 'color: inherit');
    }
}
/**
 * Очищает историю чата в localStorage
 */
export function clearChatHistory() {
    logDebug('info', 'Очищена история чата в localStorage');
    localStorage.removeItem('chat_history');
}
/**
 * Инициализация логгера при запуске приложения
 */
export function initLogger() {
    logDebug('info', 'Инициализация приложения...');
    clearChatHistory();
}
