"use client";

import { FileCheck2, X } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";

export function FileUploadButton({
  endpoint,
  value,
  onChange,
  label = "Upload file",
}: {
  endpoint: "receipt" | "vetLicense";
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}) {
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
        <FileCheck2 className="size-4 text-green-600" />
        <a href={value} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
          File uploaded
        </a>
        <button type="button" className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => onChange(null)} aria-label="Remove file">
          <X className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <UploadButton
      endpoint={endpoint}
      className="items-start ut-button:h-8 ut-button:w-auto ut-button:rounded-lg ut-button:bg-secondary ut-button:px-3 ut-button:text-sm ut-button:text-secondary-foreground ut-allowed-content:text-xs"
      content={{ button: label }}
      onClientUploadComplete={(files) => {
        const f = files[0];
        if (f) onChange(f.ufsUrl);
      }}
      onUploadError={(err) => {
            toast.error(err.message || "Upload failed");
          }}
    />
  );
}
