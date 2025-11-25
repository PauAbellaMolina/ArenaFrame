import { useEffect, useState, useRef, useCallback } from "react";
import { ArenaChannel, ArenaChannelContent, ArenaUser } from "../types";
import { fetchChannelContents, fetchSearchUsers, fetchUserChannels } from "../queries";

type Step = "user" | "channel" | "content";

export default function UserAndChannels({ accessToken }: { accessToken: string }) {
  const [currentStep, setCurrentStep] = useState<Step>("user");
  const [users, setUsers] = useState<ArenaUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [q, setQ] = useState<string>("");
  const [channelSearchQuery, setChannelSearchQuery] = useState<string>("");
  const [focusedInput, setFocusedInput] = useState<"user" | "channel" | null>(null);
  const userInputRef = useRef<HTMLInputElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);
  const [selectedUser, setSelectedUser] = useState<{
    id: number;
    full_name: string;
  } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: number;
    title: string;
    slug: string;
  } | null>(null);

  const [channels, setChannels] = useState<ArenaChannel[]>([]);
  const [contents, setContents] = useState<ArenaChannelContent[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [shuffledImages, setShuffledImages] = useState<ArenaChannelContent[]>([]);
  const [previousImageIndex, setPreviousImageIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleFetchUserChannels = (userId: number) => {
    setLoadingChannels(true);
    fetchUserChannels(userId).then(async (res) => {
      if (!res.ok) throw new Error(`Channels failed: ${res.status}`);
      return res.json();
    }).then((data) => {
        const list: ArenaChannel[] = Array.isArray(data?.channels)
          ? data.channels
          : [];
        setChannels(list);
      })
      .catch(() => {
        setChannels([]);
      })
      .finally(() => setLoadingChannels(false));
  };

  const handleFetchChannelContents = (channelId: number, page: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoadingContents(true);
      setCurrentPage(1);
      setHasMorePages(true);
    }
    
    fetchChannelContents(channelId, page, 52).then(async (res) => {
      if (!res.ok) throw new Error(`Contents failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: ArenaChannelContent[] = Array.isArray(data?.contents)
          ? data.contents
          : [];
        
        if (append) {
          setContents((prev) => [...prev, ...list]);
        } else {
          setContents(list);
        }
        
        // Check if there are more pages based on original response length (before filtering)
        // If we got exactly 5 items, there might be more pages available
        // Note: We check the original list length, not filtered, to determine pagination
        setHasMorePages(list.length === 5);
        setCurrentPage(page);
      })
      .catch(() => {
        if (!append) {
          setContents([]);
        }
      })
      .finally(() => {
        setLoadingContents(false);
        setIsLoadingMore(false);
      });
  };

  const loadNextPage = () => {
    if (!selectedChannel || !hasMorePages || isLoadingMore) return;
    handleFetchChannelContents(selectedChannel.id, currentPage + 1, true);
  };
  
  useEffect(() => {
    const stored = localStorage.getItem("selected-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: number; full_name: string };
        setSelectedUser(parsed);
        setCurrentStep("channel");
        handleFetchUserChannels(parsed.id);
      } catch {
        localStorage.removeItem("selected-user");
      }
    }
    
    const storedChannel = localStorage.getItem("selected-channel");
    if (storedChannel && stored) {
      try {
        const parsed = JSON.parse(storedChannel) as { id: number; title: string; slug: string };
        setSelectedChannel(parsed);
        setCurrentStep("content");
        handleFetchChannelContents(parsed.id);
      } catch {
        localStorage.removeItem("selected-channel");
      }
    }
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const term = q.trim();
      if (!term) return;
      setLoadingUsers(true);

      try {
        const res = await fetchSearchUsers(term);
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        const list: ArenaUser[] = Array.isArray(data?.users) ? data.users : [];
        setUsers(list);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [q]);

  const imagesWithContent = contents
    .filter((content) => content.image)
    .filter((content, index, self) => 
      index === self.findIndex((c) => c.id === content.id)
    );

  // Shuffle images when entering fullscreen
  useEffect(() => {
    if (isPlaying && imagesWithContent.length > 0) {
      const shuffled = [...imagesWithContent].sort(() => Math.random() - 0.5);
      setShuffledImages(shuffled);
      setCurrentImageIndex(0);
      setIsFadingOut(false);
      setIsFadingIn(false);
    }
  }, [isPlaying]);

  // Update shuffled images when new contents are loaded during playback
  // Only add newly filtered items (Link blocks with images) to the slideshow
  useEffect(() => {
    if (isPlaying && imagesWithContent.length > shuffledImages.length) {
      // Get only the new filtered items that weren't in shuffledImages before
      const newImages = imagesWithContent.slice(shuffledImages.length);
      // Shuffle the new items and append to existing shuffled images
      const shuffledNew = [...newImages].sort(() => Math.random() - 0.5);
      setShuffledImages((prev) => [...prev, ...shuffledNew]);
    }
  }, [imagesWithContent.length, isPlaying]);

  useEffect(() => {
    if (!isPlaying || shuffledImages.length === 0) return;

    const fadeDuration = 1500; // 1.5 seconds for fade
    const visibleDuration = 5000; // 5 seconds visible
    const totalCycleDuration = visibleDuration + fadeDuration; // 6.5 seconds total

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const advanceImage = () => {
      setIsFadingOut(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prev) => {
          const nextIndex = prev + 1;
          setPreviousImageIndex(prev);
          
          // If we're near the end and have more pages, load next page
          if (nextIndex >= shuffledImages.length - 2 && hasMorePages && !isLoadingMore) {
            loadNextPage();
          }
          
          return nextIndex % shuffledImages.length;
        });
        setIsFadingOut(false);
        setIsFadingIn(true);
        
        setTimeout(() => {
          setIsFadingIn(false);
        }, fadeDuration);
      }, fadeDuration);
    };

    // Start the first cycle after visible duration
    timeoutId = setTimeout(() => {
      advanceImage();
      
      // Start interval after first cycle completes
      intervalId = setInterval(advanceImage, totalCycleDuration);
    }, visibleDuration);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isPlaying, shuffledImages.length, hasMorePages, isLoadingMore, selectedChannel, currentPage]);

  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  const handleFetchSearchUsers = async () => {
    const term = q.trim();
    if (!term) return;
    setLoadingUsers(true);

    fetchSearchUsers(term).then(async (res) => {
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      return res.json();
    }).then((data) => {
      const list: ArenaUser[] = Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
    }).catch(() => {
      setUsers([]);
    }).finally(() => setLoadingUsers(false));
  };

  const handleSelectUser = (user: ArenaUser) => {
    const payload = { id: user.id, full_name: user.full_name || user.username };
    localStorage.setItem("selected-user", JSON.stringify(payload));
    setSelectedUser(payload);
    setCurrentStep("channel");
    setFocusedInput("channel");
    handleFetchUserChannels(user.id);
    setTimeout(() => channelInputRef.current?.focus(), 100);
  };

  const handleSelectChannel = (channel: ArenaChannel) => {
    const payload = { id: channel.id, title: channel.title, slug: channel.slug };
    localStorage.setItem("selected-channel", JSON.stringify(payload));
    setSelectedChannel(payload);
    setCurrentStep("content");
    handleFetchChannelContents(channel.id);
  };

  const handleStepClick = (step: Step) => {
    if (step === "user") {
      setCurrentStep("user");
      setSelectedUser(null);
      setSelectedChannel(null);
      setChannels([]);
      setContents([]);
      setQ("");
      localStorage.removeItem("selected-user");
      localStorage.removeItem("selected-channel");
      setTimeout(() => userInputRef.current?.focus(), 0);
    } else if (step === "channel" && selectedUser) {
      setCurrentStep("channel");
      setSelectedChannel(null);
      setContents([]);
      setChannelSearchQuery("");
      localStorage.removeItem("selected-channel");
      setTimeout(() => channelInputRef.current?.focus(), 0);
    } else if (step === "content" && selectedUser && selectedChannel) {
      setCurrentStep("content");
    }
  };

  const handleUserClick = () => {
    setSelectedUser(null);
    setSelectedChannel(null);
    setChannels([]);
    setContents([]);
    setQ("");
    setCurrentStep("user");
    localStorage.removeItem("selected-user");
    localStorage.removeItem("selected-channel");
    setTimeout(() => userInputRef.current?.focus(), 0);
  };

  const handleChannelClick = () => {
    setSelectedChannel(null);
    setContents([]);
    setChannelSearchQuery("");
    setCurrentStep("channel");
    localStorage.removeItem("selected-channel");
    setTimeout(() => channelInputRef.current?.focus(), 0);
  };

  const filteredChannels = channels.filter((ch) => {
    if (!channelSearchQuery.trim()) return true;
    const query = channelSearchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(query) ||
      ch.slug.toLowerCase().includes(query)
    );
  });

  const showUserDropdown = focusedInput === "user" && (q.trim() || users.length > 0 || loadingUsers);
  const showChannelDropdown = selectedUser && (currentStep === "channel" || focusedInput === "channel") && (loadingChannels || filteredChannels.length > 0 || channelSearchQuery.trim());

  return (
    <>
      <div className="fixed left-4 top-4 z-10">
        <nav className="relative flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <button
            onClick={() => handleStepClick("user")}
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Arena
          </button>
          <span>/</span>
          {selectedUser ? (
            <>
              <button
                onClick={handleUserClick}
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {selectedUser.full_name}
              </button>
              <span>/</span>
              {selectedChannel ? (
                <>
                  <button
                    onClick={handleChannelClick}
                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {selectedChannel.title}
                  </button>
                  {(loadingContents || contents.length > 0) && (
                    <>
                      <span>/</span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {loadingContents ? 'Loading blocks...' : `${contents.length} ${contents.length === 1 ? 'block' : 'blocks'}`}
                      </span>
                      {contents.length > 0 && (
                        <>
                          <span>·</span>
                          <button
                            onClick={() => {
                              setIsPlaying(true);
                              setCurrentImageIndex(0);
                              setIsFadingOut(false);
                              setIsFadingIn(false);
                            }}
                            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          >
                            Play
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="relative">
                  <input
                    ref={channelInputRef}
                    type="text"
                    value={channelSearchQuery}
                    onChange={(e) => setChannelSearchQuery(e.target.value)}
                    onFocus={() => {
                      setCurrentStep("channel");
                      setFocusedInput("channel");
                    }}
                    onBlur={() => {
                      setTimeout(() => setFocusedInput(null), 200);
                    }}
                    placeholder="Search for a channel"
                    className="w-40 border-0 bg-transparent p-0 text-sm text-zinc-400 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-600 dark:placeholder:text-zinc-600"
                  />
                  {showChannelDropdown && (
                    <div className="absolute left-0 top-6 z-20 min-w-[280px]">
                      {loadingChannels ? (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Loading…
                        </div>
                      ) : filteredChannels.length === 0 ? (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          No channels found
                        </div>
                      ) : (
                        <ul className="max-h-64 overflow-auto">
                          {filteredChannels.map((ch) => (
                            <li
                              key={ch.id}
                              className="cursor-pointer text-sm text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                              onClick={() => {
                                handleSelectChannel(ch);
                                setFocusedInput(null);
                              }}
                            >
                              <div className="font-medium">{ch.title}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {ch.slug}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <input
                ref={userInputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => {
                  setCurrentStep("user");
                  setFocusedInput("user");
                }}
                onBlur={() => {
                  setTimeout(() => setFocusedInput(null), 200);
                }}
                placeholder="Search for a user"
                className="w-40 border-0 bg-transparent p-0 text-sm text-zinc-400 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-600 dark:placeholder:text-zinc-600"
              />
              {showUserDropdown && (
                <div className="absolute left-0 top-6 z-20 min-w-[280px]">
                  {loadingUsers ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Loading…
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      No users found
                    </div>
                  ) : (
                    <ul className="max-h-64 overflow-auto">
                      {users.map((user) => (
                        <li
                          key={user.id}
                          className="cursor-pointer text-sm text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                          onClick={() => {
                            handleSelectUser(user);
                            setFocusedInput(null);
                          }}
                        >
                          <div className="font-medium">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {user.channel_count} channels
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {selectedChannel && contents.length > 0 && !isPlaying && (
        <div className="left-4 top-20 z-0">
          <div className="flex flex-wrap gap-2 justify-center">
            {contents
              .filter((content) => content.image)
              .filter((content, index, self) => 
                index === self.findIndex((c) => c.id === content.id)
              )
              .map((content) => (
                <div
                  key={content.id}
                  className="max-w-[300px] aspect-square overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900"
                >
                  <img
                    src={content.image?.display?.url || content.image?.square?.url || content.image?.thumb?.url || ''}
                    alt={content.title || content.generated_title || ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {isPlaying && shuffledImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setIsPlaying(false)}
        >
          <div className="relative h-full w-full">
            {previousImageIndex >= 0 && previousImageIndex !== currentImageIndex && shuffledImages[previousImageIndex] && (
              <img
                key={`prev-${previousImageIndex}`}
                src={
                  shuffledImages[previousImageIndex]?.image?.large?.url ||
                  shuffledImages[previousImageIndex]?.image?.display?.url ||
                  shuffledImages[previousImageIndex]?.image?.original?.url ||
                  ""
                }
                alt={
                  shuffledImages[previousImageIndex]?.title ||
                  shuffledImages[previousImageIndex]?.generated_title ||
                  ""
                }
                className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[1500ms] ease-in-out opacity-0"
              />
            )}
            <img
              key={`current-${currentImageIndex}`}
              src={
                shuffledImages[currentImageIndex]?.image?.large?.url ||
                shuffledImages[currentImageIndex]?.image?.display?.url ||
                shuffledImages[currentImageIndex]?.image?.original?.url ||
                ""
              }
              alt={
                shuffledImages[currentImageIndex]?.title ||
                shuffledImages[currentImageIndex]?.generated_title ||
                ""
              }
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-[1500ms] ease-in-out"
              style={{
                opacity: isFadingIn ? 0 : isFadingOut ? 0 : 1,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}