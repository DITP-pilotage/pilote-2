import { createSlotLimiter } from "@/server/rapport-detaille/handlers/slotLimiter";

describe("createSlotLimiter", () => {
  it("refuse une place quand toutes sont occupées, puis la rend une fois libérée", () => {
    const slots = createSlotLimiter(2);

    const attempts = [
      slots.tryAcquire(),
      slots.tryAcquire(),
      slots.tryAcquire(),
    ];
    slots.release();
    const afterRelease = slots.tryAcquire();

    expect(attempts).toEqual([true, true, false]);
    expect(afterRelease).toBe(true);
  });
});
