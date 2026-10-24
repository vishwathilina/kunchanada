import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StoryPhoto } from "@/lib/photos";

export function StoryFrame({
  photo,
  className,
  imgClassName,
  priority,
  sizes = "(min-width: 1024px) 640px, 100vw",
  children,
}: {
  photo: StoryPhoto;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure className={cn("group relative overflow-hidden bg-primary/10", className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("story-zoom object-cover", imgClassName)}
        style={{ objectPosition: photo.focus ?? "center" }}
      />
      {children}
    </figure>
  );
}
