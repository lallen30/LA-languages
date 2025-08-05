/**
 * Utility functions for array manipulation
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random items from array
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Insert item at random position in array
 */
export function insertAtRandomPosition<T>(array: T[], item: T, minIndex: number = 0, maxIndex?: number): T[] {
  const result = [...array];
  const max = maxIndex !== undefined ? Math.min(maxIndex, array.length) : array.length;
  const index = Math.floor(Math.random() * (max - minIndex + 1)) + minIndex;
  result.splice(index, 0, item);
  return result;
}
