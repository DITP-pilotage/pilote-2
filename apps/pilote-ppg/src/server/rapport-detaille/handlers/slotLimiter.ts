export type SlotLimiter = {
  tryAcquire: () => (() => void) | null;
};

export function createSlotLimiter(maxSlots: number): SlotLimiter {
  let used = 0;
  return {
    tryAcquire: () => {
      if (used >= maxSlots) return null;
      used += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        used -= 1;
      };
    },
  };
}
