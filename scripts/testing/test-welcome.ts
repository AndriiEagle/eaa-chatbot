import { welcomeController } from './src/controllers/welcomeController.js';

// Mock objects for Request and Response
const mockReq: any = { params: { userId: 'demoUser' } };
const mockRes: any = {
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: any) {
    console.log('--- welcomeController response ---');
    console.log('HTTP', this.statusCode);
    console.dir(payload, { depth: null });
  }
};

await welcomeController(mockReq, mockRes); 