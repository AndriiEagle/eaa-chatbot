import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { chatMemory } from './utils/memory/index.js';
import { supabase } from './services/supabaseService.js';
import { openai } from './services/openaiService.js';
import { createServer } from 'http';
import apiRoutes from './routes/apiRoutes.js'; // Импортируем наши маршруты

const app = express();

// Инициализируем менеджер памяти чата (ленивая инициализация)
let isMemoryInitialized = false;
const initializeMemoryOnce = async () => {
  if (!isMemoryInitialized) {
    try {
      await chatMemory.initialize(supabase, openai);
      isMemoryInitialized = true;
      console.log('✅ ChatMemory initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ChatMemory:', error);
      throw error;
    }
  }
};

// Middleware для инициализации памяти при первом запросе
app.use(async (req, res, next) => {
  try {
    await initializeMemoryOnce();
    next();
  } catch (error) {
    console.error('Memory initialization failed:', error);
    res.status(500).json({ error: 'Service initialization failed' });
  }
});
const DEFAULT_PORT = 3000;
const PORT = parseInt(env.PORT || DEFAULT_PORT.toString(), 10);
const BACKUP_PORTS = [3001, 3002, 3003, 3004, 3005];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Статические файлы только для локальной разработки
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const clientBuildPath = path.join(__dirname, 'client');
  app.use(express.static(clientBuildPath));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Простой health check без зависимостей
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    memoryInitialized: isMemoryInitialized 
  });
});

// Используем единый файл для всех API маршрутов
app.use('/api/v1', apiRoutes);

// Catch-all для SPA маршрутизации (только в development)
app.get('*', (req, res) => {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const clientBuildPath = path.join(__dirname, 'client');
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({
      error: 'Not Found',
      message: 'This is an API-only deployment. Frontend not included.',
    });
  }
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

// Запуск сервера только в локальной среде
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
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
}

export default app;
