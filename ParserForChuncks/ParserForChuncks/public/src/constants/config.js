// API URL для запросов к серверу
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
	? import.meta.env.VITE_API_BASE_URL
	: (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE_URL)
		? process.env.NEXT_PUBLIC_API_BASE_URL
		: '/api/v1';
export const API_URL = `${String(API_BASE).replace(/\/$/, '')}/ask`;
// Глобальный флаг для управления логированием
export const DEBUG_LOGS = false; // Включить true для полного дебага, false — только ключевые события
// Задержка (в миллисекундах) для автоматического скрытия уведомлений
export const NOTIFICATION_TIMEOUT = 3000;
