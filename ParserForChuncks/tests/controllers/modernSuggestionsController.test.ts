import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  generateModernSuggestions, 
  generateFallbackSuggestions, 
  checkSuggestionsHealth 
} from '../../src/controllers/modernSuggestionsController';

/**
 * 🧪 MODERN CONTROLLER TESTS
 * 
 * ✅ Tests HTTP layer properly
 * ✅ Validates request/response handling
 * ✅ Tests error scenarios
 * ✅ Professional test patterns
 */

describe('Modern Suggestions Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('generateModernSuggestions', () => {
    test('should return 400 for missing userId', async () => {
      mockRequest.body = { sessionId: uuidv4() };
      
      await generateModernSuggestions(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'userId is required and must be non-empty string',
        code: 'MISSING_USER_ID'
      });
    });

    test('should return 400 for missing sessionId', async () => {
      mockRequest.body = { userId: 'test-user' };
      
      await generateModernSuggestions(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'sessionId is required and must be non-empty string',
        code: 'MISSING_SESSION_ID'
      });
    });

    test('should process valid request successfully', async () => {
      mockRequest.body = {
        userId: 'test-user',
        sessionId: uuidv4(),
        currentQuestion: 'How do I implement EAA compliance?'
      };
      
      await generateModernSuggestions(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.clarificationQuestions).toBeDefined();
      expect(responseData.performance).toBeDefined();
    });
  });

  describe('generateFallbackSuggestions', () => {
    test('should return fallback suggestions', async () => {
      mockRequest.body = {
        userId: 'test-user',
        sessionId: uuidv4(),
      };
      
      await generateFallbackSuggestions(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.clarificationQuestions).toBeDefined();
      expect(responseData.generated_by).toBe('fallback_system_v1');
    });
  });

  describe('checkSuggestionsHealth', () => {
    test('should return health status', async () => {
      await checkSuggestionsHealth(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalled();
      
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.status).toBeDefined();
      expect(responseData.service).toBe('modern_suggestions_controller');
    });
  });
}); 