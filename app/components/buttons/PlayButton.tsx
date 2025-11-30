"use client";
export default function PlayButton({
  readyToPlay,
  propagateOnPlay,
}: {
  readyToPlay: boolean;
  propagateOnPlay: () => void;
}) {
  return (
    <button
      onClick={propagateOnPlay}
      className={`w-9.5 h-9.5 text-sm focus:outline-none focus:ring-0 backdrop-blur-xl rounded-xl pl-[12px] py-2 dark:bg-zinc-800/70 bg-zinc-300/70 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-800 ${
        readyToPlay
          ? "dark:fill-zinc-300 fill-zinc-500"
          : "dark:fill-zinc-500 fill-zinc-400"
      }`}
    >
      <svg
        width="15"
        height="17"
        viewBox="0 0 15 17"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.656 0.833896C1.56491 0.779885 1.46114 0.750948 1.35524 0.750023C1.24934 0.749098 1.14508 0.776219 1.05306 0.82863C0.961036 0.881041 0.884524 0.956875 0.831295 1.04843C0.778067 1.13998 0.750018 1.24399 0.75 1.3499V15.2439C0.750018 15.3498 0.778067 15.4538 0.831295 15.5454C0.884524 15.6369 0.961036 15.7127 1.05306 15.7652C1.14508 15.8176 1.24934 15.8447 1.35524 15.8438C1.46114 15.8428 1.56491 15.8139 1.656 15.7599L13.379 8.81289C13.4685 8.75977 13.5427 8.68426 13.5942 8.59379C13.6457 8.50332 13.6728 8.401 13.6728 8.2969C13.6728 8.19279 13.6457 8.09047 13.5942 8C13.5427 7.90953 13.4685 7.83402 13.379 7.7809L1.656 0.833896Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
