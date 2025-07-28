export function createTimer(name?: string) {
  const start = Date.now();
  return {
    end: () => Date.now() - start,
    stop: () => Date.now() - start,
    get duration() { return Date.now() - start; },
    log: (message?: string) => console.log(`Timer ${name || 'default'}: ${Date.now() - start}ms ${message || ''}`)
  };
} 