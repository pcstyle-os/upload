"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { directUrl, formatFileSize, previewKind } from "@/lib/files";
import { MAX_BATCH_FILES, MAX_FILE_SIZE, retentionDays } from "@/lib/retention";
import { Pix } from "./Pix";
import { FileLinks } from "./FileLinks";

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  directUrl?: string;
  downloadUrl?: string;
  count?: number;
  shortened: boolean;
  type: string;
  expiresAt: string;
}

const fileKind = (type: string, name: string): string => {
  return { html: "html", image: "img", video: "vid", audio: "aud", pdf: "pdf", text: "txt", archive: "zip", other: "bin" }[previewKind(name, type)];
};

export const UploadZone = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stagedUploads = useRef(new Map<File, string>());

  const queueFiles = useCallback((incoming: File[]) => {
    if (isUploading) return;
    const valid = incoming.filter(file => file.size <= MAX_FILE_SIZE);
    setFiles(prev => [...prev, ...valid].slice(0, MAX_BATCH_FILES));
    setError(files.length + valid.length > MAX_BATCH_FILES ? "up to 100 files per batch" :
      valid.length !== incoming.length ? "files larger than 1 GiB were not added" : null);
  }, [isUploading, files.length]);

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable='true']")) return;
      const incoming = Array.from(event.clipboardData?.files ?? []);
      if (!incoming.length || isUploading) return;
      event.preventDefault();
      queueFiles(incoming);
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [queueFiles, isUploading]);

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
    queueFiles(droppedFiles);
  }, [queueFiles]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        queueFiles(selectedFiles);
        e.target.value = "";
      }
    },
    [queueFiles]
  );

  const removeFile = useCallback((index: number) => {
    stagedUploads.current.delete(files[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, [files]);

  const handleUpload = useCallback(async () => {
    if (isUploading || !files.length) return;
    setIsUploading(true);
    setError(null);
    try {
      const keys: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`uploading ${index + 1}/${files.length}…`);
        const staged = stagedUploads.current.get(file);
        if (staged) {
          keys.push(staged);
          continue;
        }
        const prepared = await fetch("/api/uploads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "prepare", name: file.name, size: file.size, type: file.type }),
        });
        const upload = await prepared.json();
        if (!prepared.ok) throw new Error(upload.error);
        const sent = await fetch(upload.url, { method: "PUT", headers: upload.headers, body: file });
        if (!sent.ok) throw new Error(`could not upload ${file.name}; please try again`);
        stagedUploads.current.set(file, upload.key);
        keys.push(upload.key);
      }
      setProgress("creating share link…");
      const completed = await fetch("/api/uploads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", keys }),
      });
      const result = await completed.json();
      if (!completed.ok) throw new Error(result.error);
      setUploadedFiles(prev => [...prev, { ...result, url: result.shareUrl,
        directUrl: result.count ? undefined : directUrl(result),
        downloadUrl: result.count ? undefined : directUrl(result, true) }]);
      setFiles([]);
      stagedUploads.current.clear();
    } catch (error) {
      setError(error instanceof Error ? error.message : "upload failed; please try again");
    } finally {
      setIsUploading(false);
      setProgress("");
    }
  }, [files, isUploading]);

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
          disabled={isUploading}
          hidden
        />
        <Pix name="upload" className="tile" />
        <p>
          {isDragging ? (
            <span className="ok">release to queue files</span>
          ) : (
            <>
              drop files, paste with ctrl/⌘+v, or{" "}
              <button type="button" className="lnk" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                browse
              </button>
            </>
          )}
        </p>
        <p className="hint">any file · up to 1gb per file · previews for images, video, audio, pdf, text, zip &amp; html</p>
        <p className="hint">expires: ≤10mb → 90d · ≤100mb → 30d · larger → 7d</p>
        <p className="hint">up to 100 files · one preview link for the whole batch</p>
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
              {isUploading ? progress : "upload →"}
            </button>
          </h3>
          <ul className="rows">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span className="kind">{fileKind(file.type, file.name)}</span>
                <span className="main"><span className="name">{file.name}</span></span>
                <span className="meta">{formatFileSize(file.size)} · {retentionDays(file.size)}d</span>
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
              return (
                <li key={`uploaded-${file.name}-${index}`}>
                  <span className="kind">{file.count ? "set" : fileKind(file.type, file.name)}</span>
                  <div className="main">
                    <a className="name" href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.url.replace(/^https:\/\//, "")}
                    </a>
                    <span className="sub">
                      {file.name} · {formatFileSize(file.size)}
                      {` · expires ${new Date(file.expiresAt).toLocaleDateString()}`}
                      {!file.shortened && " · short link unavailable, preview link ready"}
                    </span>
                    <FileLinks preview={file.url} direct={file.directUrl} download={file.downloadUrl} />
                  </div>
                  <span className="acts">
                    <a className="ico" href={file.url} target="_blank" rel="noopener noreferrer" aria-label="open preview" title="open preview">
                      <Pix name="open" />
                    </a>
                    {file.downloadUrl && <a className="ico" href={file.downloadUrl} aria-label="download file" title="download file">
                      <Pix name="download" />
                    </a>}
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
