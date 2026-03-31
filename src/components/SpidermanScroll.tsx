"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";

const FRAME_COUNT = 120;

// ================= TEXT BEAT =================
const TextBeat = ({
  title,
  subtitle,
  start,
  end,
  progress,
}: {
  title: string;
  subtitle: string;
  start: number;
  end: number;
  progress: MotionValue<number>;
}) => {
  const opacity = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [20, 0, 0, -20]
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-10"
    >
      <h1 className="text-white/90 font-black text-5xl md:text-7xl lg:text-9xl uppercase tracking-tighter mb-4">
        {title}
      </h1>
      <p className="text-white/60 text-xl md:text-3xl font-medium">
        {subtitle}
      </p>
    </motion.div>
  );
};

// ================= MAIN =================
export default function SpidermanScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // ✅ Controlled scroll (slower + no hydration crash)
  const { scrollYProgress } = useScroll();

  // 🎬 Cinematic smoothing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 55,
    damping: 25,
    mass: 0.8,
  });

  // 🐢 Extra slow control
  const slowedProgress = useTransform(smoothProgress, (v) => v * 0.85);

  // ================= PRELOAD =================
  useEffect(() => {
    let loaded = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/spiderman/frame_${i}.webp`;

      img.onload = () => {
        loaded++;
        setLoadProgress(Math.floor((loaded / FRAME_COUNT) * 100));

        if (loaded === FRAME_COUNT) {
          setIsLoaded(true);
        }
      };

      img.onerror = () => {
        loaded++;
        if (loaded === FRAME_COUNT) {
          setIsLoaded(true);
        }
      };

      images.push(img);
    }

    imagesRef.current = images;

    return () => {
      imagesRef.current = [];
    };
  }, []);

  // ================= CANVAS =================
  useEffect(() => {
    if (!isLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = (progress: number) => {
      const index = Math.min(
        FRAME_COUNT - 1,
        Math.floor(progress * FRAME_COUNT)
      );

      const img = imagesRef.current[index];
      if (!img || !img.complete) return;

      const cw = canvas.width;
      const ch = canvas.height;

      const ir = img.width / img.height;
      const cr = cw / ch;

      let dw = cw;
      let dh = ch;
      let dx = 0;
      let dy = 0;

      if (cr > ir) {
        dh = cw / ir;
        dy = (ch - dh) / 2;
      } else {
        dw = ch * ir;
        dx = (cw - dw) / 2;
      }

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render(slowedProgress.get());
    };

    resize();
    window.addEventListener("resize", resize);

    const unsub = slowedProgress.on("change", render);

    return () => {
      window.removeEventListener("resize", resize);
      unsub();
    };
  }, [isLoaded, slowedProgress]);

  // ================= SCROLL INDICATOR =================
  const indicatorOpacity = useTransform(
    slowedProgress,
    [0, 0.05],
    [1, 0]
  );

  // ================= LOADER =================
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-[#e11d48]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-20 h-20 border-4 border-[#e11d48]/20 border-t-[#e11d48] rounded-full mb-6"
        />
        <p className="text-white/70 text-lg">{loadProgress}%</p>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#050505]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* TEXT */}
        <TextBeat
          title="With Great Power"
          subtitle="Comes great responsibility."
          start={0}
          end={0.2}
          progress={slowedProgress}
        />

        <TextBeat
          title="Every Hero Falls"
          subtitle="But not every hero rises again."
          start={0.25}
          end={0.45}
          progress={slowedProgress}
        />

        <TextBeat
          title="I Always Get Back Up"
          subtitle="No matter what it takes."
          start={0.5}
          end={0.7}
          progress={slowedProgress}
        />

        <TextBeat
          title="Friendly Neighborhood Hero"
          subtitle="New York will always have Spider-Man."
          start={0.75}
          end={0.95}
          progress={slowedProgress}
        />

        {/* SCROLL INDICATOR */}
        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-sm tracking-widest"
        >
          Scroll to Swing ↓
        </motion.div>
      </div>
    </div>
  );
}