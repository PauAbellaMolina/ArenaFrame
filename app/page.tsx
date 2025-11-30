"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthorizeHandler from "./components/AuthorizeHandler";
import Main from "./components/Main";
import AuthorizeButton from "./components/buttons/AuthorizeButton";
import LogoutButton from "./components/buttons/LogoutButton";

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
        <LogoutButton setArenaAccessToken={setArenaAccessToken} />
      )}

      {!arenaAccessToken && !arenaCode && (
        <AuthorizeButton handleAuthorize={handleAuthorize} />
      )}

      {arenaCode && !arenaAccessToken && (
        <div className="flex min-h-screen items-center justify-center">
          <AuthorizeHandler
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

      {arenaAccessToken && <Main />}
    </div>
  );
}
