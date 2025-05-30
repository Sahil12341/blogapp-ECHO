import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const updateArticleSchema = z.object({
  title: z.string().min(3).max(100),
  category: z.string().min(3).max(50),
  content: z.string().min(10),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to update an article." },
        { status: 401 }
      );
    }

    const articleId = params.id;
    const formData = await req.formData();

    const result = updateArticleSchema.safeParse({
      title: formData.get("title"),
      category: formData.get("category"),
      content: formData.get("content"),
    });

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingArticle = await prisma.post.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || existingArticle.authorId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to edit this article." },
        { status: 403 }
      );
    }

    let imageUrl = existingArticle.featuredImage;
    const imageFile = formData.get("featuredImage");

    if (
      imageFile instanceof File &&
      imageFile.name !== "" &&
      imageFile.size > 0
    ) {
      try {
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
      } catch (err) {
        return NextResponse.json(
          { error: "Image upload error: " + (err as Error).message },
          { status: 500 }
        );
      }
    } else {
      imageUrl = existingArticle.featuredImage;
    }

    await prisma.post.update({
      where: { id: articleId },
      data: {
        title: result.data.title,
        category: result.data.category,
        content: result.data.content,
        featuredImage: imageUrl,
      },
    });

    return NextResponse.json({ message: "Article updated successfully." });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
