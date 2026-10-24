"use client";

import { ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitLicenseAction } from "@/actions/profile";
import { FileUploadButton } from "@/components/uploads/file-upload-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LicenseCard({
  licenseNumber,
  clinicName,
  verifiedAt,
  rejectedReason,
  licenseDocUrl,
}: {
  licenseNumber: string;
  clinicName: string | null;
  verifiedAt: Date | null;
  rejectedReason: string | null;
  licenseDocUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(licenseDocUrl);
  const [pending, start] = useTransition();

  if (verifiedAt) {
    return (
      <Alert>
        <ShieldCheck />
        <AlertTitle>Verified veterinarian</AlertTitle>
        <AlertDescription>
          License {licenseNumber}
          {clinicName ? ` · ${clinicName}` : ""}. You can claim vet slots and appear in emergency contacts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">Veterinary license</p>
        <p className="text-sm text-muted-foreground">
          License {licenseNumber}
          {clinicName ? ` · ${clinicName}` : ""}. Upload a scan so an admin can verify you.
        </p>
      </div>
      {rejectedReason && (
        <Alert variant="destructive">
          <AlertTitle>Verification was declined</AlertTitle>
          <AlertDescription>{rejectedReason}</AlertDescription>
        </Alert>
      )}
      <FileUploadButton endpoint="vetLicense" value={url} onChange={setUrl} label="Upload license" />
      {url && url !== licenseDocUrl && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await submitLicenseAction(url);
              if (res.ok) toast.success(res.message);
              else toast.error(res.error ?? "Could not submit license.");
            })
          }
        >
          Submit for review
        </Button>
      )}
    </div>
  );
}
