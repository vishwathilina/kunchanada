"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/lib/uploadthing";

export type UploadedImage = { url: string; key?: string };

export function ImageUploader({
  value,
  onChange,
  max = 6,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}) {
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState("");

  const addUrl = () => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error();
      onChange([...value, { url: parsed.toString() }].slice(0, max));
      setUrl("");
    } catch {
      toast.error("Enter a valid https image URL.");
    }
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {value.map((img, i) => (
            <div key={img.url} className="group relative aspect-square overflow-hidden bg-[#cdc3b6]">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview of arbitrary user-provided hosts */}
              <img src={img.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.url !== img.url))}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-90 hover:opacity-100"
                aria-label="Remove photo"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <UploadButton
          endpoint="caseImage"
          appearance={{
            container: "w-full items-start gap-2",
            button: "h-12 bg-[#5c6b54] px-5 text-base text-white ut-ready:bg-[#5c6b54] ut-uploading:bg-[#5c6b54]",
            allowedContent: "text-base text-[#333231]",
          }}
          content={{ button: "Add a photo", allowedContent: `Up to 8MB · ${max - value.length} left` }}
          onClientUploadComplete={(files) => {
            onChange([...value, ...files.map((f) => ({ url: f.ufsUrl, key: f.key }))].slice(0, max));
            toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} added`);
          }}
          onUploadError={(err) => {
            toast.error(err.message || "Upload failed");
          }}
        />
      )}

      <div>
        {showUrl ? (
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addUrl}>
              Add
            </Button>
          </div>
        ) : (
          <button type="button" className="text-base text-[#333231] underline" onClick={() => setShowUrl(true)}>
            Add a photo by link
          </button>
        )}
      </div>
    </div>
  );
}
