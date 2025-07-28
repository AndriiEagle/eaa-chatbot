import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env';
import { chatMemory } from './utils/memory/index.js';
import { supabase } from './services/supabaseService.js';
import { openai } from './services/openaiService.js';
import { createServer } from 'http';
import apiRoutes from './routes/apiRoutes.js'; // Импортируем наши маршруты

// Инициализируем менеджер памяти чата
chatMemory.initialize(supabase, openai);

const app = express();
const DEFAULT_PORT = 3000;
const PORT = parseInt(env.PORT || DEFAULT_PORT.toString(), 10);
const BACKUP_PORTS = [3001, 3002, 3003, 3004, 3005];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildPath = path.join(__dirname, 'client');
app.use(express.static(clientBuildPath));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Используем единый файл для всех API маршрутов
app.use('/api/v1', apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Маршрут ${req.method} ${req.url} не существует.`,
  });
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Произошла внутренняя ошибка сервера',
  });
});

const startServer = (port: number) => {
  const server = createServer(app);

  return new Promise<number>((resolve, reject) => {
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(
          `⚠️ Порт ${port} уже используется, попробуем другой порт...`
        );
        resolve(-1);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      console.log(`🚀 Сервер запущен на порту ${port}`);
      resolve(port);
    });
  });
};

const startServerWithFallback = async () => {
  try {
    let usedPort = await startServer(PORT);
    if (usedPort === -1) {
      for (const backupPort of BACKUP_PORTS) {
        usedPort = await startServer(backupPort);
        if (usedPort !== -1) break;
      }
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServerWithFallback();
