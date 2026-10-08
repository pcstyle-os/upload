import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createShareLink } from "@/lib/share";

const f = createUploadthing();

// FileRouter for upload endpoints
export const ourFileRouter = {
    // HTML and other files use the blob rule; every type allows up to 1 GB.
    fileUploader: f({
        image: { maxFileSize: "1GB", maxFileCount: 10 },
        video: { maxFileSize: "1GB", maxFileCount: 5 },
        pdf: { maxFileSize: "1GB", maxFileCount: 10 },
        blob: { maxFileSize: "1GB", maxFileCount: 10 },
    })
        .middleware(async () => {
            // Add auth logic here if needed
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete:", file.name);
            return {
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                uploadedAt: metadata.uploadedAt,
                ...await createShareLink(file),
            };
        }),

    // Image-only uploader with optimization
    imageUploader: f({
        image: { maxFileSize: "1GB", maxFileCount: 20 },
    })
        .middleware(async () => {
            return { uploadedAt: new Date().toISOString() };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Image uploaded:", file.name);
            return {
                url: file.ufsUrl,
                name: file.name,
                size: file.size,
                uploadedAt: metadata.uploadedAt,
                ...await createShareLink(file),
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
