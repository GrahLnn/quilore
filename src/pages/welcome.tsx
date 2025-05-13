import { cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { icons } from "../assets/icons";
import { crab } from "../cmd/commandAdapter";
import { Page, setPageName } from "../subpub/pageBus";
import { Guide, setGuide, useGuide } from "../subpub/guideBus";
import {
  setGuideC,
  viewGuideC,
  getGuideC,
  type CookieItem,
} from "../subpub/guideCookie"; // 导入 get 和 CookieItem
import { station } from "../subpub/buses";
import { setCenterTool } from "../subpub/centerTool";

const transitionDebug = {
  type: "easeOut",
  duration: 0.2,
};

export function InputMorphMessage() {
  const [messages, setMessages] = useState<
    {
      id: number;
      text: string;
    }[]
  >([]);
  const [newMessage, setNewMessage] = useState<string>("");

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (newMessage.trim()) {
      const timestamp = new Date().getTime();
      setMessages([...messages, { id: timestamp, text: newMessage }]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-[300px] flex-col items-end justify-end pb-4">
      <AnimatePresence mode="wait">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout="position"
            className="z-10 mt-2 max-w-[250px] break-words rounded-2xl bg-gray-200 dark:bg-black"
            layoutId={`container-[${messages.length - 1}]`}
            transition={transitionDebug}
          >
            <div className="px-3 py-2 text-[15px] leading-[15px] text-gray-900 dark:text-gray-100">
              {message.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="mt-4 flex w-full">
        <form onSubmit={handleSubmit} className="flex w-full">
          <input
            type="text"
            onChange={(e) => setNewMessage(e.target.value)}
            value={newMessage}
            className="relative h-9 w-[250px] flex-grow rounded-full border border-gray-200 bg-white px-3 text-[15px] outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1
            dark:border-black/60 dark:bg-black dark:text-gray-50 dark:placeholder-gray-500 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700"
            placeholder="Type your message"
          />
          <motion.div
            key={messages.length}
            layout="position"
            className="pointer-events-none absolute z-10 flex h-9 w-[250px] items-center overflow-hidden break-words rounded-full bg-gray-200 [word-break:break-word] dark:bg-black"
            layoutId={`container-[${messages.length}]`}
            transition={transitionDebug}
            initial={{ opacity: 0.6, zIndex: -1 }}
            animate={{ opacity: 0.6, zIndex: -1 }}
            exit={{ opacity: 1, zIndex: 1 }}
          >
            <div className="px-3 py-2 text-[15px] leading-[15px] text-gray-900 dark:text-gray-50">
              {newMessage}
            </div>
          </motion.div>
          <button
            type="submit"
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200
            dark:bg-black"
          >
            {/* <PlusIcon className="h-5 w-5 text-gray-600 dark:text-gray-50" /> */}
            <icons.plus />
          </button>
        </form>
      </div>
    </div>
  );
}

function OperationButton({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="submit"
      className={cn([
        "ml-2 flex h-9 min-w-9",
        "items-center justify-center rounded-full",
        "bg-gray-200 hover:bg-[#d4d4d4] dark:bg-[#171717] dark:hover:bg-[#212121]",
        "opacity-70 hover:opacity-90",
        "transform-gpu",
        "transition duration-300",
      ])}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function SetSaveDir() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  useEffect(() => {
    const getv = async () => {
      const savedir = await crab.getMetaValue("SaveDir");
      savedir.tap((v) => {
        if (v && typeof v === "object" && "String" in v) {
          setFolderPath(v.String);
        }
      });
    };
    getv();
  }, []);
  return (
    <>
      <div className="text-3xl font-bold text-[var(--content)] select-none cursor-default">
        A new way to collect your see
      </div>
      <div className="flex items-center gap-1">
        <div className="text-[#a1a1a1] select-none cursor-default">
          {folderPath
            ? "Your asset will store in"
            : "Please choose your asset folder"}
        </div>
        {folderPath && (
          <div className="text-[#a1a1a1] truncate border py-1.5 px-1 rounded-lg bg-white dark:bg-[#3d3d3d] trim-cap select-none cursor-default">
            {folderPath}
          </div>
        )}
      </div>
      <div className="h-16" />
      <div className="flex items-center gap-4">
        <OperationButton
          icon={<icons.folderOpen />}
          onClick={() => {
            open({ directory: true }).then((path) => {
              setFolderPath(path);
            });
          }}
        />
        {folderPath && (
          <OperationButton
            icon={<icons.arrowRight />}
            onClick={() => {
              crab.upsertMetakv("SaveDir", folderPath);
              station.saveDir.set(folderPath);
              setGuide(Guide.AddPlatform);
            }}
          />
        )}
      </div>
    </>
  );
}

function CookieEntry() {
  const [newMessage, setNewMessage] = useState<string>("");

  const handleCookieChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cookieValue = e.target.value;
    setNewMessage(cookieValue);

    if (cookieValue) {
      const currentCookies = getGuideC();

      const twitterIndex = currentCookies.findIndex(
        (item: CookieItem) => item.platform === "Twitter"
      );

      if (twitterIndex >= 0) {
        const updatedCookies = [...currentCookies];
        updatedCookies[twitterIndex] = {
          platform: "Twitter",
          cookie: cookieValue,
        };
        setGuideC(updatedCookies);
      } else {
        setGuideC([
          ...currentCookies,
          { platform: "Twitter", cookie: cookieValue },
        ]);
      }
    } else {
      // 当输入为空时，移除 Twitter 平台的 cookie（如果存在）
      const currentCookies = getGuideC();
      const twitterIndex = currentCookies.findIndex(
        (item: CookieItem) => item.platform === "Twitter"
      );

      if (twitterIndex >= 0) {
        // 如果找到了 Twitter cookie，则移除它
        const updatedCookies = [...currentCookies];
        updatedCookies.splice(twitterIndex, 1);
        setGuideC(updatedCookies);
      }
    }
  };

  return (
    <div className="flex items-center gap-8">
      <div className="text-[#a1a1a1] select-none cursor-default">Twitter</div>
      <div className="text-[#a1a1a1] select-none cursor-default">𝕏</div>
      {/* <div className="min-w-32 text-[#a1a1a1] select-none cursor-default">Token</div> */}
      <textarea
        onChange={handleCookieChange}
        value={newMessage}
        className="relative h-24 w-[250px] flex-grow rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[15px] outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1 resize-none
            dark:border-black/60 dark:bg-black dark:text-gray-50 dark:placeholder-gray-500 dark:focus-visible:ring-blue-500/20 dark:focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-700 hide-scrollbar"
        placeholder="Paste your cookies"
      />
    </div>
  );
}

function AddPlatform() {
  const [clicked, setClicked] = useState(false);
  const hasCookie = viewGuideC();
  return (
    <>
      <div className="text-3xl font-bold text-[var(--content)] select-none cursor-default">
        Add your platform cookie
      </div>
      <CookieEntry />
      {/* <div className="h-2" /> */}
      <div className="text-sm dark:text-[#a1a1a1] select-none cursor-default">
        Please use the{" "}
        <span className="dark:bg-white/20 bg-black/20">
          browser extension[Get cookies.txt LOCALLY]
        </span>{" "}
        option in the browser on the page
        <br />
        where you are logged into X, select the export format for the header
        string,
        <br />
        and then copy and paste it here.
        <br />
        You can modify it at any time. More platform support in future
      </div>
      <div className="text-sm text-[#e81123] select-none cursor-default">
        Please be careful NOT TO SHARE this cookie with anyone to prevent your
        account from being compromised.
      </div>
      <div className="h-0" />
      <div className="flex items-center gap-4">
        <OperationButton
          icon={<icons.arrowLeft />}
          onClick={() => {
            setGuide(Guide.SetSaveDir);
          }}
        />
        {/* <OperationButton
          icon={<icons.plus />}
          onClick={() => {
            // setGuide(Guide.SetSaveDir);
            // setPageName(Page.Main);
          }}
        /> */}
        <div
          className={cn([
            "ml-2 flex h-9 min-w-9 px-4",
            "items-center justify-center rounded-full",
            "bg-gray-200 hover:bg-[#d4d4d4] dark:bg-[#171717] dark:hover:bg-[#212121]",
            "opacity-70 hover:opacity-90",
            "transition duration-300",
            "select-none cursor-default",
            clicked && "opacity-0 pointer-events-none",
          ])}
          onClick={() => {
            crab.upsertMetakv("FirstLaunch", "false");
            for (const cookie of getGuideC()) {
              crab.upsertUserkv(cookie.platform, cookie.cookie);
            }
            setPageName(Page.Main);
            setClicked(true);
          }}
          onKeyDown={() => {}}
        >
          {hasCookie ? "Let's collect" : "Skip or later"}
        </div>
      </div>
    </>
  );
}

export default function Welcome() {
  useEffect(() => {
    setCenterTool(null);
    station.allowBarInteraction.set(false);
  }, []);
  const guide = useGuide();
  return (
    <div
      className={cn([
        "flex justify-center items-center flex-col text-center gap-8 overflow-hidden flex-1",
      ])}
    >
      {guide.match({
        [Guide.SetSaveDir]: () => <SetSaveDir />,
        [Guide.AddPlatform]: () => <AddPlatform />,
      })}
    </div>
  );
}
