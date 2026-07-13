"use client";

import React, { useState, useCallback, useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  type: string;
  uploadedAt: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " b";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " kb";
  return (bytes / (1024 * 1024)).toFixed(2) + " mb";
};

const fileKind = (type: string): string => {
  if (type.startsWith("image/")) return "img";
  if (type.startsWith("video/")) return "vid";
  if (type === "application/pdf") return "pdf";
  return "bin";
};

export const UploadZone = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    onClientUploadComplete: (res) => {
      const newFiles: UploadedFile[] = res.map((r) => ({
        name: r.name,
        size: r.size,
        url: r.ufsUrl,
        type:
          files.find((f) => f.name === r.name)?.type ||
          "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setFiles([]);
      setError(null);
    },
    onUploadError: (err) => {
      setError(err.message);
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    setError(null);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
        setError(null);
      }
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (files.length > 0) {
      startUpload(files);
    }
  }, [files, startUpload]);

  const copyToClipboard = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-8">
      {/* drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative border border-dashed rounded-lg p-12 transition-colors duration-200 ${
          isDragging
            ? "border-accent bg-accent-dim/10"
            : "border-hairline hover:border-faint"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Upload
            className={`w-7 h-7 transition-colors ${
              isDragging ? "text-accent" : "text-faint"
            }`}
          />
          <div className="space-y-2">
            <p className="text-sm text-muted">
              {isDragging ? (
                <span className="text-accent">release to queue files</span>
              ) : (
                <>
                  drag &amp; drop files here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-accent underline underline-offset-4 decoration-accent-dim hover:text-foreground transition-colors"
                  >
                    browse
                  </button>
                </>
              )}
            </p>
            <p className="text-xs text-faint">
              images · videos · pdfs · up to 256mb
            </p>
          </div>
        </div>
      </motion.div>

      {/* error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-red-900/60 bg-red-950/30 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* queue */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm text-muted">
                <span className="text-accent-dim">›</span> queue ({files.length}
                )
              </h4>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`px-4 py-2 text-sm font-semibold rounded-md text-white bg-gradient-to-r from-accent-dim to-accent transition-opacity ${
                  isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90 active:opacity-80"
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    uploading…
                  </span>
                ) : (
                  "upload →"
                )}
              </button>
            </div>

            <ul className="border border-hairline rounded-lg divide-y divide-hairline">
              {files.map((file, index) => (
                <motion.li
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 group"
                >
                  <span className="text-xs text-accent-dim w-8">
                    {fileKind(file.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                  </div>
                  <span className="text-xs text-faint">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* uploaded */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h4 className="text-sm text-muted flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              uploaded ({uploadedFiles.length})
            </h4>

            <ul className="border border-hairline rounded-lg divide-y divide-hairline">
              {uploadedFiles.map((file, index) => {
                const isCopied = copiedUrl === file.url;
                return (
                  <motion.li
                    key={`uploaded-${file.name}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <span className="text-xs text-accent w-8">
                      {fileKind(file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-faint">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        className={`p-2 rounded transition-colors ${
                          isCopied
                            ? "text-accent"
                            : "text-faint hover:text-foreground"
                        }`}
                        title="copy url"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-faint hover:text-foreground rounded transition-colors"
                        title="open file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => removeUploadedFile(index)}
                        className="p-2 text-faint hover:text-red-400 rounded transition-colors"
                        title="remove from list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
