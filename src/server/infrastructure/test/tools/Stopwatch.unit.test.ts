/* eslint-disable sonarjs/no-duplicate-string */
import { Stopwatch } from './Stopwatch';

function fakeLogger(logs: string[]) {
  return ({
    log: (s: string) => {logs.push(s);},
  });
}

function fakeClock(delta: number) {
  let n = 0;
  return ({
    now: () => {
      const result = delta * n;
      n += 1;
      return result;
    },
  });
}

describe('Stopwatch', () => {
  it('tracks one label', () => {
    // GIVEN
    const logs: string[] = [];
    const stopwatch = new Stopwatch(fakeLogger(logs), fakeClock(10));

    // WHEN
    stopwatch.start('one');
    stopwatch.time('one');

    stopwatch.log('one');

    // THEN
    expect(logs).toStrictEqual(['⌚ Time for label "one": 10 ⌚']);
  });

  it('tracks two nested labels', () => {
    // GIVEN
    const logs: string[] = [];
    const stopwatch = new Stopwatch(fakeLogger(logs), fakeClock(10));

    // WHEN
    stopwatch.start('one');
    stopwatch.start('two');
    stopwatch.time('two');
    stopwatch.time('one');

    stopwatch.log('one');
    stopwatch.log('two');

    // THEN
    expect(logs).toStrictEqual([
      '⌚ Time for label "one": 30 ⌚',
      '⌚ Time for label "two": 10 ⌚',
    ]);
  });

  it('logs all labels', () => {
    // GIVEN
    const logs: string[] = [];
    const stopwatch = new Stopwatch(fakeLogger(logs), fakeClock(10));

    // WHEN
    stopwatch.start('one');
    stopwatch.start('two');
    stopwatch.time('two');
    stopwatch.time('one');

    stopwatch.logAll();

    // THEN
    expect(logs).toStrictEqual([
      '⌚ Time for label "one": 30 ⌚',
      '⌚ Time for label "two": 10 ⌚',
    ]);
  });

  it('tracking labels can be intertwined', () => {
    // GIVEN
    const logs: string[] = [];
    const stopwatch = new Stopwatch(fakeLogger(logs), fakeClock(10));

    // WHEN
    stopwatch.start('one');
    stopwatch.time('one');

    stopwatch.start('two');
    stopwatch.time('two');

    stopwatch.start('one');
    stopwatch.time('one');

    stopwatch.logAll();

    // THEN
    expect(logs).toStrictEqual([
      '⌚ Time for label "one": 20 ⌚',
      '⌚ Time for label "two": 10 ⌚',
    ]);
  });
});
