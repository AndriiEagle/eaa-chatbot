/**
 * Mock for PerformanceMonitor
 * This is a placeholder to allow the project to compile.
 * Replace with actual implementation if needed.
 *
 * Это временная заглушка для PerformanceMonitor, чтобы проект мог быть
 * скомпилирован. Замените ее реальной реализацией при необходимости.
 */
export class PerformanceMonitor {
    recordVoiceProcessing(result, time) {
        console.log(`[PerformanceMonitor] Voice processing took ${time.toFixed(2)}ms.`);
    }
    recordError(type, error) {
        console.error(`[PerformanceMonitor] Error during ${type}:`, error);
    }
}
