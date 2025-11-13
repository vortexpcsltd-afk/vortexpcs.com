import { PropsWithChildren, useEffect, useState } from "react";

type Direction = "up" | "down" | "left" | "right";

export function AnimateIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: PropsWithChildren<{
  delay?: number;
  direction?: Direction;
  className?: string;
}>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), Math.max(0, delay));
    return () => window.clearTimeout(id);
  }, [delay]);

  const translate =
    direction === "up"
      ? "translate-y-2"
      : direction === "down"
      ? "-translate-y-2"
      : direction === "left"
      ? "translate-x-2"
      : "-translate-x-2";

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${translate}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default AnimateIn;
