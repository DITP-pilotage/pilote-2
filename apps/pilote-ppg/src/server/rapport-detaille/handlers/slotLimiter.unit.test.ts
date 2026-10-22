import { createSlotLimiter } from "@/server/rapport-detaille/handlers/slotLimiter";

describe("createSlotLimiter", () => {
  it("refuse une place quand toutes sont occupées, puis la rend une fois libérée", () => {
    const slots = createSlotLimiter(2);

    const releases = [slots.tryAcquire(), slots.tryAcquire()];
    const refused = slots.tryAcquire();
    releases[0]?.();
    const afterRelease = slots.tryAcquire();

    expect(refused).toBeNull();
    expect(afterRelease).toBeInstanceOf(Function);
  });

  it("ne rend qu'une place même si la libération est appelée deux fois", () => {
    const slots = createSlotLimiter(2);

    const release = slots.tryAcquire();
    slots.tryAcquire();
    release?.();
    release?.();
    const attempts = [slots.tryAcquire(), slots.tryAcquire()];

    expect(attempts.map((attempt) => attempt !== null)).toEqual([true, false]);
  });
});
