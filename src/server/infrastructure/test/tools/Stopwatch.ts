// Usage:
//
//     import stopwatch from '@/server/infrastructure/test/tools/Stopwatch';
//
//     stopwatch.start('init');
//     for (...) {
//       stopwatch.start('in loop');
//       stopwatch.time('in loop');
//     }
//     stopwatch.time('init');
//
//     stopwatch.logAll();
//
// Voir aussi : les tests unitaires de la classe pour les comportements spécifiques.

export interface Logger {
  log(param: any): void
}

export interface Clock {
  now(): number
}

export class Stopwatch {
  private startTimes = new Map();

  private times = new Map();

  private labels: string[] = [];

  constructor(private readonly logger: Logger, private readonly clock: Clock) {}

  start(label: string): void {
    this.startTimes.set(label, this.clock.now());
    if (!this.times.has(label)) {
      this.times.set(label, 0);
      this.labels.push(label);
    }
  }

  time(label: string): void {
    if (!this.times.has(label)) {
      throw new Error(`Error: attempt to time ${label} (not started).`);
    }
    const measure = this.clock.now() - this.startTimes.get(label);
    const sum = this.times.get(label);
    this.times.set(label, sum + measure);
  }

  log(label: string): void {
    const measure = this.times.has(label) ? this.times.get(label) : null;
    this.logger.log(`⌚ Time for label "${label}": ${measure} ⌚`);
  }

  logAll(): void {
    for (const label of this.labels) {
      this.log(label);
    }
  }
}

let stopwatch: Stopwatch | null = null;

function getInstance(): Stopwatch {
  if (!stopwatch) {
    stopwatch = new Stopwatch(console, Date);
  }
  return stopwatch;
}

const moduleInterface = {
  start(label: string): void {
    getInstance().start(label);
  },
  time(label: string): void {
    getInstance().time(label);
  },
  log(label: string): void {
    getInstance().log(label);
  },
  logAll(): void {
    getInstance().logAll();
  },
};

export default moduleInterface;
