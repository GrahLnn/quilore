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
import { memo, useRef, useState } from "react";
import { buildContent } from "./utils";
import { motion, AnimatePresence } from "framer-motion";
import { station } from "@/src/subpub/buses";

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

interface EditItemProps {
  label: string;
  className?: string;
  onClose?: (t: string) => void;
}

function EditItem({ label, className, onClose }: EditItemProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const ref = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      className={cn([
        "group relative flex h-8 w-full items-center overflow-hidden rounded text-sm",
        className,
        editing && "cursor-text opacity-100",
      ])}
      onClick={() => {
        if (!editing) {
          setEditing(true);
          setTimeout(() => ref.current?.focus(), 100);
        } else {
          ref.current?.focus();
        }
      }}
      layout
    >
      <AnimatePresence>
        {editing ? (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ staggerChildren: 0.1 }}
            key={0}
            className="absolute left-0 flex w-full items-center justify-between"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="ml-2 w-4/6 cursor-text bg-transparent outline-none"
              ref={ref}
            />
            <div className="absolute right-0 mr-2 flex items-center gap-x-1 cursor-default">
              <button
                className="rounded bg-neutral-300 p-[3px] text-neutral-700 hover:bg-neutral-400/50 dark:bg-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
                onClick={() => {
                  setEditing(false);
                  onClose?.(text.trim());
                }}
              >
                <icons.check3 size={12} />
              </button>
              <button
                className="rounded bg-neutral-300 p-[3px] text-neutral-700 hover:bg-neutral-400/50 dark:bg-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
                onClick={() => setEditing(false)}
              >
                <icons.xmark size={12} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            key={1}
            className="absolute right-0 flex w-full items-center"
            onClick={() => {
              setEditing(true);
              setTimeout(() => ref.current?.focus(), 100);
            }}
          >
            <span className="ml-2">{label}</span>
            {/* < className="absolute right-0 mr-2 text-base" /> */}
          </motion.button>
        )}
      </AnimatePresence>
      <div
        className={cn(
          "pointer-events-none absolute left-0 h-full w-full bg-neutral-950/10 transition-colors dark:bg-neutral-50/10",
          editing ? "block" : "hidden group-hover:block"
        )}
      />
    </motion.div>
  );
}

interface CardToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  postdata: Post;
}

const PostTools = memo(function CardToolsComp({
  postdata,
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
                    });
                  }}
                />
              ))}
              {cat.length > 0 && <DropdownMenuSeparator />}
              <EditItem
                label={cat.length === 0 ? "Set New ..." : "More ..."}
                className="opacity-70 hover:opacity-100 transition"
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
