/**
 * Преобразует строковое представление стилей в объект стилей для React
 * @param styleStr Строка стилей в формате CSS
 * @returns Объект стилей для React
 */
export function strToObj(styleStr: string): Record<string, string> {
  return styleStr.split(';')
    .filter(Boolean)
    .map(style => style.trim())
    .reduce((acc, style) => {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        const camelCaseProperty = property.replace(/-([a-z])/g, g => g[1].toUpperCase());
        acc[camelCaseProperty] = value;
      }
      return acc;
    }, {} as Record<string, string>);
}

/**
 * Форматирует время из миллисекунд в удобочитаемую строку
 * @param ms Время в миллисекундах
 * @returns Отформатированная строка времени
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Выбирает случайный элемент из массива
 * @param arr Массив элементов
 * @returns Случайный элемент из массива
 */
export function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Определяет цвет индикатора релевантности в зависимости от значения
 * @param score Оценка релевантности (от 0 до 1)
 * @returns Цветовой код в формате HEX
 */
export function getRelevanceColor(score: number): string {
  if (score >= 0.85) return '#10b981'; // зеленый
  if (score >= 0.78) return '#f59e0b'; // желтый
  return '#ef4444'; // красный
} 