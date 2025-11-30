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
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Authorize
      </button>
    </div>
  );
}
