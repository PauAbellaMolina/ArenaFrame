// app/page.tsx

"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ArenaUser } from "./types";

type ArenaChannel = {
  id: number;
  title: string;
  slug: string;
  length?: number;
};

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
    window.location.href =
      "http://dev.are.na/oauth/authorize?client_id=R3oIzf4T7k1DRpOhrh38wbhSnAdAGwvMqrAEOKss_2k&redirect_uri=https://localhost:3000&response_type=code";
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

      <div className="flex min-h-screen items-center justify-center">
        {!arenaAccessToken && !arenaCode && (
          <button
            onClick={handleAuthorize}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Authorize
          </button>
        )}

        {arenaCode && !arenaAccessToken && (
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
        )}

        {arenaAccessToken && (
          <div className="w-full max-w-3xl px-4 py-10">
            <UserAndChannels accessToken={arenaAccessToken} />
          </div>
        )}
      </div>
    </div>
  );
}

function Authorize({
  onSuccess,
  onFailure,
}: {
  onSuccess: (token: string) => void;
  onFailure: () => void;
}) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const arenaCode = localStorage.getItem("arena-code");
    if (!arenaCode) return;

    fetch("/api/getAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ code: arenaCode }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.access_token)
          throw new Error(data.error || "Token request failed");
        localStorage.setItem("arena-access-token", data.access_token);
        localStorage.removeItem("arena-code");
        onSuccess(data.access_token);
      })
      .catch((e) => {
        localStorage.removeItem("arena-code");
        localStorage.removeItem("arena-access-token");
        onFailure();
        console.error("Error:", e);
      });
  }, [onSuccess, onFailure]);

  return null;
}

function UserAndChannels({ accessToken }: { accessToken: string }) {
  const [users, setUsers] = useState<ArenaUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    full_name: string;
  } | null>(null);

  const [channels, setChannels] = useState<ArenaChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selected-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: number; full_name: string };
        setSelectedUser(parsed);
        fetchChannels(parsed.id);
      } catch {
        localStorage.removeItem("selected-user");
      }
    }
  }, []);

  const searchUsers = () => {
    const term = q.trim();
    if (!term) return;
    setLoadingUsers(true);

    fetch(`/api/searchUsers?q=${encodeURIComponent(term)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: ArenaUser[] = Array.isArray(data?.users) ? data.users : [];
        setUsers(list);
      })
      .catch((err) => {
        console.error(err);
        setUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  };

  const fetchChannels = (userId: number) => {
    setLoadingChannels(true);
    fetch(`/api/getUserChannels?userId=${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Channels failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: ArenaChannel[] = Array.isArray(data?.channels)
          ? data.channels
          : [];
        setChannels(list);
      })
      .catch((err) => {
        console.error(err);
        setChannels([]);
      })
      .finally(() => setLoadingChannels(false));
  };

  const handleSelectUser = (user: ArenaUser) => {
    const payload = { id: user.id, full_name: user.full_name || user.username };
    localStorage.setItem("selected-user", JSON.stringify(payload));
    setSelectedUser(payload);
    fetchChannels(user.id);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Search users
        </h1>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Enter username…"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={searchUsers}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Search
          </button>
        </div>

        {loadingUsers && (
          <div className="text-zinc-600 dark:text-zinc-400">Loading users…</div>
        )}

        {!loadingUsers && users.length === 0 && (
          <div className="text-zinc-600 dark:text-zinc-400">
            No users found.
          </div>
        )}

        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={() => handleSelectUser(user)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {user.initials ||
                  (user.full_name || user.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.full_name || user.username}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.channel_count} channels
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  ID: {user.id}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedUser && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Channels · {selectedUser.full_name}
            </h2>
            <button
              onClick={() => {
                localStorage.removeItem("selected-user");
                setSelectedUser(null);
                setChannels([]);
              }}
              className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
            >
              Clear selection
            </button>
          </div>

          {loadingChannels && (
            <div className="text-zinc-600 dark:text-zinc-400">
              Loading channels…
            </div>
          )}

          {!loadingChannels && channels.length === 0 && (
            <div className="text-zinc-600 dark:text-zinc-400">
              No channels found.
            </div>
          )}

          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-6 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {ch.title}
                    </div>
                    <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {ch.slug}
                    </div>
                  </div>
                </div>
                {typeof ch.length === "number" && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {ch.length} blocks
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
