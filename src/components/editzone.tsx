import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { icons } from "../assets/icons";

export function EditZoneDesc({
  text,
  append,
}: {
  text: string;
  append?: React.ReactNode;
}) {
  return (
    <div className="text-xs text-[#525252] dark:text-[#a3a3a3] select-none cursor-default">
      {text}
      {append}
    </div>
  );
}

interface EditAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const EditArea = forwardRef<HTMLTextAreaElement, EditAreaProps>(
  function EditArea(
    { value, onChange, placeholder, rows = 1, className },
    ref
  ) {
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={cn([
          "w-full h-full text-xs text-[#404040] dark:text-[#e5e5e5] resize-none outline-none border rounded-md p-1 dark:bg-[#171717] bg-[#fafafa] hide-scrollbar",
          className,
        ])}
        rows={rows}
        ref={ref}
      />
    );
  }
);

export function ValueArea({
  text,
  explain,
  className,
}: {
  text: string;
  explain?: string;
  className?: string;
}) {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div
        className={cn([
          "text-xs text-[#404040] dark:text-[#e5e5e5] select-none cursor-default",
          "border rounded-md p-1 dark:bg-[#171717] bg-[#fafafa]",
          className,
        ])}
      >
        {text}
      </div>
      {explain && (
        <div className="text-[#525252] dark:text-[#a3a3a3] text-xs select-none cursor-default">
          {explain}
        </div>
      )}
    </div>
  );
}

export function EditWarning({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn([
        "flex gap-1 items-center transition duration-200 text-[#df2837]",
        className,
      ])}
    >
      <icons.circleInfo size={12} />
      <div className="text-xs">{text}</div>
    </div>
  );
}

export function EditButtons({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(["flex gap-2", className])}>{children}</div>;
}

export function EditButton({
  text,
  onClick,
  className,
}: {
  text: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn([
        "cursor-pointer select-none py-1 px-2 rounded-md text-sm",
        "dark:bg-[#171717] hover:dark:bg-[#262626] bg-[#e5e5e5] hover:bg-[#d4d4d4]",
        "dark:text-[#8a8a8a] hover:dark:text-[#d4d4d4] text-[#404040] hover:text-[#0a0a0a]",
        "transition duration-300",
        className,
      ])}
      onClick={onClick}
    >
      {text}
    </div>
  );
}

export function BottomZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn([
        "flex select-none cursor-default justify-between min-h-[28px]",
        className,
      ])}
    >
      {children}
    </div>
  );
}

export function EditZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(["flex flex-col h-full gap-2", className])}>
      {children}
    </div>
  );
}

export function EditMainZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(["flex flex-col h-full gap-1", className])}>
      {children}
    </div>
  );
}
