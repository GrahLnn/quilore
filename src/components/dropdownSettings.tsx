import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";
import { useIsBarVisible } from "../state_machine/barVisible";

interface DropdownMenuItemProps {
  name: string;
  shortcut?: string;
  fn?: () => void;
  data?: React.ReactNode;
  icon?: React.ReactNode;
}

interface DropdownSettingProps extends PropsWithChildren {
  p?: string;
  o?: string;
  className?: string;
  label?: string | React.ReactNode;
  items?: Array<DropdownMenuItemProps>;
}

export default function DropdownSettings({
  children,
  label,
  items,
  p,
  o,
  className,
}: DropdownSettingProps) {
  const isVisible = useIsBarVisible();
  const [activatedItem, setActiveItem] = useState<string | null>(null);

  const data = items?.find((item) => item.name === activatedItem)?.data;

  return (
    <div data-tauri-drag-region={!isVisible}>
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
      >
        <DropdownMenuTrigger
          className={cn([
            "focus:outline-none focus:ring-0 focus:border-0",
            "rounded-md cursor-default",
            p || "p-2",
            o || "opacity-60",
            "hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100",
            "data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/5 data-[state=open]:opacity-100",
            "transition duration-300 ease-in-out",
            !isVisible && "opacity-0 pointer-events-none",
            className,
          ])}
        >
          {children}
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[600px] bg-popover/80 backdrop-filter backdrop-blur-[16px] flex">
          <div className="w-1/3 space-y-1">
            {label && (
              <>
                <DropdownMenuLabel className="cursor-default select-none">
                  {label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            {items?.map((item) => (
              <div
                key={item.name}
                className={cn([
                  "p-2 cursor-pointer hover:bg-accent/60 text-sm rounded font-semibold select-none",
                  activatedItem === item.name && "bg-accent/60",
                  activatedItem === item.name
                    ? "text-[#262626] dark:text-[#f5f5f5]"
                    : "text-[#737373] dark:text-[#a3a3a3]",
                  "transition duration-300",
                  "flex justify-between items-center",
                ])}
                onClick={() => setActiveItem(item.name)}
              >
                {item.name}
                {item.icon}
              </div>
            ))}
          </div>

          <div className="w-2/3 px-4 py-2 h-64">
            {data ?? (
              <div className="text-[#525252] dark:text-[#a3a3a3] text-xs select-none cursor-default">
                Click an item to see more information.
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
