import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Hapus",
  message = "Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.",
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-700">{message}</p>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-300 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" variant="destructive" onClick={() => {
            onConfirm();
            onClose();
          }}>
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}
