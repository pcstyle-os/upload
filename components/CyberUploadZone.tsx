"use client";

import React, { useState, useCallback, useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    X,
    Check,
    FileImage,
    FileVideo,
    FileText,
    File,
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
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage;
    if (type.startsWith("video/")) return FileVideo;
    if (type === "application/pdf") return FileText;
    return File;
};

export const CyberUploadZone = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload, isUploading, routeConfig } = useUploadThing(
        "fileUploader",
        {
            onClientUploadComplete: (res) => {
                const newFiles: UploadedFile[] = res.map((r) => ({
                    name: r.name,
                    size: r.size,
                    url: r.ufsUrl,
                    type: files.find((f) => f.name === r.name)?.type || "application/octet-stream",
                    uploadedAt: new Date().toISOString(),
                }));
                setUploadedFiles((prev) => [...prev, ...newFiles]);
                setFiles([]);
                setError(null);
            },
            onUploadError: (err) => {
                setError(err.message);
            },
        }
    );

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
        <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Drop Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative border-2 border-dashed rounded-lg p-12 transition-all duration-300 ${isDragging
                        ? "border-[#ff00ff] bg-[#ff00ff]/10 shadow-[0_0_30px_#ff00ff44]"
                        : "border-[#ff00ff]/30 bg-black/50 hover:border-[#ff00ff]/60 hover:bg-[#ff00ff]/5"
                    } backdrop-blur-xl`}
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
                    <motion.div
                        animate={{
                            scale: isDragging ? 1.1 : 1,
                            rotate: isDragging ? 180 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-6 rounded-full border ${isDragging
                                ? "border-[#ff00ff] bg-[#ff00ff]/20"
                                : "border-[#ff00ff]/40 bg-[#ff00ff]/10"
                            }`}
                    >
                        <Upload
                            className={`w-10 h-10 ${isDragging ? "text-[#ff00ff]" : "text-[#ff00ff]/70"
                                }`}
                        />
                    </motion.div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white uppercase tracking-[0.2em]">
                            {isDragging ? "DROP_FILES" : "UPLOAD_FILES"}
                        </h3>
                        <p className="text-gray-500 text-sm font-mono">
                            Drag & drop files here or{" "}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[#ff00ff] hover:text-white transition-colors underline underline-offset-4"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-gray-700 text-xs font-mono uppercase tracking-wider">
                            Images • Videos • PDFs • Up to 256MB
                        </p>
                    </div>
                </div>

                {/* Glitch border effect when dragging */}
                {isDragging && (
                    <div className="absolute inset-0 pointer-events-none animate-pulse">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent" />
                        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#ff00ff] to-transparent" />
                        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-[#ff00ff] to-transparent" />
                    </div>
                )}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-400 text-sm font-mono">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Files to Upload */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-[#ff00ff] uppercase tracking-[0.2em]">
                                QUEUE [{files.length}]
                            </h4>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className={`px-6 py-2 bg-[#ff00ff] text-black font-bold uppercase tracking-wide text-sm transition-all duration-300 ${isUploading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-white hover:shadow-[0_0_20px_#ff00ff] active:scale-95"
                                    }`}
                            >
                                {isUploading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        UPLOADING...
                                    </span>
                                ) : (
                                    "INITIATE_UPLOAD"
                                )}
                            </button>
                        </div>

                        <div className="space-y-2">
                            {files.map((file, index) => {
                                const Icon = getFileIcon(file.type);
                                return (
                                    <motion.div
                                        key={`${file.name}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 p-4 bg-black/50 border border-[#ff00ff]/20 rounded-lg backdrop-blur-sm group hover:border-[#ff00ff]/50 transition-colors"
                                    >
                                        <div className="p-2 bg-[#ff00ff]/10 rounded-lg">
                                            <Icon className="w-5 h-5 text-[#ff00ff]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-mono truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            disabled={isUploading}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Uploaded Files */}
            <AnimatePresence>
                {uploadedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            UPLOADED [{uploadedFiles.length}]
                        </h4>

                        <div className="space-y-2">
                            {uploadedFiles.map((file, index) => {
                                const Icon = getFileIcon(file.type);
                                const isCopied = copiedUrl === file.url;
                                return (
                                    <motion.div
                                        key={`uploaded-${file.name}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-4 p-4 bg-green-500/5 border border-green-500/30 rounded-lg backdrop-blur-sm group hover:border-green-500/50 transition-colors"
                                    >
                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                            <Icon className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-mono truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyToClipboard(file.url)}
                                                className={`p-2 rounded-lg transition-all ${isCopied
                                                        ? "bg-green-500/20 text-green-400"
                                                        : "text-gray-500 hover:text-white hover:bg-white/10"
                                                    }`}
                                                title="Copy URL"
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
                                                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                                title="Open file"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => removeUploadedFile(index)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Remove from list"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
