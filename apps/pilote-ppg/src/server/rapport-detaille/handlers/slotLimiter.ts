export type SlotLimiter = {
  tryAcquire: () => boolean;
  release: () => void;
};

export function createSlotLimiter(maxSlots: number): SlotLimiter {
  let used = 0;
  return {
    tryAcquire: () => {
      if (used >= maxSlots) return false;
      used += 1;
      return true;
    },
    release: () => {
      used = Math.max(0, used - 1);
    },
  };
}
