/** Returns true when the primary pointer is a coarse device (touch screen). */
export const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
