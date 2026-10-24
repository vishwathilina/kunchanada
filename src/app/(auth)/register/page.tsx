import type { Metadata } from "next";
import { StoryFrame } from "@/components/media/story-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTOS } from "@/lib/photos";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Join Kunchanada" };

export default function RegisterPage() {
  return (
    <div className="grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
    <StoryFrame photo={PHOTOS.raccoonCare} className="sticky top-20 hidden aspect-[3/4] rounded-3xl lg:block" sizes="240px" />
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Join the rescue network</CardTitle>
        <CardDescription>
          Tell us who you are and where you are, so we can alert you when an animal near you needs help.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
    </div>
  );
}
