const WORDS_PER_SECOND = 2.8; // ~168 wpm
const FPS = 30;
export const TAIL_FRAMES = 60; // 2 extra seconds at the end

export function calculateSequenceDuration(text: string) {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).length;
  const durationInSeconds = Math.max(wordCount / WORDS_PER_SECOND, 1.2);
  const frames = Math.round(durationInSeconds * FPS);
  // Cap at 9 seconds (270 frames) and ensure at least 1 second (30 frames)
  return Math.min(Math.max(frames, 30), 270);
}

export function calculateTotalFrames(sequences: Record<string, any>) {
  const contentDuration = Object.values(sequences).reduce((acc: number, text: any) => {
    if (typeof text !== "string") return acc;
    return acc + calculateSequenceDuration(text);
  }, 0);
  return contentDuration + TAIL_FRAMES;
}
