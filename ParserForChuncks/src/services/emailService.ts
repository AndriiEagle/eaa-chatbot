import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';
import { supabase } from './supabaseService.js'; // Предполагается, что у вас есть настроенный клиент Supabase

interface EscalationDetails {
  sessionId: string;
  messageCount: number;
  escalationTime: string;
}

/**
 * Отправляет email-уведомление об эскалации через Supabase Edge Function.
 * @param details - Детали эскалации.
 */
export const sendEscalationEmail = async (details: EscalationDetails): Promise<void> => {
  const { sessionId, messageCount, escalationTime } = details;

  // Адрес получателя и тема письма могут быть вынесены в переменные окружения
  const toEmail = process.env.ESCALATION_EMAIL_RECIPIENT || 'support@example.com';
  const subject = `Эскалация чат-сессии: ${sessionId}`;

  const body = `
    <h2>⚠️ Требуется вмешательство специалиста</h2>
    <p>Сессия чат-бота была автоматически эскалирована.</p>
    <ul>
      <li><strong>ID сессии:</strong> ${sessionId}</li>
      <li><strong>Количество сообщений:</strong> ${messageCount}</li>
      <li><strong>Время эскалации:</strong> ${escalationTime}</li>
    </ul>
    <p>Пожалуйста, подключитесь к диалогу для оказания помощи пользователю.</p>
    <p>Ссылка на сессию (требуется реализовать в админ-панели): <code>/admin/chat/${sessionId}</code></p>
  `;

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: toEmail,
        subject: subject,
        html: body,
      },
    });

    if (error) {
      throw new Error(`Error calling Supabase Function: ${error.message}`);
    }

    console.log(`[EmailService] Уведомление об эскалации для сессии ${sessionId} успешно отправлено.`, data);

  } catch (error) {
    console.error(`[EmailService] Не удалось отправить уведомление для сессии ${sessionId}:`, error);
    // Здесь можно добавить дополнительную логику обработки ошибок, например, повторную попытку
  }
}; 