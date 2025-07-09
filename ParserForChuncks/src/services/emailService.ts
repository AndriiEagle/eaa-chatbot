import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';
import { supabase } from './supabaseService.js';

interface EscalationDetails {
  sessionId: string;
  messageCount: number;
  escalationTime: string;
}

/**
 * Creates SMTP transport for email delivery
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

/**
 * Sends escalation email notification directly via SMTP
 * @param details - Escalation details
 */
export const sendEscalationEmail = async (details: EscalationDetails): Promise<void> => {
  const { sessionId, messageCount, escalationTime } = details;

  // Recipient email address
  const toEmail = process.env.ESCALATION_EMAIL_RECIPIENT || 'andriipokrovskyi@gmail.com';
  const subject = `🚨 User Frustration Alert - Specialist Intervention Required: ${sessionId}`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600;">⚠️ Escalation Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">EAA ChatBot - User Support Required</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px; border-radius: 0 4px 4px 0;">
          <h2 style="color: #856404; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">🎯 Action Required</h2>
          <p style="margin: 0; color: #856404; font-size: 16px;">
            A user session has been automatically escalated due to detected high frustration levels. 
            <strong>Please connect to the chat to provide assistance.</strong>
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📊 Session Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6c757d; font-weight: 600; width: 40%;">Session ID:</td>
              <td style="padding: 8px 0; color: #495057; font-family: 'Courier New', monospace; font-size: 14px;">${sessionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Message Count:</td>
              <td style="padding: 8px 0; color: #495057;">${messageCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6c757d; font-weight: 600;">Escalation Time:</td>
              <td style="padding: 8px 0; color: #495057;">${escalationTime}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <h3 style="color: #0c5aa6; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Recommended Actions</h3>
          <ul style="color: #495057; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
            <li>Review the conversation history to understand the user's concerns</li>
            <li>Provide personalized assistance and clarification</li>
            <li>Escalate to appropriate team members if specialized knowledge is required</li>
            <li>Document the resolution for future reference</li>
          </ul>
        </div>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #6c757d; font-size: 14px;">
          This is an automated notification from the EAA ChatBot AI Frustration Detection System.
        </p>
        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">
          Generated on ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
        </p>
      </div>
    </div>
  `;

  try {
    // Try Supabase Edge Functions first
    try {
      console.log('📤 [EmailService] Attempting to send via Supabase Edge Functions...');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: toEmail,
          subject: subject,
          html: htmlBody,
        },
      });

      if (error) {
        throw new Error(`Supabase Function error: ${error.message}`);
      }

      console.log(`✅ [EmailService] Email sent successfully via Supabase: ${sessionId}`);
      return;

    } catch (supabaseError) {
      console.log('⚠️ [EmailService] Supabase Edge Functions unavailable, falling back to SMTP...');
      
      // Fallback to direct SMTP delivery
      const transporter = createEmailTransporter();
      
      const mailOptions = {
        from: `EAA ChatBot Support <${process.env.SMTP_USER || 'your-email@gmail.com'}>`,
        to: toEmail,
        subject: subject,
        html: htmlBody,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [EmailService] Email sent successfully via SMTP: ${info.messageId}`);
    }

  } catch (error) {
    console.error(`❌ [EmailService] Failed to send email for session ${sessionId}:`, error);
    
    // Save error to database for tracking
    try {
      await supabase
        .from('email_errors')
        .insert({
          session_id: sessionId,
          error_message: error instanceof Error ? error.message : String(error),
          error_type: 'email_send_failure',
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('❌ [EmailService] Failed to save error to database:', dbError);
    }
  }
};