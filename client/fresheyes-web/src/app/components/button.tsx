"use client";

import { signOut } from "next-auth/react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "signout";
  icon?: React.ReactNode | null;
}

export default function Button({ children, onClick, type, icon }: ButtonProps) {
  const handleClick = (e: any) => {
    e.preventDefault();
    if (onClick) {
      onClick();
      return;
    }
    if (type === "signout") {
      signOut({ callbackUrl: "/landing" });
      return;
    }
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md ${
        !icon
          ? "bg-gray-900 dark:bg-gray-50 hover:bg-gray-900/90 focus-visible:ring-gray-950 px-8 shadow"
          : "px-2"
      } text-sm font-medium text-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300`}
      onClick={(e) => handleClick(e)}
    >
      {children}
    </button>
  );
}
