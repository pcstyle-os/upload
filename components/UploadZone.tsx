"use client";

import React, { useState, useCallback, useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { previewKind, previewUrl } from "@/lib/files";
import { Pix } from "./Pix";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  downloadUrl: string;
  shortened: boolean;
  type: string;
  uploadedAt: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " b";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " kb";
  return (bytes / (1024 * 1024)).toFixed(2) + " mb";
};

const fileKind = (type: string, name: string): string => {
  if (previewKind(name, type) === "html") return "html";
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
        url: r.serverData?.shareUrl || previewUrl(r),
        downloadUrl: `/api/files/${encodeURIComponent(r.key)}?${new URLSearchParams({ name: r.name, download: "1" })}`,
        shortened: r.serverData?.shortened ?? false,
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
    <div>
      <div
        className={isDragging ? "drop on" : "drop"}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          hidden
          accept="image/*,video/*,.pdf,.html,.htm,text/html"
        />
        <Pix name="upload" className="tile" />
        <p>
          {isDragging ? (
            <span className="ok">release to queue files</span>
          ) : (
            <>
              drag &amp; drop files here, or{" "}
              <button type="button" className="lnk" onClick={() => fileInputRef.current?.click()}>
                browse
              </button>
            </>
          )}
        </p>
        <p className="hint">images · videos · pdfs · html · up to 1gb per file</p>
      </div>

      {error && (
        <p className="err" role="alert">
          {error}
          <button type="button" className="ico" onClick={() => setError(null)} aria-label="dismiss error">
            <Pix name="x" />
          </button>
        </p>
      )}

      {files.length > 0 && (
        <>
          <h3 className="sect">
            queue ({files.length})
            <button type="button" className="btn" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "uploading…" : "upload →"}
            </button>
          </h3>
          <ul className="rows">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span className="kind">{fileKind(file.type, file.name)}</span>
                <span className="main"><span className="name">{file.name}</span></span>
                <span className="meta">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  className="ico del"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  aria-label={`remove ${file.name} from queue`}
                >
                  <Pix name="x" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {uploadedFiles.length > 0 && (
        <>
          <h3 className="sect">uploaded ({uploadedFiles.length})</h3>
          <ul className="rows">
            {uploadedFiles.map((file, index) => {
              const isCopied = copiedUrl === file.url;
              return (
                <li key={`uploaded-${file.name}-${index}`}>
                  <span className="kind">{fileKind(file.type, file.name)}</span>
                  <span className="main">
                    <a className="name" href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.url.replace(/^https:\/\//, "")}
                    </a>
                    <span className="sub">
                      {file.name} · {formatFileSize(file.size)}
                      {!file.shortened && " · short link unavailable, preview link ready"}
                    </span>
                  </span>
                  <span className="acts">
                    <button
                      type="button"
                      className={isCopied ? "ico on" : "ico"}
                      onClick={() => copyToClipboard(file.url)}
                      aria-label="copy share link"
                      title="copy share link"
                    >
                      <Pix name={isCopied ? "check" : "copy"} />
                    </button>
                    <a className="ico" href={file.url} target="_blank" rel="noopener noreferrer" aria-label="open preview" title="open preview">
                      <Pix name="open" />
                    </a>
                    <a className="ico" href={file.downloadUrl} aria-label="download file" title="download file">
                      <Pix name="download" />
                    </a>
                    <button
                      type="button"
                      className="ico del"
                      onClick={() => removeUploadedFile(index)}
                      aria-label="remove from list"
                      title="remove from list"
                    >
                      <Pix name="trash" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
