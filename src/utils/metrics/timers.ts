/**
 * Утилиты для измерения времени выполнения операций и сбора метрик
 */

/**
 * Интерфейс для таймера с поддержкой измерения промежутков времени
 */
export interface Timer {
  start: number;
  end: number | null;
  duration: number;
  stop: () => void;
  reset: () => void;
}

/**
 * Создает и возвращает новый таймер с методами для управления
 * @returns {Timer} Объект таймера с методами stop() и reset()
 */
export function createTimer(): Timer {
  const timer: Timer = {
    start: performance.now(),
    end: null,
    duration: 0,
    stop() {
      this.end = performance.now();
      this.duration = Math.round(this.end - this.start);
      return this.duration;
    },
    reset() {
      this.start = performance.now();
      this.end = null;
      this.duration = 0;
    }
  };
  
  return timer;
}

/**
 * Интерфейс для объекта с метриками по времени выполнения
 */
export interface PerformanceMetrics {
  embedding_ms: number;
  search_ms: number;
  generate_ms: number;
  total_ms: number;
}

/**
 * Создает объект метрик производительности на основе таймеров
 * @param options Объект с таймерами для различных операций
 * @returns {PerformanceMetrics} Объект с метриками производительности
 */
export function createPerformanceMetrics(
  options: {
    embedding?: Timer;
    search?: Timer;
    generate?: Timer;
    total: Timer;
  }
): PerformanceMetrics {
  return {
    embedding_ms: options.embedding?.duration || 0,
    search_ms: options.search?.duration || 0,
    generate_ms: options.generate?.duration || 0,
    total_ms: Math.round(performance.now() - options.total.start)
  };
}

/**
 * Форматирует время в миллисекундах в читаемый формат
 * @param ms время в миллисекундах
 * @returns отформатированная строка времени
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(1)}s`;
  }
} 