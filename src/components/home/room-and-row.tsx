"use client";

import { useEffect, useRef } from "react";
import { PHOTOS, type StoryPhoto } from "@/lib/photos";

const ROOM = [PHOTOS.rescueDog, PHOTOS.wildcatKitten, PHOTOS.elephantCalf, PHOTOS.falconClinic];

export function RoomPhoto() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const frames = [...node.querySelectorAll<HTMLElement>(".room-frame")];
    const sync = () => {
      const state = document.hidden ? "paused" : "running";
      for (const frame of frames) frame.style.animationPlayState = state;
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div ref={root} className="room">
      {ROOM.map((photo, index) => (
        <img
          key={photo.src}
          src={photo.src}
          alt={index === 0 ? photo.alt : ""}
          width={1200}
          height={1500}
          className="room-frame"
          style={{ objectPosition: photo.focus }}
        />
      ))}
    </div>
  );
}

export type Moment = {
  caption: string;
  body: string;
  photo: StoryPhoto;
  gap: number;
};

export function MomentRow({ moments }: { moments: Moment[] }) {
  return (
    <div className="px-5 sm:px-8">
      <h2 className="arrive text-[length:var(--step-head)]">From the street</h2>
      <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {moments.map((moment, index) => (
          <article key={moment.caption} className="arrive min-w-0" style={{ animationDelay: `${index * 80}ms` }}>
            <img
              src={moment.photo.src}
              alt={moment.photo.alt}
              width={280}
              height={350}
              className="aspect-[4/5] w-full object-cover"
              style={{ objectPosition: moment.photo.focus }}
            />
            <h3 className="mt-3 text-base">{moment.caption}</h3>
            <p className="mt-2 text-base leading-relaxed">{moment.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
