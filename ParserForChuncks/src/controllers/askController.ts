import { Request, Response } from 'express';
import { AskOrchestrator } from '../services/askOrchestrator/askOrchestrator.js';
import { AskRequest } from '../types/common.js';
import { generateStreamingCompletion } from '../services/openaiService.js';

// Initialize the orchestrator
const askOrchestrator = new AskOrchestrator();

/**
 * 🎯 CLEAN ASK CONTROLLER WITH STREAMING SUPPORT
 * 
 * This is how askController SHOULD look like:
 * - Thin and focused (under 100 lines)
 * - Only handles HTTP concerns
 * - Delegates ALL business logic to AskOrchestrator
 * - Supports both JSON and streaming responses
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
    sessionId, // также принимаем sessionId для совместимости
    user_id = 'anonymous',
    dataset_id = 'eaa',
    similarity_threshold = 0.78,
    max_chunks = 5,
    stream = false
  } = req.body as AskRequest & { stream?: boolean, sessionId?: string };

  // Используем sessionId если session_id не передан
  const finalSessionId = session_id || sessionId;

  // Input validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required and must be a non-empty string.' });
    return;
  }

  console.log(`👤 User ID: ${user_id} | 💬 Session ID: ${finalSessionId || 'new'}`);
  console.log(`❓ Question: ${question}`);
  console.log(`🌊 Stream requested: ${stream}`);
  
  try {
    // 🌊 STREAMING RESPONSE - Server-Sent Events
    if (stream) {
      console.log('🚀 [ASK] Starting streaming response...');
      
      // Set headers for Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      try {
        // Process request through orchestrator to get context and sources
        const result = await askOrchestrator.processRequest({
          question,
          session_id: finalSessionId,
          user_id,
          dataset_id,
          similarity_threshold,
          max_chunks
        });

        // Start streaming the answer
        const messages = [
          { role: 'system' as const, content: 'You are a helpful assistant specialized in European Accessibility Act (EAA) compliance.' },
          { role: 'user' as const, content: `Context: ${result.answer}\n\nQuestion: ${question}\n\nProvide a comprehensive answer based on the context provided.` }
        ];

        const streamResponse = await generateStreamingCompletion(messages);
        
        let fullContent = '';
        
        for await (const chunk of streamResponse) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            
            // Send chunk to client
            res.write(`data: ${JSON.stringify({
              chunk: content,
              type: 'chunk',
              content: fullContent
            })}\n\n`);
          }
        }

        // Send metadata at the end
        res.write(`data: ${JSON.stringify({
          type: 'meta',
          content: {
            sources: result.sources,
            suggestions: result.suggestions,
            suggestions_header: result.suggestions_header,
            session_id: result.session_id,
            query_id: result.query_id,
            performance: result.performance
          }
        })}\n\n`);

        // Send completion signal
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();

        console.log('✅ [ASK] Streaming response completed');

      } catch (streamError) {
        console.error('❌ [ASK] Error in streaming:', streamError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          content: 'Error occurred during streaming response'
        })}\n\n`);
        res.end();
      }
      
      return;
    }

    // 📝 REGULAR JSON RESPONSE
    console.log('📋 [ASK] Processing regular JSON response...');
    
    // Process request through orchestrator - this is where ALL the magic happens
    const result = await askOrchestrator.processRequest({
      question,
      session_id: finalSessionId,
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