import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeColor = "indigo" | "emerald" | "blue" | "rose" | "violet" | "amber" | "cyan" | "slate" | "teal" | "fuchsia" | "pink" | "orange" | "lime" | "zinc" | "neon" | "gold" | "ocean" | "forest" | "lavender" | "cherry" | "coffee" | "dracula" | "sapphire" | "ruby" | "emerald-dark" | "sunset" | "galaxy";
type ThemeMode = "light" | "dark" | "sepia" | "midnight" | "oled" | "dim" | "hacker" | "cyberblue" | "latte" | "kopi" | "nord" | "gruvbox" | "monokai" | "dracula-mode" | "solarized-light" | "solarized-dark" | "matrix" | "synthwave" | "oceanic" | "autumn" | "cotton" | "sakura" | "mint" | "parchment" | "frost" | "sunlight";
type ThemeStyle = "modern" | "brutalist" | "elegan" | "ceria" | "cyberpunk" | "glassmorphism" | "retro" | "minimalist" | "neo-brutalism" | "skumorphism" | "claymorphism" | "neumorphism" | "wireframe" | "bauhaus" | "comic";
type UiScale = "small" | "medium" | "large" | "extra-large";
type FontColor = "slate" | "gray" | "zinc" | "neutral" | "stone" | "blue" | "rose" | "emerald" | "amber" | "violet";

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
  uiScale: UiScale;
  setUiScale: (scale: UiScale) => void;
  fontColor: FontColor;
  setFontColor: (color: FontColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColor] = useState<ThemeColor>("ocean");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("modern");
  const [uiScale, setUiScale] = useState<UiScale>("medium");
  const [fontColor, setFontColor] = useState<FontColor>("slate");

  useEffect(() => {
    const savedColor = localStorage.getItem("themeColor") as ThemeColor | null;
    const savedMode = localStorage.getItem("themeMode") as ThemeMode | null;
    const savedStyle = localStorage.getItem("themeStyle") as ThemeStyle | null;
    const savedScale = localStorage.getItem("uiScale") as UiScale | null;
    const savedFontColor = localStorage.getItem("fontColor") as FontColor | null;
    
    // Default to ocean (biru muda) and light mode
    if (savedColor && savedColor !== "indigo") {
      setThemeColor(savedColor);
    } else {
      setThemeColor("ocean");
      localStorage.setItem("themeColor", "ocean");
    }

    if (savedMode) {
      setThemeMode(savedMode);
    } else {
      setThemeMode("light");
      localStorage.setItem("themeMode", "light");
    }

    if (savedStyle) setThemeStyle(savedStyle);
    if (savedScale) setUiScale(savedScale);
    if (savedFontColor) setFontColor(savedFontColor);
  }, []);

  useEffect(() => {
    localStorage.setItem("themeColor", themeColor);
    document.documentElement.setAttribute("data-theme", themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem("fontColor", fontColor);
    
    const root = document.documentElement;
    if (fontColor === "slate") {
      // reser to default
      root.style.removeProperty('--color-slate-50');
      root.style.removeProperty('--color-slate-100');
      root.style.removeProperty('--color-slate-200');
      root.style.removeProperty('--color-slate-300');
      root.style.removeProperty('--color-slate-400');
      root.style.removeProperty('--color-slate-500');
      root.style.removeProperty('--color-slate-600');
      root.style.removeProperty('--color-slate-700');
      root.style.removeProperty('--color-slate-800');
      root.style.removeProperty('--color-slate-900');
      root.style.removeProperty('--color-slate-950');
    } else {
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach(weight => {
        root.style.setProperty(`--color-slate-${weight}`, `var(--color-${fontColor}-${weight})`);
      });
    }
  }, [fontColor]);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    
    // Clear all mode classes
    document.documentElement.classList.remove("dark", "sepia", "midnight", "oled", "dim", "hacker", "cyberblue", "latte", "kopi", "nord", "gruvbox", "monokai", "dracula-mode", "solarized-light", "solarized-dark", "matrix", "synthwave", "oceanic", "autumn", "cotton", "sakura", "mint", "parchment", "frost", "sunlight");
    
    const isDarkVariant = ["dark", "midnight", "oled", "dim", "hacker", "cyberblue", "nord", "gruvbox", "monokai", "dracula-mode", "solarized-dark", "matrix", "synthwave", "oceanic"].includes(themeMode);

    if (isDarkVariant) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme-mode", "dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme-mode", "light");
      document.documentElement.style.colorScheme = "light";
    }

    if (themeMode !== "light" && themeMode !== "dark") {
      document.documentElement.classList.add(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("themeStyle", themeStyle);
    document.documentElement.setAttribute("data-style", themeStyle);
  }, [themeStyle]);

  useEffect(() => {
    localStorage.setItem("uiScale", uiScale);
    let fontSize = "16px";
    if (uiScale === "small") fontSize = "14px";
    if (uiScale === "large") fontSize = "18px";
    if (uiScale === "extra-large") fontSize = "20px";
    document.documentElement.style.fontSize = fontSize;
  }, [uiScale]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, themeMode, setThemeMode, themeStyle, setThemeStyle, uiScale, setUiScale, fontColor, setFontColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
