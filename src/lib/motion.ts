export const easePremium = [0.22, 1, 0.36, 1] as const;

export const springSoft = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.8 };

export const springSnappy = { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.65 };

export const liquidSpring = { type: "spring" as const, stiffness: 280, damping: 26, mass: 0.95 };

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeUpTransition = (delay = 0) => ({
  duration: 0.65,
  ease: easePremium,
  delay
});

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easePremium } }
};

export const hoverLift =
  "transition-all duration-300 hover:-translate-y-1 hover:shadow-md";
