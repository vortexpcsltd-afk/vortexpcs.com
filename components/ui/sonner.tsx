"use client";

import { useTheme } from "next-themes";
<<<<<<< HEAD
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";
=======
import { Toaster as Sonner, ToasterProps } from "sonner";
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
