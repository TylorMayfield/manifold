"use client";

interface TitleBarProps {
  title: string;
}

export default function TitleBar({ title }: TitleBarProps) {
  return (
    <div className="native-titlebar h-8 flex items-center justify-between px-4 sticky top-0 z-[60] bg-gray-900 border-b border-gray-700">
      <div className="text-xs text-white text-opacity-60">{title}</div>
      <div className="w-16"></div>
    </div>
  );
}
