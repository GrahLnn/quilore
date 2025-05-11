import { usePlatformName, Platform } from "@/src/subpub/platbus";
import Posts from "./posts";
import { station } from "@/src/subpub/buses";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { crab } from "@/src/cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { isTwitterLoginCookie, isValidCookies } from "@/src/app/checkCookies";
import { icons } from "@/src/assets/icons";
import { setScanCheck } from "@/src/subpub/scanCheck";
import { setCenterTool } from "@/src/subpub/centerTool";
import DropdownButton from "@/src/components/dropdownButton";
import DropdownSettings from "@/src/components/dropdownSettings";
import { open } from "@tauri-apps/plugin-dialog";

const Title = () => {
  const title = station.postsTitle.watch();
  return <div className="text-trim-cap">{title}</div>;
};
const EditCookies = () => {
  const [cookie, setCookie] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const getCookie = async () => {
      const result = await crab.getUserkvValue("Twitter");
      result.tap((v) => {
        if (!v) return;
        setCookie(v);
        setText(v);
      });
      setLoaded(true);
    };
    getCookie();
  }, []);
  // useEffect(() => {
  //   console.log(isValidCookies(text), detectCookieFormat(text));
  // });
  const buttonCSS = cn([
    "text-sm cursor-pointer select-none py-1 px-2 rounded-md",
    "dark:bg-[#171717] hover:dark:bg-[#262626] bg-[#e5e5e5] hover:bg-[#d4d4d4]",
    "dark:text-[#8a8a8a] hover:dark:text-[#d4d4d4] text-[#404040] hover:text-[#0a0a0a]",
    "transition duration-300",
  ]);
  const check4ui = () => text === cookie || !isTwitterLoginCookie(text);
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-xs text-[#525252] dark:text-[#a3a3a3] select-none cursor-default">
        A cookie is a piece of authentication information generated in your
        browser after you log in. You can use browser extensions such as `Get
        cookies.txt LOCALLY` to get it.
      </div>
      <div className="flex flex-col h-full gap-1">
        <textarea
          value={text}
          placeholder="Paste your cookies"
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full text-xs text-[#404040] dark:text-[#e5e5e5] resize-none outline-none border rounded-md p-1 dark:bg-[#171717] bg-[#fafafa] hide-scrollbar"
          rows={1}
          ref={textareaRef}
        />
        <div className="flex select-none cursor-default justify-between min-h-[28px]">
          <div
            className={cn([
              "flex gap-1 items-center transition duration-200 text-[#df2837]",
              (!loaded || isTwitterLoginCookie(text)) && "opacity-0",
            ])}
          >
            <icons.circleInfo size={12} />
            <div className="text-xs">
              {isValidCookies(text) && !isTwitterLoginCookie(text)
                ? "missing fields"
                : text
                ? "invalid cookies"
                : "should not be empty"}
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className={cn([
                buttonCSS,
                (text !== cookie || !isTwitterLoginCookie(text)) && cookie
                  ? "opacity-100"
                  : "opacity-0 hidden",
              ])}
              onClick={() => {
                setText(cookie);
              }}
            >
              Cancle
            </div>
            <div
              className={cn([
                buttonCSS,
                check4ui() ? "opacity-0 hidden" : "opacity-100",
              ])}
              onClick={() => {
                crab.upsertUserkv("Twitter", text);
                setCookie(text);
                setScanCheck(true);
              }}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const preference = [
  {
    name: "Cookies",
    // shortcut: "⌘E",
    fn: () => {},
    data: <EditCookies />,
    // icon: <icons.cookie />,
  },
  //   {
  //     name: "Share",
  //     // shortcut: "⌘S",
  //     fn: () => {},
  //     data: <div>分享内容预览或说明文字</div>,
  //   },
];
const actions = [
  {
    name: "Scan",
    fn: () => {},
    icon: <icons.scan />,
  },
  {
    name: "Import",
    fn: () => {
      open({
        directory: false,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      }).then((path) => {
        console.log(path);
      });
    },
    icon: <icons.squareDashedDownload />,
  },
  {
    name: "Export",
    fn: () => {},
    icon: <icons.squareDashedUpload />,
  },
];
const collection = [
  {
    name: "Twitter",
    fn: () => {},
    // data: <div></div>,
  },
];
export function PlatPage() {
  const page = usePlatformName();

  useEffect(() => {
    station.allowBarInteraction.set(true);
    setCenterTool({
      key: "posts",
      node: (
        <div
          className={cn([
            "flex items-center h-full",
            // "transition duration-300 ease-in-out",
          ])}
        >
          <DropdownButton items={collection}>
            <icons.gridCircle size={14} />
          </DropdownButton>

          <DropdownSettings
            // label="User Preferences"
            items={preference}
            className="text-xs font-light h-8"
            o="opacity-80"
            p="px-5"
          >
            <Title />
          </DropdownSettings>
          <DropdownButton items={actions}>
            <icons.sliders size={14} />
          </DropdownButton>
        </div>
      ),
    });
  });

  return page.match({
    [Platform.Twitter]: () => <Posts />,
  });
}
