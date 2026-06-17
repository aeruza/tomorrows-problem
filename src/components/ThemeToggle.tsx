"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} 
            className="relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900 focus:ring-neutral-400 bg-neutral-200 dark:bg-neutral-600"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                theme === "dark" ? "translate-x-7" : "translate-x-1"
            }`}>
                <span className="flex h-full w-full items-center justify-center">
                    {theme === "dark" ? (
                        <svg
                            className="w-3.5 h-3.5 text-gray-700"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M21.752 15.002A9.718 9.718 0 0112.478 3.206a9.72 9.72 0 00-3.478.692 9.75 9.75 0 1012.752 11.104z" />
                        </svg>
                        ) : (
                            <svg
                                className="w-3.5 h-3.5 text-amber-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <circle cx="12" cy="12" r="4" />
                                <path
                                    strokeLinecap="round"
                                    d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0l-1.41-1.41M8.34 8.34L6.93 6.93" />
                            </svg>
                        )}
                </span>
            </span>
        </button>
    );
}