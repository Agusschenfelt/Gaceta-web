import { Segment } from "../atoms/Segment.jsx";

function segmentState(attempt, index, stageIndex, isPlaying) {
  if (attempt) {
    if (attempt.type === "skip") return "skip";
    return attempt.correct ? "correct" : "wrong";
  }
  if (isPlaying && index === stageIndex) return "current";
  return "unused";
}

export function StageProgress({ stages, attempts, stageIndex, isPlaying }) {
  return (
    <div
      className="flex w-full gap-1"
      role="progressbar"
      aria-label="Intentos"
      aria-valuemin={0}
      aria-valuemax={stages.length}
      aria-valuenow={attempts.length}
    >
      {stages.map((_, i) => (
        <Segment key={i} state={segmentState(attempts[i], i, stageIndex, isPlaying)} />
      ))}
    </div>
  );
}
