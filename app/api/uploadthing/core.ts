import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for upload endpoints
export const ourFileRouter = {
    // General file uploader - supports images, videos, PDFs, etc.
    fileUploader: f({
        image: { maxFileSize: "1GB", maxFileCount: 10 },
        video: { maxFileSize: "1GB", maxFileCount: 5 },
        pdf: { maxFileSize: "1GB", maxFileCount: 10 },
        blob: { maxFileSize: "1GB", maxFileCount: 10 },
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
        image: { maxFileSize: "1GB", maxFileCount: 20 },
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
