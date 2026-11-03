import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';

interface BarcodeDisplayProps {
  value: string;
  title?: string;
  subtitle?: string;
  roomName?: string;
}

export function BarcodeDisplay({ value, title, subtitle, roomName }: BarcodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!value) return null;

  const handleDownload = () => {
    if (!containerRef.current) return;
    
    // Get the SVG from react-qr-code
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Canvas dimensions for the downloaded image
    canvas.width = 300;
    canvas.height = 300;
    
    if (!ctx) return;

    img.onload = () => {
      // Draw background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      ctx.textAlign = "center";
      
      let y = 30;
      if (title) {
        ctx.fillStyle = "#1e293b"; // slate-800
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(title, canvas.width / 2, y);
        y += 24;
      }
      
      if (subtitle) {
        ctx.fillStyle = "#64748b"; // slate-500
        ctx.font = "14px sans-serif";
        ctx.fillText(subtitle, canvas.width / 2, y);
        y += 10;
      }
      
      if (roomName) {
        y += 5;
        ctx.fillStyle = "#334155"; // slate-700
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`🏢 ${roomName}`, canvas.width / 2, y);
        y += 10;
      }
      
      // Calculate position to center the barcode
      const xPos = (canvas.width - img.width) / 2;
      
      // Draw barcode image
      ctx.drawImage(img, xPos, y);
      
      y += img.height + 25;
      
      // Add footer text
      ctx.fillStyle = "#94a3b8"; // slate-400
      ctx.font = "10px sans-serif";
      ctx.fillText("Pindai QR code ini untuk melihat detail", canvas.width / 2, y);

      // Trigger download
      const a = document.createElement("a");
      a.download = `qrcode-${value}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex items-center justify-center p-4 bg-white border border-slate-300 rounded-lg relative group">
      <div className="flex flex-col items-center justify-center w-full">
        <div 
          ref={containerRef} 
          className="flex flex-col items-center justify-center bg-white p-4 w-full"
        >
          {title && <div className="text-sm font-bold text-slate-800 mb-1 text-center">{title}</div>}
          {subtitle && <div className="text-xs text-slate-700 mb-2 text-center">{subtitle}</div>}
          {roomName && <div className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full mb-3 mb text-center inline-flex items-center gap-1 border border-slate-300">🏢 {roomName}</div>}
          <div className="bg-white p-2">
            <QRCode value={value} size={120} />
          </div>
          <div className="mt-3 text-[10px] text-slate-600 text-center max-w-[200px]">
            Pindai QR code ini untuk melihat detail
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          className="mt-2 text-xs flex items-center justify-center gap-1 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors border border-slate-300"
        >
          <Download className="w-3 h-3" /> Download QR Code
        </button>
      </div>
    </div>
  );
}

