"use client";

import { useEffect, useRef, useState } from "react";
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
  const scroller = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  function measure() {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max <= 0 ? 1 : el.scrollLeft / max);
  }

  function step(dir: number) {
    scroller.current?.scrollBy({ left: dir * 312, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4 px-8">
        <h2 className="arrive text-[length:var(--step-head)]">From the street</h2>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous moment" onClick={() => step(-1)} className="size-12 bg-[#333231] text-[#eeecea]">
            ←
          </button>
          <button type="button" aria-label="Next moment" onClick={() => step(1)} className="size-12 bg-[#333231] text-[#eeecea]">
            →
          </button>
        </div>
      </div>
      <div className="mx-8 h-1.5 bg-[#cdc3b6]">
        <div className="h-full bg-[#333231]" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div
        ref={scroller}
        onScroll={measure}
        className="mt-6 flex gap-8 overflow-x-auto pb-2"
      >
        <div className="w-8 shrink-0" aria-hidden />
        {moments.map((moment, index) => (
          <article key={moment.caption} className="arrive w-[280px] shrink-0 snap-start" style={{ animationDelay: `${index * 80}ms` }}>
            <h3 className="text-base">{moment.caption}</h3>
            <p className="mt-2 text-base leading-relaxed">{moment.body}</p>
            <div style={{ height: moment.gap }} />
            <img
              src={moment.photo.src}
              alt={moment.photo.alt}
              width={280}
              height={350}
              className="aspect-[4/5] w-full object-cover"
              style={{ objectPosition: moment.photo.focus }}
            />
          </article>
        ))}
        <div className="w-8 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
