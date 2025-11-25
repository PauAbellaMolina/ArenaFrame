// app/page.tsx

"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Authorize from "./components/Authorize";
import UserAndChannels from "./components/UserAndChannels";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [arenaCode, setArenaCode] = useState<string | null>(null);
  const [arenaAccessToken, setArenaAccessToken] = useState<string | null>(null);

  useEffect(() => {
    setArenaCode(localStorage.getItem("arena-code"));
    setArenaAccessToken(localStorage.getItem("arena-access-token"));
  }, []);

  const queryCode = searchParams.get("code");

  useEffect(() => {
    if (!queryCode) return;
    localStorage.setItem("arena-code", queryCode);
    setArenaCode(queryCode);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("code");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [queryCode, router, searchParams]);

  const handleAuthorize = () => {
    window.location.href = `http://dev.are.na/oauth/authorize?client_id=R3oIzf4T7k1DRpOhrh38wbhSnAdAGwvMqrAEOKss_2k&redirect_uri=${window.location.origin}&response_type=code`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {arenaAccessToken && (
        <button
          onClick={() => {
            localStorage.removeItem("arena-access-token");
            localStorage.removeItem("selected-user");
            setArenaAccessToken(null);
          }}
          className="fixed right-4 top-4 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Logout
        </button>
      )}

      {!arenaAccessToken && !arenaCode && (
        <div className="flex min-h-screen items-center justify-center">
          <button
            onClick={handleAuthorize}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Authorize
          </button>
        </div>
      )}

      {arenaCode && !arenaAccessToken && (
        <div className="flex min-h-screen items-center justify-center">
          <Authorize
            onSuccess={(token) => {
              setArenaAccessToken(token);
              setArenaCode(null);
            }}
            onFailure={() => {
              setArenaAccessToken(null);
              setArenaCode(null);
            }}
          />
        </div>
      )}

      {arenaAccessToken && (
        <div className="pt-14">
          <UserAndChannels accessToken={arenaAccessToken} />
        </div>
      )}
    </div>
  );
}
