export class QueueFullError extends Error {
  constructor() {
    super("La file d'attente est pleine");
  }
}

export function createSerialQueue(maxPending: number) {
  let tail: Promise<unknown> = Promise.resolve();
  let queued = 0;

  return function enqueue<Result>(job: () => Promise<Result>): Promise<Result> {
    if (queued > maxPending) return Promise.reject(new QueueFullError());
    queued += 1;
    const run = tail
      .catch(() => undefined)
      .then(job)
      .finally(() => {
        queued -= 1;
      });
    tail = run;
    return run;
  };
}
