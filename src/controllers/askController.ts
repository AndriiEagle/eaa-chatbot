import { Request, Response } from 'express';
import { AskOrchestrator } from '../services/askOrchestrator/askOrchestrator.js';
import { AskRequest } from '../types/common.js';

// Initialize the orchestrator
const askOrchestrator = new AskOrchestrator();

/**
 * 🎯 CLEAN ASK CONTROLLER
 * 
 * This is how askController SHOULD look like:
 * - Thin and focused (under 50 lines)
 * - Only handles HTTP concerns
 * - Delegates ALL business logic to AskOrchestrator
 * - Clean error handling
 * - Single responsibility: HTTP request/response handling
 */
export const askController = async (req: Request, res: Response): Promise<void> => {
  console.log('\n===========================================================');
  console.log('📝 [ASK] Получен новый запрос:');
  
  // Method validation
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed. Use POST instead.' });
    return;
  }

  // Extract and validate parameters
  const {
    question,
    session_id,
    user_id = 'anonymous',
    dataset_id = 'eaa',
    similarity_threshold = 0.78,
    max_chunks = 5,
    stream = false
  } = req.body as AskRequest & { stream?: boolean };

  // Input validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required and must be a non-empty string.' });
    return;
  }

  console.log(`👤 User ID: ${user_id} | 💬 Session ID: ${session_id || 'new'}`);
  console.log(`❓ Question: ${question}`);
  
  try {
    // Process request through orchestrator - this is where ALL the magic happens
    const result = await askOrchestrator.processRequest({
      question,
      session_id,
      user_id,
      dataset_id,
      similarity_threshold,
      max_chunks
    });
      
    // Return result to client
    res.status(200).json(result);
    console.log('✅ [ASK] Request processed successfully');

  } catch (error: any) {
    console.error('❌ [ASK] Error processing request:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process question',
      query_id: 'error_' + Date.now()
    });
  }
}; 