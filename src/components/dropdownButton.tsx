import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";
import React, { memo } from "react";
import { useIsBarVisible } from "../state_machine/barVisible";
import { icons } from "../assets/icons";

interface MenuItemProps {
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
  // items?: Array<React.ReactNode>;
  trigger?: React.ReactNode;
}
export function DropdownButton({
  children,
  label,
  p,
  o,
  className,
  trigger,
}: DropdownButtonProps) {
  const isVisible = useIsBarVisible();
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
          {trigger}
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
          {/* {items?.map((item) => item)} */}
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const MenuItem = memo(function MenuItemComp(item: MenuItemProps) {
  return (
    <React.Fragment key={item.name}>
      <DropdownMenuItem
        className="focus:bg-accent flex justify-between items-center dark:text-[#e5e5e5] opacity-70 dark:opacity-60 hover:opacity-90 transition"
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
  );
});

interface FnMenuItemProps extends MenuItemProps {
  bfn: () => void;
}

export const FnMenuItem = memo(function FnMenuItemComp(item: FnMenuItemProps) {
  return (
    <React.Fragment key={item.name}>
      <DropdownMenuItem
        className="focus:bg-accent flex justify-between items-center dark:text-[#e5e5e5] opacity-70 dark:opacity-60 hover:opacity-90 transition relative group"
        onClick={item.fn}
      >
        {item.name}
        <div className="absolute right-0 mr-2 flex items-center gap-x-1 cursor-default h-3">
          <button
            className="rounded bg-neutral-300 p-[2px] text-neutral-700 hover:bg-neutral-400/50 dark:bg-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-500 cursor-pointer opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              item.bfn();
            }}
          >
            <icons.xmark size={12} className="size-[12px]" />
          </button>
        </div>
      </DropdownMenuItem>
      {item.data}
    </React.Fragment>
  );
});

interface DropdownMenuSubProps extends PropsWithChildren {
  trigger?: React.ReactNode;
}

const MenuSub = memo(function DropdownMenuSubComp({
  children,
  trigger,
}: DropdownMenuSubProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="focus:bg-accent flex justify-between items-center dark:text-[#e5e5e5] opacity-70 dark:opacity-60 hover:opacity-90 transition">
        {trigger}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="min-w-40 bg-popover/80 backdrop-filter backdrop-blur-[16px]">
          {children}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
});

export { MenuItem, MenuSub };
