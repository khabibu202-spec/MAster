import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import { Download, Upload, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface DataActionsProps {
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onImport?: () => void;
  className?: string;
}

export function DataActions({ onExportExcel, onExportCsv, onExportPdf, onImport, className }: DataActionsProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {onImport && (
        <Button 
          variant="ghost" 
          onClick={onImport} 
          className="border-0 border-none shadow-none bg-transparent hover:bg-white dark:hover:bg-slate-700 text-slate-950 dark:text-slate-100 touch-target h-9 sm:h-10 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center transition-all"
        >
          <Upload className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#000000' }} />
          Impor
        </Button>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          onClick={() => setIsExportOpen(!isExportOpen)} 
          className="border-0 border-none shadow-none bg-transparent hover:bg-white dark:hover:bg-slate-700 text-slate-950 dark:text-slate-100 touch-target h-9 sm:h-10 px-3 sm:px-3.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center transition-all"
        >
          <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-950" />
          Ekspor
          <ChevronDown className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
        </Button>

        {isExportOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl bg-white dark:bg-slate-800 border-0 border-none z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ring-1 ring-black/5">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                onClick={() => { onExportExcel?.(); setIsExportOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center touch-target transition-colors"
              >
                <FileSpreadsheet className="mr-2.5 h-4 w-4 text-emerald-600" />
                Excel (.xlsx)
              </button>
              <button
                onClick={() => { onExportCsv?.(); setIsExportOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center touch-target transition-colors"
              >
                <FileText className="mr-2.5 h-4 w-4 text-amber-600" />
                CSV (.csv)
              </button>
              <button
                onClick={() => { onExportPdf?.(); setIsExportOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center touch-target transition-colors"
              >
                <FileText className="mr-2.5 h-4 w-4 text-rose-600" />
                PDF (.pdf)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
