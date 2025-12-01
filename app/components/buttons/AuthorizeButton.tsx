"use client";

export default function AuthorizeButton({
  handleAuthorize,
}: {
  handleAuthorize: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={handleAuthorize}
        className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-2 text-md shadow-sm hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
      >
        Login with Are.na
      </button>
    </div>
  );
}
