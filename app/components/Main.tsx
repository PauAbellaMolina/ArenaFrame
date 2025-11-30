"use client";
import { useEffect, useState } from "react";
import { ArenaChannel, ArenaChannelContent } from "../queries/types";
import { fetchChannelContents } from "../queries";
import ControlsBar from "./ControlsBar";
import PlayButton from "./buttons/PlayButton";
import DurationToggleButton from "./buttons/DurationToggleButton";

export default function Main() {
  const [selectedChannel, setSelectedChannel] = useState<{
    id: number;
    title: string;
    slug: string;
  } | null>(null);

  const [contents, setContents] = useState<ArenaChannelContent[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleDuration, setVisibleDuration] = useState(5000);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [shuffledImages, setShuffledImages] = useState<ArenaChannelContent[]>(
    []
  );
  const [previousImageIndex, setPreviousImageIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleFetchChannelContents = (
    channelId: number,
    page: number = 1,
    append: boolean = false
  ) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoadingContents(true);
      setCurrentPage(1);
      setHasMorePages(true);
    }

    fetchChannelContents(channelId, page, 52)
      .then(async (res) => {
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

  const imagesWithContent = contents
    .filter((content) => content.image)
    .filter(
      (content, index, self) =>
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
          if (
            nextIndex >= shuffledImages.length - 2 &&
            hasMorePages &&
            !isLoadingMore
          ) {
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
  }, [
    isPlaying,
    shuffledImages.length,
    hasMorePages,
    isLoadingMore,
    selectedChannel,
    currentPage,
  ]);

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

  const handleSelectChannel = (channel: ArenaChannel) => {
    const payload = {
      id: channel.id,
      title: channel.title,
      slug: channel.slug,
    };
    setSelectedChannel(payload);
    handleFetchChannelContents(channel.id);
  };

  return (
    <>
      <div className="fixed left-4 top-4 z-10 flex gap-2 flex-wrap">
        <ControlsBar propagateSelectedChannel={handleSelectChannel} />
        <div className="flex gap-2">
          <PlayButton
            readyToPlay={!!selectedChannel && !!contents.length && !isPlaying}
            propagateOnPlay={() => setIsPlaying(true)}
          />
          <DurationToggleButton
            readyToPlay={!!selectedChannel && !!contents.length && !isPlaying}
            visibleDuration={visibleDuration}
            setVisibleDuration={setVisibleDuration}
          />
        </div>
      </div>
      <div className="sm:pt-20 pt-30">
        {loadingContents && (
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xl bg-black/50">
            <div className="text-zinc-300 text-md font-medium">
              Loading <span className="italic">{selectedChannel?.title}</span>{" "}
              blocks...
            </div>
          </div>
        )}
        {selectedChannel && contents.length > 0 && (
          <div className="left-4 top-20 z-0">
            <div className="flex flex-wrap gap-2 justify-center">
              {contents
                .filter((content) => content.image)
                .filter(
                  (content, index, self) =>
                    index === self.findIndex((c) => c.id === content.id)
                )
                .map((content) => (
                  <div
                    key={content.id}
                    className="max-w-[300px] aspect-square overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900"
                  >
                    <img
                      src={
                        content.image?.display?.url ||
                        content.image?.square?.url ||
                        content.image?.thumb?.url ||
                        ""
                      }
                      alt={content.title || content.generated_title || ""}
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
              {previousImageIndex >= 0 &&
                previousImageIndex !== currentImageIndex &&
                shuffledImages[previousImageIndex] && (
                  <img
                    key={`prev-${previousImageIndex}`}
                    src={
                      shuffledImages[previousImageIndex]?.image?.large?.url ||
                      shuffledImages[previousImageIndex]?.image?.display?.url ||
                      shuffledImages[previousImageIndex]?.image?.original
                        ?.url ||
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
      </div>
    </>
  );
}
