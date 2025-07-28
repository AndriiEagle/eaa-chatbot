import { Request, Response } from 'express';

/**
 * Проверка состояния сервера
 */
export const healthController = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
};
