# upload.pcstyle.dev

Next.js uploader with file/image paste, drag-and-drop, previews and private Backblaze B2 storage. Existing UploadThing links remain readable; new uploads only use B2.

## Local development

Install with `bun install`, then run `bun dev`. Store these server-only values in the git-ignored `.env.local`:

```env
B2_KEY_ID=your_application_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET=your_bucket_name
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_REGION=eu-central-003
```

Find the endpoint under **B2 Cloud Storage → Buckets**. The region is the part between `s3.` and `.backblazeb2.com`. Create a bucket-restricted read/write application key under **Application Keys**; do not use the master key. Keep the bucket private.

Files queue locally until the user clicks upload. `/api/uploads` issues a 15-minute, size-bound signed PUT URL; the browser sends the file directly to B2. Completion verifies the stored object before returning its preview and short links. Downloads also go directly to B2, avoiding Vercel's body-size limits. Credentials never reach the browser.

Up to 100 files can share one upload batch. Completing a multi-file batch creates a private B2 manifest and one short link to `/c/[key]`, with image thumbnails and individual preview/download links. Each file keeps its own expiry; expired entries lose their links, and the collection expires with its last file. Manifests use the 90-day cleanup prefix. Failed batches keep their queue and reuse already uploaded objects when retried.

## Retention and bucket configuration

| File size | Lifetime | B2 object prefix |
| --- | --- | --- |
| ≤10 MiB | 90 days | `uploads/90d/` |
| >10 MiB, ≤100 MiB | 30 days | `uploads/30d/` |
| >100 MiB, ≤1 GiB | 7 days | `uploads/7d/` |

The server chooses the tier, and app links expire at the timestamp in the object key. Signed download URLs last at most one hour and never beyond that timestamp. No database or expiry cron is needed.

Configure B2 lifecycle rules for each prefix: `daysFromUploadingToHiding` equals its lifetime, `daysFromHidingToDeleting` is 1, and `daysFromStartingToCancelingUnfinishedLargeFiles` is 1. B2 runs lifecycle processing daily, so physical deletion happens after link expiry, not at its exact second. These rules apply only to the new upload prefixes.

Browser uploads need a B2 CORS rule allowing `s3_put`, `s3_get` and `s3_head`, all request headers, and exposing `ETag`, `Content-Length`, `Content-Range` and `Content-Disposition`. The configured rule permits any origin so local and Vercel Preview URLs work; the bucket remains private and requests still require a valid signed URL.

Set the same five variables as Secrets in the Vercel uploader project's **Production** and **Preview** environments. Environment changes apply to subsequent deployments; setting variables does not deploy code.

## Checks

```bash
bun test lib/files.test.ts
bun run lint
bun run build
```
