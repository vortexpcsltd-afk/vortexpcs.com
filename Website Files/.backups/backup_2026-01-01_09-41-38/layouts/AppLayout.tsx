import { ReactNode } from "react";
import { Footer } from "../components/Footer";
import { ScrollProgressIndicator } from "../components/ScrollProgressIndicator";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <ScrollProgressIndicator />
      <main role="main" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
