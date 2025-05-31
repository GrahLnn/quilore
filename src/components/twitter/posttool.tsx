import { cn } from "@/lib/utils";
import { crab } from "@/src/cmd/commandAdapter";
import { Post } from "@/src/cmd/commands";
import { useLanguageState } from "@/src/state_machine/language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { icons } from "@/src/assets/icons";
import { memo, useState } from "react";
import { buildContent } from "./utils";
import { station } from "@/src/subpub/buses";
import DropdownEditItem from "../dropdownEditItem";

interface IconsItemProps {
  icon?: React.ReactNode;
  text: string;
}

function IconsItem({ icon, text }: IconsItemProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}

interface CardToolItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const CardToolItem = memo(function CardToolItemComp({
  icon,
  label,
  onClick,
}: CardToolItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="opacity-70 hover:opacity-100 transition"
    >
      <IconsItem icon={icon} text={label} />
    </DropdownMenuItem>
  );
});

interface CardToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  postdata: Post;
  onCollect: (collected: boolean, collectAt: string) => void;
}

const PostTools = memo(function CardToolsComp({
  postdata,
  onCollect,
  className,
}: CardToolsProps) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = station.categorys.useAll();
  const lang = useLanguageState();
  const currentChoose = station.currentChooseCat.useSee();
  const handleCopy = () => {
    const content = buildContent(postdata, lang);
    crab.copyToClipboard(content);
  };
  const setChoose = station.currentChooseCat.useSet();

  const handle_item_edit = (text: string) => {
    if (!text || cat.includes(text)) return;
    // setOpen(false);

    crab.createCollection(text).then((v) => {
      v.tap(() => {
        setCat([...cat, text]);
      });
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn([
          "focus:outline-none focus:ring-0 focus:border-0",
          "p-1.5 hover:bg-[#e6e6e7] dark:hover:bg-[#212121] opacity-90",
          "data-[state=open]:bg-[#e6e6e7] dark:data-[state=open]:bg-[#212121]",
          "rounded-md cursor-default",
          "transition-all duration-300 ease-in-out",
          "group-hover:opacity-100 data-[state=open]:opacity-100 opacity-0 transition duration-300",
          className,
        ])}
      >
        <icons.dots size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-45">
        {currentChoose && (
          <CardToolItem
            icon={<icons.star size={14} />}
            label={`Add to ${currentChoose}`}
            onClick={() => {
              crab.collectPost(currentChoose, postdata).then((v) => {
                v.tapErr((e) => {
                  console.log("collect post error:", e);
                });
                onCollect(true, currentChoose);
              });
            }}
          />
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="opacity-70 hover:opacity-100 transition">
            <IconsItem
              icon={<icons.pin size={16} className="opacity-70" />}
              text="Add to"
            />
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="min-w-40">
              {cat.map((item) => (
                <CardToolItem
                  key={item}
                  label={item}
                  onClick={() => {
                    setChoose(item);
                    crab.collectPost(item, postdata).then((v) => {
                      v.tapErr((e) => {
                        console.log("collect post error:", e);
                      });
                      onCollect(true, item);
                    });
                  }}
                />
              ))}
              {cat.length > 0 && <DropdownMenuSeparator />}
              <DropdownEditItem
                label={cat.length === 0 ? "Set New ..." : "More ..."}
                // className="opacity-70 hover:opacity-100 transition"
                onClose={handle_item_edit}
              />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <CardToolItem
          icon={<icons.duplicate2 size={14} />}
          label="Copy Content"
          onClick={handleCopy}
        />
        {/* <CardToolItem icon={<icons.globe3 size={14} />} label="Translate" /> */}
        <CardToolItem icon={<icons.fullScreen4 size={14} />} label="Expand" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default PostTools;
