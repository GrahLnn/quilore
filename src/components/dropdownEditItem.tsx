import { cn } from "@/lib/utils";
import { icons } from "../assets/icons";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";

interface EditItemProps {
  label: string;
  className?: string;
  onClose?: (t: string) => void;
  placeholder?: string;
}

export default function DropdownEditItem({
  label,
  className,
  onClose,
  placeholder,
}: EditItemProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const ref = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      className={cn([
        "group relative flex h-8 w-full items-center overflow-hidden rounded text-sm",
        "dark:text-[#e5e5e5] opacity-70 dark:opacity-60 hover:opacity-90 transition",
        "hover:bg-accent transition-colors",
        editing && "cursor-text opacity-100 bg-accent",
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
      <AnimatePresence initial={false}>
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
              placeholder={placeholder}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div className="absolute right-0 mr-2 flex items-center gap-x-1 cursor-default">
              <button
                className="rounded bg-neutral-300 p-[3px] text-neutral-700 hover:bg-neutral-400/50 dark:bg-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
                onClick={() => {
                  setEditing(false);
                  setText("");
                  onClose?.(text.trim());
                }}
              >
                <icons.check3 size={12} />
              </button>
              <button
                className="rounded bg-neutral-300 p-[3px] text-neutral-700 hover:bg-neutral-400/50 dark:bg-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-500 cursor-pointer"
                onClick={() => {
                  setEditing(false);
                  setText("");
                }}
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
          "pointer-events-none absolute left-0 h-full w-full",
          editing ? "block" : "hidden group-hover:block"
        )}
      />
    </motion.div>
  );
}
