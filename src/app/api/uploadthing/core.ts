import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSession } from "@/lib/auth";

const f = createUploadthing();

async function requireSession() {
  const session = await getSession();
  if (!session) throw new UploadThingError("You need to be signed in to upload files.");
  return { userId: session.sub, role: session.role };
}

export const fileRouter = {
  caseImage: f({ image: { maxFileSize: "8MB", maxFileCount: 6 } })
    .middleware(requireSession)
    .onUploadComplete(({ file, metadata }) => ({ url: file.ufsUrl, key: file.key, uploadedBy: metadata.userId })),

  receipt: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(requireSession)
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),

  vetLicense: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await requireSession();
      if (session.role !== "vet") throw new UploadThingError("Only vets can upload a license.");
      return session;
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
