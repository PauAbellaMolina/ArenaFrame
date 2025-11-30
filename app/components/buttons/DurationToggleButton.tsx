"use client";
import { useEffect } from "react";

export default function DurationToggleButton({
  readyToPlay,
  visibleDuration,
  setVisibleDuration,
}: {
  readyToPlay: boolean;
  visibleDuration: number;
  setVisibleDuration: (duration: number) => void;
}) {
  const durationRotations = [5000, 10000, 15000, 30000, 60000];

  useEffect(() => {
    const localDuration = localStorage.getItem("duration");
    if (localDuration) {
      setVisibleDuration(parseInt(localDuration));
    }
  }, []);

  return (
    <button
      onClick={() => {
        const nextDuration =
          durationRotations[
            (durationRotations.indexOf(visibleDuration) + 1) %
              durationRotations.length
          ];
        localStorage.setItem("duration", nextDuration.toString());
        setVisibleDuration(nextDuration);
      }}
      className={`text-sm focus:outline-none focus:ring-0 backdrop-blur-xl rounded-xl px-2.5 py-2 dark:bg-zinc-800/70 bg-zinc-300/70 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-800 ${
        readyToPlay
          ? "dark:text-zinc-400 text-zinc-600"
          : "dark:text-zinc-500 text-zinc-400"
      }`}
    >
      {visibleDuration / 1000}s
    </button>
  );
}
