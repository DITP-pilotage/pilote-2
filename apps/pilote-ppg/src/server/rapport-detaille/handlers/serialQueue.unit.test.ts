import {
  createSerialQueue,
  QueueFullError,
} from "@/server/rapport-detaille/handlers/serialQueue";

function deferred<Value>() {
  let resolve: (value: Value) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<Value>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe("createSerialQueue", () => {
  it("exécute les jobs un par un dans l'ordre d'arrivée", async () => {
    const enqueue = createSerialQueue(5);
    const journal: string[] = [];
    const steps = [1, 2, 3].map(() => deferred<void>());

    const runs = [1, 2, 3].map((jobNumber) =>
      enqueue(async () => {
        journal.push(`start ${jobNumber}`);
        await steps[jobNumber - 1].promise;
        journal.push(`end ${jobNumber}`);
      }),
    );
    steps.forEach((step) => step.resolve());
    await Promise.all(runs);

    expect(journal).toEqual([
      "start 1",
      "end 1",
      "start 2",
      "end 2",
      "start 3",
      "end 3",
    ]);
  });

  it("refuse un job quand la file d'attente est pleine", async () => {
    const enqueue = createSerialQueue(1);
    const running = deferred<void>();
    const thirdJob = vi.fn(async () => {});

    const first = enqueue(() => running.promise);
    const second = enqueue(async () => {});
    const third = enqueue(thirdJob);

    await expect(third).rejects.toBeInstanceOf(QueueFullError);
    running.resolve();
    await Promise.all([first, second]);
    expect(thirdJob).not.toHaveBeenCalled();
  });

  it("accepte de nouveau des jobs une fois la file désengorgée", async () => {
    const enqueue = createSerialQueue(0);
    const running = deferred<void>();

    const first = enqueue(() => running.promise);
    await expect(enqueue(async () => "refusé")).rejects.toBeInstanceOf(
      QueueFullError,
    );
    running.resolve();
    await first;

    await expect(enqueue(async () => "accepté")).resolves.toBe("accepté");
  });

  it("passe au job suivant quand un job échoue", async () => {
    const enqueue = createSerialQueue(5);

    const failing = enqueue(async () => {
      throw new Error("boom");
    });
    const next = enqueue(async () => "ok");

    await expect(failing).rejects.toThrow("boom");
    await expect(next).resolves.toBe("ok");
  });
});
