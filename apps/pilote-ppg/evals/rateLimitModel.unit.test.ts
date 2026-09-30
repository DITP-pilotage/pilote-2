import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rateLimitModel";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("laisse passer les requêtes tant que le quota de la minute n'est pas atteint", async () => {
    const attendreSonTour = createRateLimiter({ requetesParMinute: 2 });
    const passees: number[] = [];

    void attendreSonTour().then(() => passees.push(1));
    void attendreSonTour().then(() => passees.push(2));
    await vi.advanceTimersByTimeAsync(0);

    expect(passees).toEqual([1, 2]);
  });

  it("fait attendre la requête en trop jusqu'à ce que la plus ancienne sorte de la fenêtre", async () => {
    const attendreSonTour = createRateLimiter({ requetesParMinute: 2 });
    const passees: number[] = [];

    void attendreSonTour().then(() => passees.push(1));
    void attendreSonTour().then(() => passees.push(2));
    void attendreSonTour().then(() => passees.push(3));

    await vi.advanceTimersByTimeAsync(59_999);
    expect(passees).toEqual([1, 2]);

    await vi.advanceTimersByTimeAsync(1);
    expect(passees).toEqual([1, 2, 3]);
  });
});
