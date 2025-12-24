import { ReactNode } from "react";
import { Footer } from "../components/Footer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      {children}
      <Footer />
    </div>
  );
}
