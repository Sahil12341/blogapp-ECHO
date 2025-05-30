"use client";
import React, { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const CreateArticlesPage = () => {
  const [content, setContent] = useState("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string[] }>({});
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    formData.append("content", content);

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setFormErrors(data.errors || { formErrors: [data.error || "Unknown error occurred"] });
      } else {

        router.push("/dashboard");
      }
    } catch (err: any) {
      setFormErrors({ formErrors: [err.message || "Submission failed"] });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
        </CardHeader>
        <CardContent>
          {formErrors.formErrors && (
            <div className="text-red-600 text-sm mb-4">
              {formErrors.formErrors[0]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="text"
                name="title"
                placeholder="Enter the article title"
              />
              {formErrors.title && (
                <span className="text-red-600 text-sm">
                  {formErrors.title[0]}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select
                name="category"
                id="category"
                className="flex h-10 w-full rounded-md"
              >
                <option value="">Select category</option>
                <option value="technology">Technology</option>
                <option value="fashion">Fashion</option>
                <option value="entertainment">Entertainment</option>
              </select>
              {formErrors.category && (
                <span className="text-red-600 text-sm">
                  {formErrors.category[0]}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image</Label>
              <Input
                type="file"
                id="featuredImage"
                name="featuredImage"
                accept="image/*"
              />
              {formErrors.featuredImage && (
                <span className="text-red-600 text-sm">
                  {formErrors.featuredImage[0]}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <ReactQuill theme="snow" value={content} onChange={setContent} />
              {formErrors.content && (
                <span className="text-red-600 text-sm">
                  {formErrors.content[0]}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant={"outline"} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Loading..." : "Publish Article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateArticlesPage;
