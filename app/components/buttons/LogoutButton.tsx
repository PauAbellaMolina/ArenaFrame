"use client";

export default function LogoutButton({
  setArenaAccessToken,
}: {
  setArenaAccessToken: (token: string | null) => void;
}) {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("arena-access-token");
        localStorage.removeItem("selected-user");
        setArenaAccessToken(null);
      }}
      className="fixed right-4 z-10 bottom-4 shadow-sm sm:top-4 sm:bottom-auto transition-all text-sm focus:outline-none focus:ring-0 backdrop-blur-xl rounded-xl px-2.5 py-2 dark:bg-zinc-800/70 bg-zinc-300/70 hover:bg-zinc-300 dark:hover:bg-zinc-800 dark:text-zinc-400 text-zinc-600"
    >
      Logout
    </button>
  );
}
