import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoveHorizontal,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface StickyTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  tableContainerClassName?: string;
  showControls?: boolean;
  label?: string;
  defaultMaxHeight?: string;
  allowHeightToggle?: boolean;
}

export function StickyTableWrapper({
  children,
  className = "",
  tableContainerClassName = "",
  showControls = true,
  label = "Scroll Bar Horizontal",
  defaultMaxHeight,
  allowHeightToggle = true,
}: StickyTableWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomSyncBarRef = useRef<HTMLDivElement>(null);
  const topSyncBarRef = useRef<HTMLDivElement>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);

  // Floating scrollbar state
  const [isFloating, setIsFloating] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [floatingRect, setFloatingRect] = useState<{ left: number; width: number; bottom: number }>({
    left: 0,
    width: 0,
    bottom: 0,
  });

  // Table internal height lock preference (saved in localStorage)
  const [isHeightLocked, setIsHeightLocked] = useState<boolean>(() => {
    if (defaultMaxHeight) return true;
    try {
      return localStorage.getItem("sarpras_table_height_locked") === "true";
    } catch {
      return false;
    }
  });

  const toggleHeightLock = () => {
    setIsHeightLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sarpras_table_height_locked", String(next));
      } catch {}
      return next;
    });
  };

  // Measure overflow & scroll progress
  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setHasOverflow(overflow);
    setContentWidth(scrollWidth);
    setVisibleWidth(clientWidth);

    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));
    setScrollProgress(progress);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);

    // Sync bottom floating/docked bar scroll
    if (bottomSyncBarRef.current && Math.abs(bottomSyncBarRef.current.scrollLeft - scrollLeft) > 2) {
      bottomSyncBarRef.current.scrollLeft = scrollLeft;
    }
    // Sync top track scroll
    if (topSyncBarRef.current && Math.abs(topSyncBarRef.current.scrollLeft - scrollLeft) > 2) {
      topSyncBarRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Update floating bar positioning relative to viewport
  const updateFloatingPosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const bottomNavOffset = isMobile ? 62 : 0;

    // Check if table is in viewport
    const visible = rect.bottom > 80 && rect.top < windowHeight - 40;
    setIsInView(visible);

    // Bottom of table is below viewport -> should float at screen bottom
    const shouldFloat = rect.bottom > windowHeight - bottomNavOffset && rect.top < windowHeight - bottomNavOffset - 60;
    setIsFloating(shouldFloat);

    setFloatingRect({
      left: Math.max(0, rect.left),
      width: rect.width,
      bottom: bottomNavOffset,
    });
  }, []);

  // Scroll and Resize Listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleContainerScroll = () => {
      checkOverflow();
    };

    const handleWindowScrollAndResize = () => {
      checkOverflow();
      updateFloatingPosition();
    };

    el.addEventListener("scroll", handleContainerScroll, { passive: true });
    window.addEventListener("scroll", handleWindowScrollAndResize, { passive: true });
    window.addEventListener("resize", handleWindowScrollAndResize, { passive: true });

    checkOverflow();
    updateFloatingPosition();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
      updateFloatingPosition();
    });
    resizeObserver.observe(el);
    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => {
      el.removeEventListener("scroll", handleContainerScroll);
      window.removeEventListener("scroll", handleWindowScrollAndResize);
      window.removeEventListener("resize", handleWindowScrollAndResize);
      resizeObserver.disconnect();
    };
  }, [checkOverflow, updateFloatingPosition]);

  // Sync scroll from bottom floating/docked track
  const handleBottomBarScroll = () => {
    if (!bottomSyncBarRef.current || !containerRef.current) return;
    containerRef.current.scrollLeft = bottomSyncBarRef.current.scrollLeft;
  };

  // Sync scroll from top track
  const handleTopBarScroll = () => {
    if (!topSyncBarRef.current || !containerRef.current) return;
    containerRef.current.scrollLeft = topSyncBarRef.current.scrollLeft;
  };

  // Smooth scroll button helpers
  const scrollByAmount = (offset: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToStart = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scrollToEnd = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: "smooth" });
  };

  // Mouse pan / drag to scroll implementation
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button and not on interactive controls
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("a") ||
      target.closest(".no-drag")
    ) {
      return;
    }

    isMouseDownRef.current = true;
    startXRef.current = e.pageX;
    scrollStartRef.current = containerRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    e.preventDefault();
    const walk = (e.pageX - startXRef.current) * 1.5;
    containerRef.current.scrollLeft = scrollStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
  };

  // Render Controller Box
  const renderController = (isFloatMode: boolean) => (
    <div
      className={`w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md select-none print:hidden transition-all duration-150 ${
        isFloatMode
          ? "border-t-2 border-sky-500 shadow-[0_-8px_30px_rgba(2,132,199,0.22)] rounded-t-xl"
          : "border-t-2 border-sky-300 dark:border-sky-800 rounded-b-xl shadow-xs"
      }`}
    >
      {/* Native Scrollbar Track (Drag directly with mouse/trackpad) */}
      <div
        ref={bottomSyncBarRef}
        onScroll={handleBottomBarScroll}
        className="overflow-x-scroll overflow-y-hidden w-full h-4 bg-sky-100/90 dark:bg-slate-800/90 cursor-ew-resize border-b border-sky-200 dark:border-slate-700"
        style={{
          scrollbarWidth: "auto",
        }}
        title="Geser scroll bar ini untuk menggeser kolom tabel ke kiri / kanan"
      >
        <div
          style={{
            width: `${contentWidth}px`,
            height: "1px",
          }}
        />
      </div>

      {/* Controller Buttons & Indicator Bar */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs">
          {/* Left Side: Status Badge & Column Info */}
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-white font-bold text-[10px] sm:text-[11px] shadow-xs shrink-0 ${
                isFloatMode ? "bg-sky-600 animate-pulse" : "bg-sky-700"
              }`}
              title={
                isFloatMode
                  ? "Scroll Bar Aktif Melayang di Bawah Layar (Mudah Digeser Tanpa Scroll ke Bawah)"
                  : "Scroll Bar di Bagian Bawah Tabel"
              }
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span>{isFloatMode ? "STANDBY MELAYANG" : "STANDBY"}</span>
            </span>

            <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px] hidden sm:inline truncate max-w-[200px]">
              {label}
            </span>

            <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] font-mono">
              Posisi: <strong className="text-sky-700 dark:text-sky-300">{scrollProgress}%</strong> (
              {Math.round(visibleWidth)}px / {Math.round(contentWidth)}px)
            </span>
          </div>

          {/* Right Side: Quick Steppers & Height Lock Toggle */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {allowHeightToggle && (
              <button
                type="button"
                onClick={toggleHeightLock}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] sm:text-[11px] font-semibold transition-all shadow-2xs mr-1 ${
                  isHeightLocked
                    ? "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-700"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                }`}
                title={
                  isHeightLocked
                    ? "Tinggi Tabel Dibatasi (Scroll Vertikal di Dalam Tabel). Klik untuk melihat tinggi penuh."
                    : "Tinggi Tabel Penuh. Klik untuk mengunci tinggi tabel agar tidak panjang ke bawah."
                }
              >
                {isHeightLocked ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-sky-700 dark:text-sky-300" />
                    <span>Tinggi: 60vh</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>Tinggi Penuh</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={scrollToStart}
              disabled={!canScrollLeft}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800 dark:text-slate-200 transition-colors shadow-2xs text-[11px]"
              title="Geser ke Kolom Paling Kiri (Awal)"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Awal</span>
            </button>

            <button
              type="button"
              onClick={() => scrollByAmount(-280)}
              disabled={!canScrollLeft}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sky-700 dark:text-sky-400 transition-colors shadow-2xs text-[11px]"
              title="Geser Kiri (280px)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kiri</span>
            </button>

            {/* Visual Progress Bar Pill */}
            <div
              className="w-16 sm:w-28 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-1 cursor-pointer relative"
              onClick={(e) => {
                if (!containerRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = clickX / rect.width;
                const max = containerRef.current.scrollWidth - containerRef.current.clientWidth;
                containerRef.current.scrollTo({ left: pct * max, behavior: "smooth" });
              }}
              title="Klik pada garis ini untuk langsung melompat ke posisi kolom"
            >
              <div
                className="h-full bg-sky-600 dark:bg-sky-500 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(15, scrollProgress)}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => scrollByAmount(280)}
              disabled={!canScrollRight}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sky-700 dark:text-sky-400 transition-colors shadow-2xs text-[11px]"
              title="Geser Kanan (280px)"
            >
              <span>Kanan</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={scrollToEnd}
              disabled={!canScrollRight}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-800 dark:text-slate-200 transition-colors shadow-2xs text-[11px]"
              title="Geser ke Kolom Paling Kanan (Akhir)"
            >
              <span className="hidden md:inline">Akhir</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={wrapperRef} className={`relative flex flex-col w-full ${className}`}>
      {/* Top Synchronized Scroll Track (Instantly accessible right at the top of the table) */}
      {hasOverflow && (
        <div
          className="w-full bg-sky-50/70 dark:bg-slate-800/60 border-b border-sky-200 dark:border-slate-700/80 px-2 py-1 flex items-center gap-2 text-[11px] select-none print:hidden"
          title="Scroll Bar Horizontal Atas: Geser langsung untuk melihat kolom kanan"
        >
          <span className="text-sky-800 dark:text-sky-300 font-semibold text-[10px] shrink-0 flex items-center gap-1">
            <MoveHorizontal className="w-3 h-3" />
            <span>Scroll Atas:</span>
          </span>
          <div
            ref={topSyncBarRef}
            onScroll={handleTopBarScroll}
            className="overflow-x-scroll overflow-y-hidden flex-1 h-3 bg-sky-200/60 dark:bg-slate-700/60 rounded-full cursor-ew-resize"
            style={{ scrollbarWidth: "thin" }}
          >
            <div style={{ width: `${contentWidth}px`, height: "1px" }} />
          </div>
        </div>
      )}

      {/* Main Table Viewport Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto w-full transition-all ${
          isHeightLocked
            ? (defaultMaxHeight || "max-h-[60vh] overflow-y-auto")
            : ""
        } ${tableContainerClassName}`}
        tabIndex={0}
        aria-label="Tabel Data Sarpras dengan Scroll Bar Standby"
      >
        {children}
      </div>

      {/* Bottom Scrollbar: Rendered in normal flow when docked */}
      {hasOverflow && !isFloating && renderController(false)}

      {/* Floating Bottom Scrollbar: Rendered via Portal at viewport bottom when table rows extend below screen */}
      {hasOverflow &&
        isFloating &&
        isInView &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${floatingRect.left}px`,
              width: `${floatingRect.width}px`,
              bottom: `${floatingRect.bottom}px`,
              zIndex: 39,
            }}
            className="animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {renderController(true)}
          </div>,
          document.body
        )}
    </div>
  );
}
