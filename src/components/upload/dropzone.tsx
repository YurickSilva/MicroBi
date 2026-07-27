"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function Dropzone({ onFileSelect, isLoading = false, error }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
            : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isLoading}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center p-6 space-y-3">
          <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-emerald-400">
            {isLoading ? (
              <FileSpreadsheet className="w-8 h-8 animate-bounce" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-200">
              {isLoading ? "Processando arquivo..." : "Arraste e solte seu arquivo CSV aqui"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              ou clique para selecionar do seu computador (.csv)
            </p>
          </div>
        </div>
      </label>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}