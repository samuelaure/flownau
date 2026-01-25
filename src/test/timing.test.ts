import { calculateSequenceDuration, calculateTotalFrames } from '../remotion/core/timing';

import { describe, expect, test } from 'vitest';

describe('Timing Utils', () => {
  test('calculateSequenceDuration returns correct frames for a short text', () => {
    // "Hello world" = 2 words.
    // 2 / 3.6 = 0.55s. Max(0.55, 1) = 1s.
    // 1s * 30 FPS = 30 frames.
    const duration = calculateSequenceDuration('Hello world');
    expect(duration).toBe(30);
  });

  test('calculateSequenceDuration returns correct frames for a long text', () => {
    // 19 words. 19 / 3.6 = 5.277s.
    // 5.277 * 30 = 158.33 -> Math.round -> 158 frames.
    const text =
      'This is a much longer text that has exactly nineteen words to test the duration calculation logic correctly now.';
    const duration = calculateSequenceDuration(text);
    expect(duration).toBe(158);
  });

  test('calculateTotalFrames sums up sequences', () => {
    const sequences = {
      hook: 'Short text', // 1s = 30 frames
      problem: 'This is a bit longer and should be more than one second', // 12 words / 3.6 = 3.33s -> 100 frames
    };
    const total = calculateTotalFrames(sequences);
    expect(total).toBe(30 + 100);
  });
});
