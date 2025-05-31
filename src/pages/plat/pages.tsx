import { station } from "@/src/subpub/buses";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { crab } from "@/src/cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { isTwitterLoginCookie, isValidCookies } from "@/src/app/checkCookies";
import { icons } from "@/src/assets/icons";
import {
  DropdownButton,
  FnMenuItem,
  MenuItem,
  MenuSub,
} from "@/src/components/dropdownButton";
import DropdownSettings from "@/src/components/dropdownSettings";
import { open } from "@tauri-apps/plugin-dialog";
import { Platform } from "@/src/subpub/type";
import {
  BottomZone,
  EditArea,
  EditButton,
  EditButtons,
  EditMainZone,
  EditWarning,
  EditZone,
  EditZoneDesc,
  ValueArea,
} from "@/src/components/editzone";
import { MatchPages, postsStation } from "./twitter/pages";
import DropdownEditItem from "@/src/components/dropdownEditItem";
import {
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const Title = () => {
  const title = station.postsTitle.useSee();
  return <div className="text-trim-cap">{title}</div>;
};
const EditCookies = () => {
  const [cookie, setCookie] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const setScanCheck = station.scanCheck.useSet();
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
  const check4ui = () => text === cookie || !isTwitterLoginCookie(text);
  return (
    <EditZone>
      <EditZoneDesc
        text="A cookie is a piece of authentication information generated in your browser after you log in. You can use browser extensions such as `Get cookies.txt LOCALLY` to get it."
        append={
          <span className="text-[#df2837]">
            {" "}
            Be sure not to let anyone else see it.
          </span>
        }
      />
      <EditMainZone>
        <EditArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your cookies"
          rows={1}
          ref={textareaRef}
        />
        <BottomZone>
          <EditWarning
            text={
              isValidCookies(text) && !isTwitterLoginCookie(text)
                ? "missing fields"
                : text
                  ? "invalid cookies"
                  : "should not be empty"
            }
            className={cn([
              (!loaded || isTwitterLoginCookie(text)) && "opacity-0",
            ])}
          />
          <EditButtons>
            <EditButton
              text="Cancle"
              onClick={() => {
                setText(cookie);
              }}
              className={cn([
                (text !== cookie || !isTwitterLoginCookie(text)) && cookie
                  ? "opacity-100"
                  : "opacity-0 hidden",
              ])}
            />
            <EditButton
              text="Save"
              onClick={() => {
                crab.upsertUserkv("Twitter", text);
                setCookie(text);
                setScanCheck(true);
              }}
              className={cn([check4ui() ? "opacity-0 hidden" : "opacity-100"])}
            />
          </EditButtons>
        </BottomZone>
      </EditMainZone>
    </EditZone>
  );
};
function EditAssetFolder() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string | null>(null);
  useLayoutEffect(() => {
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
    <EditZone>
      <EditZoneDesc text="The folder where the assets are stored." />
      <EditMainZone>
        <ValueArea
          text={newPath || folderPath || ""}
          explain="This folder will store images, videos, and user profile pictures obtained from tweets. Please ensure you have enough space to store high-quality data." // Storing data for 20,000 entries is estimated to require around 60GB of storage.
        />
        <BottomZone>
          <EditWarning
            text="The folder path is not valid."
            className={cn(["opacity-0"])}
          />
          <EditButtons>
            <EditButton
              className={cn([newPath && "opacity-0 hidden"])}
              text="Change"
              onClick={() => {
                open({ directory: true }).then((path) => {
                  setNewPath(path);
                });
              }}
            />
            <EditButton
              className={cn([!newPath && "opacity-0 hidden"])}
              text="Cancle"
              onClick={() => {
                setNewPath(null);
              }}
            />
            <EditButton
              className={cn([!newPath && "opacity-0 hidden"])}
              text="Save"
              onClick={() => {
                if (!newPath) return;
                crab.upsertMetakv("SaveDir", newPath);
                setFolderPath(newPath);
                setNewPath(null);
              }}
            />
          </EditButtons>
        </BottomZone>
      </EditMainZone>
    </EditZone>
  );
}

const preference = [
  {
    name: "Cookies",
    // shortcut: "⌘E",
    fn: () => {},
    data: <EditCookies />,
  },
  {
    name: "Asset folder",
    // shortcut: "⌘S",
    fn: () => {},
    data: <EditAssetFolder />,
  },
];

export function PlatPage() {
  const page = station.platform.useSee();
  const cats = station.categorys.useSee();
  const catCheck = station.catCheck.useSee();
  const sortIdxList = postsStation.sortedIdxList.useSee();
  const curPosition = station.curPosition.useSee();

  const setBarInteraction = station.allowBarInteraction.useSet();
  const setCenterTool = station.centerTool.useSet();
  const setImportState = station.startImport.useSet();
  const [catPage, setCatPage] = station.catPage.useAll();
  const [pinPosition, setPinPosition] = station.pinPosition.useAll();
  const setNeedRefresh = station.needRefresh.useSet();

  const setCatCheck = station.catCheck.useSet();

  useEffect(() => {
    setBarInteraction(true);
    if (cats.length == 0) {
      setCatCheck(null);
    }
    setCenterTool({
      key: "posts",
      node: (
        <div
          className={cn([
            "flex items-center h-full",
            // "transition duration-300 ease-in-out",
          ])}
        >
          <DropdownButton trigger={<icons.gridCircle size={14} />}>
            <MenuItem
              name="Twitter"
              fn={() => {
                if (!catPage) return;
                setCatPage(null);
                setNeedRefresh(true);
              }}
            />
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
          <DropdownButton trigger={<icons.sliders size={14} />}>
            <MenuItem
              name="Scan"
              fn={() => {
                crab.scanLikesTimeline();
              }}
              icon={<icons.scan />}
            />
            <MenuItem
              name="Import"
              fn={() => {
                open({
                  directory: false,
                  filters: [
                    {
                      name: "JSON",
                      extensions: ["json"],
                    },
                  ],
                }).then((path) => {
                  if (!path) return;
                  crab.importData(path);
                  setImportState(true);
                });
              }}
              icon={<icons.squareDashedDownload />}
            />
            <MenuItem
              name="Export"
              fn={() => {}}
              icon={<icons.squareDashedUpload />}
            />
            {cats.length > 0 && (
              <MenuSub trigger={<>Check collect</>}>
                {cats.map((cat) => (
                  <MenuItem
                    key={`${cat}-check`}
                    name={cat}
                    fn={() => {
                      setCatCheck(cat);
                    }}
                  />
                ))}
              </MenuSub>
            )}
            {catCheck && (
              <MenuItem
                name="Clear check"
                fn={() => {
                  setCatCheck(null);
                }}
              />
            )}
            {pinPosition.size > 0 && (
              <MenuSub trigger={<>Continue from</>}>
                {Array.from(pinPosition.entries()).map(([key, value]) => (
                  <FnMenuItem
                    key={key}
                    name={key}
                    bfn={() => {
                      crab.deleteScrollCursor(key);
                      setPinPosition((p) => {
                        const q = new Map(p);
                        q.delete(key);
                        return q;
                      });
                    }}
                  />
                ))}
              </MenuSub>
            )}

            <MenuSub trigger={<>Pin scroll</>}>
              {Array.from(pinPosition.entries()).map(([key, _]) => (
                <MenuItem
                  key={key}
                  name={key}
                  fn={() => {
                    if (!curPosition) return;
                    crab.createScrollCursor(key, curPosition);
                  }}
                />
              ))}
              {pinPosition.size > 0 && <DropdownMenuSeparator />}
              <DropdownEditItem
                label={
                  pinPosition.size === 0 ? "Give a name ..." : "Add more ..."
                }
                onClose={(text: string) => {
                  if (!text || !curPosition) return;
                  setPinPosition((p) => {
                    const q = new Map(p);
                    q.set(text, curPosition);
                    crab.createScrollCursor(text, curPosition);
                    return q;
                  });
                }}
              />
            </MenuSub>
          </DropdownButton>
        </div>
      ),
    });
  }, [cats, catCheck, pinPosition, curPosition]);

  return page.match({
    [Platform.Twitter]: () => <MatchPages />,
  });
}
