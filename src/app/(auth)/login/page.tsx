import type { Metadata } from "next";
import { Suspense } from "react";
import { StoryFrame } from "@/components/media/story-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTOS } from "@/lib/photos";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-2">
    <StoryFrame photo={PHOTOS.hugDog} className="hidden h-full min-h-80 lg:block" sizes="420px" />
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to report, respond, and track the animals you&apos;ve helped.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoginForm />}>
          <LoginFormWithNext searchParams={props.searchParams} />
        </Suspense>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Demo accounts (password <code>password123</code>): admin@kunchanada.dev, priya@kunchanada.dev (vet),
            rahul@kunchanada.dev (volunteer)
          </p>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
