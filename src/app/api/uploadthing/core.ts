import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";
 
const f = createUploadthing();
 
// ADD 'export' HERE
export const ourFileRouter = {
  Image: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await auth();
      // Only admins/superadmins can upload room photos
      if (!session || (session.user?.role !== "superadmin" && session.user?.role !== "admin")) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;