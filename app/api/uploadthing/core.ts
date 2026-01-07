import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for upload endpoints
export const ourFileRouter = {
    // General file uploader - supports images, videos, PDFs, etc.
    fileUploader: f({
        image: { maxFileSize: "16MB", maxFileCount: 10 },
        video: { maxFileSize: "256MB", maxFileCount: 5 },
        pdf: { maxFileSize: "32MB", maxFileCount: 10 },
        blob: { maxFileSize: "64MB", maxFileCount: 10 },
    })
        .middleware(async ({ req }) => {
            // Add auth logic here if needed
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete:", file.name);
            return {
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                uploadedAt: metadata.uploadedAt
            };
        }),

    // Image-only uploader with optimization
    imageUploader: f({
        image: { maxFileSize: "8MB", maxFileCount: 20 },
    })
        .middleware(async ({ req }) => {
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Image uploaded:", file.name);
            return {
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                uploadedAt: metadata.uploadedAt
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
