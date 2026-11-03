import React from "react";
import { Send, Package, Clock, BookOpen } from "lucide-react";
import { motion } from "motion/react";

export type PortalTab = "ajukan" | "katalog" | "status" | "panduan";

interface PortalBottomNavProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  availableCount?: number;
  pendingCount?: number;
}

export function PortalBottomNav({
  activeTab,
  onTabChange,
  availableCount = 0,
  pendingCount = 0,
}: PortalBottomNavProps) {
  const navItems = [
    {
      id: "ajukan" as PortalTab,
      label: "Ajukan",
      icon: Send,
      badge: null,
    },
    {
      id: "katalog" as PortalTab,
      label: "Katalog",
      icon: Package,
      badge: availableCount > 0 ? (availableCount > 99 ? "99+" : availableCount) : null,
      badgeColor: "bg-emerald-500 text-white",
    },
    {
      id: "status" as PortalTab,
      label: "Status",
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      id: "panduan" as PortalTab,
      label: "Panduan",
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <nav
      id="portal-mobile-bottom-menu"
      aria-label="Navigasi Menu Portal Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.85rem)] pt-2 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto bg-white/92 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-5px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.06)] rounded-3xl p-1.5 grid grid-cols-4 gap-1.5 ring-1 ring-slate-900/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              type="button"
              onClick={() => {
                onTabChange(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-transform duration-150 active:scale-90 ${
                isActive ? "text-white" : "text-black hover:text-sky-800 font-bold"
              }`}
            >
              {/* Fluid Animated Sliding Pill */}
              {isActive && (
                <motion.div
                  layoutId="portalActivePill"
                  className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl shadow-md shadow-primary-500/30"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}

              {/* Badge indicator */}
              {item.badge !== null && (
                <span
                  className={`absolute -top-1 right-1 z-20 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-sm leading-none ${
                    item.badgeColor || "bg-rose-500 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Icon & Label with z-10 so they sit over the animated pill */}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"
                  }`}
                />
                <span
                  className={`text-[10px] tracking-tight leading-none mt-1 ${
                    isActive ? "font-bold" : "font-semibold"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
