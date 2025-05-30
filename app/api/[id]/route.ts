import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";

const updateArticleSchema = z.object({
  title: z.string().min(3).max(100),
  category: z.string().min(3).max(50),
  content: z.string().min(10),
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;
    const imageFile = formData.get("featuredImage");

    // ✅ Validate inputs (basic check)
    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "Title, category, and content are required." },
        { status: 400 }
      );
    }

    // ✅ Fetch existing article
    const existingArticle = await prisma.post.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    let imageUrl = existingArticle.featuredImage;

    // ✅ Check for actual image file upload
    if (
      imageFile instanceof File &&
      imageFile.name !== "" &&
      imageFile.size > 0
    ) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      if (uploadResult?.secure_url) {
        imageUrl = uploadResult.secure_url;
      } else {
        return NextResponse.json(
          { error: "Failed to upload image." },
          { status: 500 }
        );
      }
    }

    // ✅ Update article
    await prisma.post.update({
      where: { id: articleId },
      data: {
        title,
        category,
        content,
        featuredImage: imageUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
