"use client";
import { useEffect, useRef, useState } from "react";
import {
  fetchSearchChannels,
  fetchSearchUsers,
  fetchUserChannels,
} from "../queries";
import { ArenaChannel, ArenaUser } from "../types";

export default function ControlsBar({
  propagateSelectedChannel,
}: {
  propagateSelectedChannel: (channel: ArenaChannel) => void;
}) {
  const [input, setInput] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [users, setUsers] = useState<ArenaUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [channels, setChannels] = useState<ArenaChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  const [selectedUser, setSelectedUser] = useState<ArenaUser | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ArenaChannel | null>(
    null
  );
  const [selectedUserChannels, setSelectedUserChannels] = useState<
    ArenaChannel[] | null
  >(null);
  const [selectedUserChannelsLoading, setSelectedUserChannelsLoading] =
    useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("selected-user");
    const storedChannel = localStorage.getItem("selected-channel");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as {
          id: number;
          full_name: string;
        };
        fetchSearchUsers(parsed.full_name)
          .then(async (res) => {
            if (!res.ok) throw new Error(`Search failed: ${res.status}`);
            return res.json();
          })
          .then((data) => {
            const list: ArenaUser[] = Array.isArray(data?.users)
              ? data.users
              : [];
            setUsers(list);
            setSelectedUser(list.find((user) => user.id === parsed.id) || null);
          });
      } catch {
        localStorage.removeItem("selected-user");
      }
    }
    if (storedChannel) {
      try {
        const parsed = JSON.parse(storedChannel) as {
          id: number;
          title: string;
          slug: string;
          follower_count: number;
        };
        setSelectedChannel(parsed);
        propagateSelectedChannel(parsed);

        fetchSearchChannels(parsed.title)
          .then(async (res) => {
            if (!res.ok) {
              return;
            }
            return res.json();
          })
          .then((data) => {
            const list: ArenaChannel[] = Array.isArray(data?.channels)
              ? data.channels
              : [];
            setChannels(list);
          });
      } catch {
        localStorage.removeItem("selected-channel");
      }
    }
  }, []);

  useEffect(() => {
    setSelectedUser(null);
    setSelectedUserChannels(null);
    if (!input.trim()) {
      setUsers([]);
      setChannels([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const term = input.trim();
      if (!term) return;
      setLoadingUsers(true);
      setLoadingChannels(true);

      try {
        const resUsers = await fetchSearchUsers(term);
        const resChannels = await fetchSearchChannels(term);
        if (resUsers.ok) {
          const data = await resUsers.json();
          const list: ArenaUser[] = Array.isArray(data?.users)
            ? data.users
            : [];
          setUsers(list);
        }
        if (resChannels.ok) {
          const data = await resChannels.json();
          const list: ArenaChannel[] = Array.isArray(data?.channels)
            ? data.channels
            : [];
          setChannels(list);
        }
      } catch {
        setUsers([]);
        setChannels([]);
      } finally {
        setLoadingUsers(false);
        setLoadingChannels(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [input]);

  useEffect(() => {
    if (selectedUser) {
      setSelectedUserChannelsLoading(true);
      fetchUserChannels(selectedUser.id)
        .then(async (res) => {
          if (!res.ok) {
            setSelectedUserChannels([]);
            setSelectedUserChannelsLoading(false);
            return;
          }
          return res.json();
        })
        .then((data) => {
          const list: ArenaChannel[] = Array.isArray(data?.channels)
            ? data.channels
            : [];
          setSelectedUserChannels(list);
          setSelectedUserChannelsLoading(false);
        });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!isFocused) return;

    const handleGlobalMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideInput = inputRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);

      // If click is outside both, close
      if (!clickedInsideInput && !clickedInsideDropdown) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleGlobalMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleGlobalMouseDown);
    };
  }, [isFocused]);

  const handleSelectUser = (user: ArenaUser) => {
    setSelectedUser(user);
    const payload = {
      id: user.id,
      full_name: user.full_name,
    };
    localStorage.setItem("selected-user", JSON.stringify(payload));
  };

  const handleSelectChannel = (channel: ArenaChannel) => {
    setSelectedChannel(channel);
    setIsFocused(false);
    const payload = {
      id: channel.id,
      title: channel.title,
      slug: channel.slug,
      follower_count: channel.follower_count,
    };
    localStorage.setItem("selected-channel", JSON.stringify(payload));
    if (!selectedUser) {
      localStorage.removeItem("selected-user");
    }
    propagateSelectedChannel(channel);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a user or channel"
        className="w-80 border-0 text-sm dark:text-zinc-300 font-medium placeholder:text-zinc-500 text-zinc-600 focus:outline-none focus:ring-0 dark:placeholder:text-zinc-600 backdrop-blur-xl rounded-xl px-2.5 min-h-9.5 dark:bg-zinc-800/70 bg-zinc-300/70 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-800"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setIsFocused(true)}
      />
      {isFocused &&
        (loadingUsers ||
          loadingChannels ||
          channels.length > 0 ||
          users.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute top-11 left-0 z-20 w-max min-w-80 backdrop-blur-xl rounded-2xl p-2 dark:bg-zinc-800/70 bg-zinc-300/70 max-w-[calc(100dvw-2rem)]"
          >
            {loadingUsers || loadingChannels ? (
              <div className="text-xs w-full py-2.5 px-2 h-full flex items-center text-zinc-500 dark:text-zinc-400">
                Loading...
              </div>
            ) : (
              <div className="flex gap-2 max-w-[calc(100dvw-2rem)] sm:flex-nowrap flex-wrap">
                {users.length > 0 && (
                  <div className="flex flex-col gap-1 min-w-64 w-full">
                    <span className="text-xs px-2 text-zinc-500 dark:text-zinc-400">
                      Users
                    </span>
                    <ul className="sm:max-h-80 max-h-36 overflow-auto w-full">
                      {users.map((user, index) => (
                        <li
                          key={user.id}
                          className={`cursor-pointer text-sm text-zinc-700 rounded-lg px-2 py-1 flex items-center transition-all dark:text-zinc-100 min-h-11 ${
                            selectedUser?.id === user.id
                              ? "bg-zinc-800/12 dark:bg-zinc-200/25"
                              : "hover:bg-zinc-800/15 dark:hover:dark:bg-white/10"
                          } ${index != users.length - 1 ? "mb-0.5" : ""}`}
                          onClick={() => {
                            if (selectedUser?.id === user.id) {
                              setSelectedUser(null);
                              setSelectedUserChannels(null);
                              return;
                            }
                            handleSelectUser(user);
                          }}
                        >
                          <div className="font-medium">
                            {user.full_name || user.username}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedUserChannelsLoading ? (
                  <div className="text-xs min-w-64 px-2 text-zinc-500 dark:text-zinc-400">
                    Loading{" "}
                    <span className="italic">{selectedUser?.full_name}</span>{" "}
                    channels...
                  </div>
                ) : !selectedUser && channels.length > 0 ? (
                  <div className="flex flex-col gap-1 min-w-64 w-full">
                    <span className="text-xs px-2 text-zinc-500 dark:text-zinc-400">
                      Channels
                    </span>
                    <ul className="sm:max-h-80 max-h-46 overflow-auto w-full">
                      {channels.map((channel, index) => (
                        <li
                          key={channel.id}
                          className={`cursor-pointer text-sm rounded-lg text-zinc-700 px-2 py-1 transition-all dark:text-zinc-100 min-h-10 ${
                            selectedChannel?.id === channel.id
                              ? "bg-zinc-800/12 dark:bg-zinc-200/25"
                              : "hover:bg-zinc-800/15 dark:hover:dark:bg-white/10"
                          } ${index != channels.length - 1 ? "mb-0.5" : ""}`}
                          onClick={() => {
                            handleSelectChannel(channel);
                          }}
                        >
                          <div className="font-medium">{channel.title}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-200">
                            {channel.length} blocks{" "}
                            {channel.follower_count > 0
                              ? `· ${channel.follower_count} followers`
                              : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : selectedUser &&
                  selectedUserChannels &&
                  selectedUserChannels.length > 0 ? (
                  <div className="flex flex-col gap-1 min-w-64 w-full">
                    <span className="text-xs px-2 text-zinc-500 dark:text-zinc-400">
                      {selectedUser.full_name}'s Channels
                    </span>
                    <ul className="sm:max-h-80 max-h-46 overflow-auto w-full">
                      {selectedUserChannels.map((channel, index) => (
                        <li
                          key={channel.id}
                          className={`cursor-pointer text-sm rounded-lg text-zinc-700 px-2 py-1 transition-all dark:text-zinc-100 min-h-10 ${
                            selectedChannel?.id === channel.id
                              ? "bg-zinc-800/12 dark:bg-zinc-200/25"
                              : "hover:bg-zinc-800/15 dark:hover:dark:bg-white/10"
                          } ${
                            index != selectedUserChannels.length - 1
                              ? "mb-0.5"
                              : ""
                          }`}
                          onClick={() => {
                            handleSelectChannel(channel);
                          }}
                        >
                          <div className="font-medium">{channel.title}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-200">
                            {channel.length} blocks{" "}
                            {channel.follower_count > 0
                              ? `· ${channel.follower_count} followers`
                              : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  selectedUser && (
                    <div className="text-xs px-2 min-w-64 text-zinc-500 dark:text-zinc-400">
                      <span className="italic">{selectedUser.full_name}</span>{" "}
                      has no public channels
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
