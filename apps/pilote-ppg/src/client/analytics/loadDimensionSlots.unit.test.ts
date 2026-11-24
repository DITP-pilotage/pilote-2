import { createMutedAnalytics } from "@/client/analytics/browser";
import { loadDimensionSlots } from "@/client/analytics/loadDimensionSlots";

const setup = () => ({
  ...createMutedAnalytics("disabled"),
  status: { active: true } as const,
  setDimensionSlots: vi.fn(),
});

describe("loadDimensionSlots", () => {
  it("donne la correspondance lue à l'analytics", async () => {
    const analytics = setup();

    await loadDimensionSlots(analytics, async () => ({ profil_pilote: 1 }));

    expect(analytics.setDimensionSlots.mock.calls).toEqual([
      [{ profil_pilote: 1 }],
    ]);
  });

  it("libère les envois sans dimensions quand la lecture échoue", async () => {
    const analytics = setup();

    await loadDimensionSlots(analytics, () =>
      Promise.reject(new Error("réseau")),
    );

    expect(analytics.setDimensionSlots.mock.calls).toEqual([[{}]]);
  });

  it("ne lit rien quand l'analytics est inactif", async () => {
    const fetchSlots = vi.fn();

    await loadDimensionSlots(createMutedAnalytics("disabled"), fetchSlots);

    expect(fetchSlots).not.toHaveBeenCalled();
  });
});
