"use client";

import { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setCurrentTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm:
          currentTheme === "dark"
            ? theme.darkAlgorithm
            : theme.defaultAlgorithm,
      }}
    >
      <div className="bg-background text-foreground min-h-screen">
        {children}
        {/* <button */}
        {/*   onClick={toggleTheme} */}
        {/*   className="fixed top-4 right-4 px-4 py-2 bg-foreground text-background rounded" */}
        {/* > */}
        {/*   Toggle Theme */}
        {/* </button> */}
      </div>
    </ConfigProvider>
  );
}
