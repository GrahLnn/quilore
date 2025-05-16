import { cn } from "@/lib/utils";
import { postsStation } from "./pages";
import { icons } from "@/src/assets/icons";
import { open } from "@tauri-apps/plugin-dialog";
import { crab } from "@/src/cmd/commandAdapter";
import { station } from "@/src/subpub/buses";
import { useEffect, useState } from "react";
import { events } from "@/src/cmd/commands";
import { TwitterPage } from "@/src/subpub/type";
import { isTwitterLoginCookie } from "@/src/app/checkCookies";

interface ActionButtonProps {
  className?: string | undefined | false;
  onClick?: () => void;
  icon?: React.ReactNode;
  content?: string;
}
function ActionButton({
  className,
  onClick,
  icon,
  content,
}: ActionButtonProps) {
  return (
    <div
      className={cn([
        "flex items-center justify-center gap-2",
        "bg-[#e7e7e7] hover:bg-[#d1d1d1] dark:bg-[#171717] dark:hover:bg-[#404040] rounded-md pl-4 pr-5 py-2",
        "hover:shadow-[var(--butty-shadow)]",
        "select-none cursor-pointer",
        "transition duration-300 ease-in-out",
        "text-[#212121] dark:text-[#d4d4d4]",
        className,
      ])}
      onClick={onClick}
    >
      {icon}
      <div className="text-xs">{content}</div>
    </div>
  );
}

export function PrePosts() {
  const [isLoading, setIsLoading] = postsStation.isLoading.useAll();
  const sortedIdxList = postsStation.sortedIdxList.useSee();
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = postsStation.scanning.useAll();
  const [cookieloaded, setCookieLoaded] = useState(false);
  const setTitle = station.postsTitle.useSet();
  const setPage = station.twitter.useSet();
  const isCookieset = station.isCookieSet.useSee();
  const setImportState = station.startImport.useSet();

  useEffect(() => {
    setTitle("Welcome");
    const getCookie = async () => {
      if (!isCookieset) return;
      const result = await crab.getUserkvValue("Twitter");
      result.match({
        Ok: async (v) => {
          if (v) {
            if (isTwitterLoginCookie(v)) {
              setCanScan(true);
            }
            setCookieLoaded(true);
          }
        },
        Err: () => {
          setTimeout(getCookie, 100);
        },
      });
    };
    getCookie();
    const importEvent = events.importEvent.listen(() => {
      setImportState(false);
      setPage(TwitterPage.Posts);
    });

    const scanEvent = events.scanLikesEvent.listen(() => {
      setPage(TwitterPage.Posts);
    });

    return () => {
      importEvent.then((f) => f());
      scanEvent.then((f) => f());
    };
  }, []);

  return (
    <div
      className={cn([
        "flex justify-center items-center flex-col text-center gap-4 py-4",
        "w-[1186px] mx-auto h-full",
      ])}
    >
      {sortedIdxList.length === 0 && isLoading && (
        <div className="flex justify-center items-center flex-col text-center gap-8 overflow-hidden flex-1 text-gray-500">
          Loading...
        </div>
      )}
      {sortedIdxList.length === 0 && !isLoading && (
        <div
          className={cn([
            "flex justify-center items-center flex-col text-center gap-4 flex-1",
            "select-none cursor-default",
          ])}
        >
          <div className="relative w-48 h-36 bg-gray-200/40 dark:bg-[#171717] rounded-md shadow-md p-3">
            <div className="absolute bottom-4 left-3">
              <div className="w-20 h-2 bg-gray-300/40 dark:bg-[#262626] rounded mb-2"></div>
              <div className="w-16 h-2 bg-gray-300/40 dark:bg-[#262626] rounded"></div>
            </div>
          </div>
          <div className="h-4" />
          <div className="font-semibold text-[#262626] dark:text-[#e5e5e5]">
            No posts yet!!
          </div>
          <div className="text-[#737373] dark:text-[#a3a3a3] text-sm">
            Begin with your first data acquisition
          </div>

          {canScan && (
            <div
              className={cn([
                "flex items-center gap-2",
                scanning && "opacity-0 pointer-events-none",
              ])}
            >
              <ActionButton
                icon={<icons.scan />}
                content="Scan your liked posts"
                onClick={async () => {
                  crab.scanLikesTimeline();
                  setScanning(true);
                  setIsLoading(true);
                }}
              />
              <ActionButton
                icon={<icons.squareDashedDownload />}
                content="Import from file"
                onClick={() => {
                  open({
                    filters: [
                      {
                        name: "JSON",
                        extensions: ["json"],
                      },
                    ],
                  }).then((path) => {
                    if (!path) return;
                    crab.importData(path);
                    setScanning(true);
                    setIsLoading(true);
                    setImportState(true);
                  });
                }}
              />
            </div>
          )}
          {!cookieloaded && !isCookieset && (
            <div className="text-xs text-[#e81123]">
              Cookie is missing. Please click the &quot;Welcome&quot; button at
              the top to add it.
            </div>
          )}
          {cookieloaded && !canScan && (
            <div className="text-xs text-[#e81123]">
              Cookie is invalid. Please click the &quot;Welcome&quot; button at
              the top to fix it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
