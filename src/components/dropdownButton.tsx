import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";
import React from "react";
import { isBarVisible } from "../state_machine/barVisible";

interface DropdownMenuItemProps {
  name: string;
  shortcut?: string;
  fn?: () => void;
  data?: React.ReactNode;
  icon?: React.ReactNode;
}

interface DropdownButtonProps extends PropsWithChildren {
  p?: string;
  o?: string;
  className?: string;
  label?: string | React.ReactNode;
  items?: Array<DropdownMenuItemProps>;
}
export default function DropdownButton({
  children,
  label,
  items,
  p,
  o,
  className,
}: DropdownButtonProps) {
  const isVisible = isBarVisible();
  return (
    <div data-tauri-drag-region={!isVisible}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn([
            "focus:outline-none focus:ring-0 focus:border-0",
            "rounded-md cursor-default",
            p || "p-2",
            o || "opacity-60",
            "hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100",
            "data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 data-[state=open]:opacity-100",
            "transition duration-300 ease-in-out",
            "transform-gpu",
            !isVisible && "opacity-0 pointer-events-none",
            className,
          ])}
          // style={{ transform: "translateZ(0)" }}
        >
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-popover/80 backdrop-filter backdrop-blur-[16px]">
          {label && (
            <DropdownMenuLabel className="cursor-default select-none dark:text-[#e5e5e5] text-xs">
              {label}
            </DropdownMenuLabel>
          )}
          {label && (
            <DropdownMenuSeparator className="dark:opacity-40 opacity-80" />
          )}
          {items?.map((item) => (
            <React.Fragment key={item.name}>
              <DropdownMenuItem
                className="focus:bg-accent/60 flex justify-between items-center dark:text-[#e5e5e5] opacity-70 dark:opacity-60 hover:opacity-90 transition"
                key={item.name}
                onClick={item.fn}
              >
                {item.name}
                {item.shortcut && (
                  <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                )}
                {item.icon}
              </DropdownMenuItem>
              {item.data}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
