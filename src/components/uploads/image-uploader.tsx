"use client";

import { Link2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDropzone } from "@/lib/uploadthing";

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
            <div key={img.url} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
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
        <UploadDropzone
          endpoint="caseImage"
          className="ut-button:bg-primary ut-label:text-primary ut-upload-icon:text-primary/60 border-dashed py-6"
          content={{ label: "Take or choose photos of the animal", allowedContent: `Images up to 8MB · ${max - value.length} remaining` }}
          onClientUploadComplete={(files) => {
            onChange([...value, ...files.map((f) => ({ url: f.ufsUrl, key: f.key }))].slice(0, max));
            toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
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
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowUrl(true)}
          >
            <Link2 className="size-3" /> Add a photo by link instead
          </button>
        )}
      </div>
    </div>
  );
}
