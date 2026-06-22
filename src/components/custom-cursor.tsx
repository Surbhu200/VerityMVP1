"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.55 });
  const springY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.55 });
  const tailX = useSpring(x, { stiffness: 120, damping: 24, mass: 0.8 });
  const tailY = useSpring(y, { stiffness: 120, damping: 24, mass: 0.8 });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <>
      <motion.div
        aria-hidden
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-50 h-8 w-8 rounded-full border border-coral/80"
        style={{
          x: tailX,
          y: tailY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 0.8 : 0
        }}
      />
      <motion.div
        aria-hidden
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-50 h-2.5 w-2.5 rounded-full bg-coral"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: visible ? 1 : 0
        }}
      />
    </>
  );
}
