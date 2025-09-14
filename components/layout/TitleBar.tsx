"use client";

interface TitleBarProps {
  title: string;
}

export default function TitleBar({ title }: TitleBarProps) {
  return (
    <div className="native-titlebar h-8 flex items-center justify-between px-4">
      <div className="text-xs text-white text-opacity-60">{title}</div>
      <div className="w-16"></div>
    </div>
  );
}
