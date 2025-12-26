import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { PageErrorBoundary } from "../components/ErrorBoundary";
import { RouteLoader } from "../components/RouteLoader";
import { HomePage } from "../components/HomePage";
import { AboutUs } from "../components/AboutUs";
import { PCFinderSpectacular as PCFinder } from "../components/PCFinderSpectacular";
import { BusinessSolutions } from "../components/BusinessSolutions";
import type { CartItem } from "../types";
import { AccessDenied } from "../components/AccessDenied";
import { WarrantyPage } from "../components/WarrantyPage";
import { OurProcessPage } from "../components/OurProcessPage";
import { TechnicalSupportPage } from "../components/TechnicalSupportPage";
import { QualityStandardsPage } from "../components/QualityStandardsPage";
import { ReturnsRefundsPage } from "../components/ReturnsRefundsPage";
import { getDefaultComponentPositions } from "../components/Interactive3DBuilder/utils";
import type { SelectedComponents } from "../components/Interactive3DBuilder/types";
import { Mobile3DVisualizerModal } from "../components/Mobile3DVisualizerModal";

const PCBuilder = lazy(() =>
  import("../components/PCBuilder").then((m) => ({ default: m.PCBuilder }))
);
const Interactive3DBuilder = lazy(() =>
  import("../components/Interactive3DBuilder").then((m) => ({
    default: m.Interactive3DBuilder,
  }))
);
const VacanciesPage = lazy(() =>
  import("../components/Vacancies").then((m) => ({ default: m.VacanciesPage }))
);
const BlogList = lazy(() =>
  import("../components/BlogList").then((m) => ({ default: m.BlogList }))
);
const BlogPost = lazy(() =>
  import("../components/BlogPost").then((m) => ({ default: m.BlogPost }))
);
const BlogAuthor = lazy(() =>
  import("../components/BlogAuthor").then((m) => ({ default: m.BlogAuthor }))
);
const MemberArea = lazy(() => import("../components/MemberArea"));
const AdminPanel = lazy(() =>
  import("../components/AdminPanel").then((m) => ({ default: m.AdminPanel }))
);
const Contact = lazy(() =>
  import("../components/Contact").then((m) => ({ default: m.Contact }))
);
const FAQPage = lazy(() =>
  import("../components/FAQPage").then((m) => ({ default: m.FAQPage }))
);
const RepairService = lazy(() =>
  import("../components/RepairService").then((m) => ({
    default: m.RepairService,
  }))
);
import { TermsPage } from "../components/TermsPage";
import { PrivacyPage } from "../components/PrivacyPage";
import { CookiePolicyPage } from "../components/CookiePolicyPage";
const CmsDiagnostics = lazy(() =>
  import("../components/CmsDiagnostics").then((m) => ({
    default: m.CmsDiagnostics,
  }))
);
const CheckoutPage = lazy(() =>
  import("../components/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  }))
);
const LaptopsPage = lazy(() =>
  import("../components/LaptopsPage").then((m) => ({ default: m.LaptopsPage }))
);

type RecommendedBuildSpec = {
  name?: string;
  description?: string;
  price?: number;
  specs?: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    psu?: string;
    cooling?: string;
    case?: string;
  };
  [key: string]: unknown;
};

type AppRoutesProps = {
  onNavigate: (view: string) => void;
  onSetRecommendedBuild: (build: RecommendedBuildSpec) => void;
  isRecommendedBuildSpec: (val: unknown) => val is RecommendedBuildSpec;
  recommendedBuild: RecommendedBuildSpec | null;
  addToCart: (item: CartItem) => void;
  setShowCartModal: (open: boolean) => void;
  isAdmin: boolean;
  setShowLoginDialog: (open: boolean) => void;
  cartItems?: CartItem[];
  cartHydrated: boolean;
};

export function AppRoutes({
  onNavigate,
  onSetRecommendedBuild,
  isRecommendedBuildSpec,
  recommendedBuild,
  addToCart,
  setShowCartModal,
  isAdmin,
  setShowLoginDialog,
  cartItems = [],
  cartHydrated,
}: AppRoutesProps) {
  const navigate = useNavigate();
  const go = (view: string) => {
    const path = view === "home" ? "/" : `/${view}`;
    navigate(path);
  };

  const BlogPostRoute = () => {
    const params = useParams();
    return <BlogPost slug={params.slug || ""} />;
  };

  const BlogAuthorRoute = () => {
    const params = useParams();
    return <BlogAuthor authorSlug={params.slug || ""} />;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageErrorBoundary pageName="Home">
            <HomePage />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/business-solutions"
        element={
          <PageErrorBoundary pageName="Business Solutions">
            <BusinessSolutions
              setCurrentView={go}
              onAddToCart={addToCart}
              onOpenCart={() => setShowCartModal(true)}
            />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/about"
        element={
          <PageErrorBoundary pageName="About Us">
            <AboutUs onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/vacancies"
        element={
          <PageErrorBoundary pageName="Vacancies">
            <Suspense fallback={<RouteLoader />}>
              <VacanciesPage />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/contact"
        element={
          <PageErrorBoundary pageName="Contact">
            <Suspense fallback={<RouteLoader />}>
              <Contact onNavigate={go} />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/faq"
        element={
          <PageErrorBoundary pageName="FAQ">
            <Suspense fallback={<RouteLoader />}>
              <FAQPage onNavigate={go} />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/blog"
        element={
          <PageErrorBoundary pageName="Blog">
            <Suspense fallback={<RouteLoader />}>
              <BlogList />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/blog/:slug"
        element={
          <PageErrorBoundary pageName="Blog Post">
            <Suspense fallback={<RouteLoader />}>
              <BlogPostRoute />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/author/:slug"
        element={
          <PageErrorBoundary pageName="Author">
            <Suspense fallback={<RouteLoader />}>
              <BlogAuthorRoute />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/pc-finder"
        element={
          <PageErrorBoundary pageName="PC Finder">
            <PCFinder
              setCurrentView={onNavigate}
              _setRecommendedBuild={(build) => {
                if (isRecommendedBuildSpec(build)) {
                  onSetRecommendedBuild(build);
                }
              }}
            />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/pc-builder"
        element={
          <PageErrorBoundary pageName="PC Builder">
            <Suspense fallback={<RouteLoader />}>
              <PCBuilder
                recommendedBuild={recommendedBuild}
                onAddToCart={(item) => {
                  // Convert PCBuilderComponent to CartItem
                  let image: string | undefined;
                  const imgs = (
                    item as {
                      images?: Array<string | { url?: string; src?: string }>;
                      image?: string;
                    }
                  ).images;
                  if (Array.isArray(imgs) && imgs.length) {
                    const first: string | { url?: string; src?: string } =
                      imgs[0];
                    image =
                      typeof first === "string"
                        ? first
                        : first.url || first.src;
                  } else if ((item as { image?: string }).image) {
                    image = (item as { image?: string }).image;
                  }
                  addToCart({
                    id: item.id,
                    name: item.name || "Component",
                    price: item.price || 0,
                    quantity: 1,
                    category: item.category || "pc-component",
                    image,
                  });
                }}
                onOpenCart={() => setShowCartModal(true)}
              />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/laptops"
        element={
          <PageErrorBoundary pageName="Gaming Laptops">
            <Suspense fallback={<RouteLoader />}>
              <LaptopsPage />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/visual-configurator"
        element={
          <PageErrorBoundary pageName="3D Visual Configurator">
            {(() => {
              const VisualizerWithModal = () => {
                const [showModal, setShowModal] = useState(true);

                const positions = getDefaultComponentPositions("mid-tower");
                const sampleBuild: SelectedComponents = {
                  case: {
                    id: "case-corsair-5000t",
                    name: "Corsair 5000T",
                    type: "case",
                    color: "#1a1a2e",
                    position: [0, 0, 0.08],
                    rotation: [0, Math.PI / 2, 0],
                    scale: [1.0, 1.0, 1.0], // Meshify C scale
                    description:
                      "Computer Case: Houses and protects all your internal components while providing airflow pathways for cooling. A good case offers easy cable management, proper ventilation, and protection from dust and damage.",
                  },
                  motherboard: {
                    id: "mobo-asus-prime",
                    name: "ASUS Prime X870-E",
                    type: "motherboard",
                    color: "#0ea5e9",
                    position: [
                      positions.motherboard?.[0] || -0.12,
                      positions.motherboard?.[1] || 0.12,
                      positions.motherboard?.[2] || -0.1,
                    ],
                    rotation: [0, 0, 0],
                    scale: [0.008, 0.008, 0.008],
                    description:
                      "Motherboard: The main circuit board that connects all your components together. It controls communication between the CPU, RAM, GPU, storage, and other devices, serving as the nervous system of your computer.",
                  },
                  cpu: undefined,
                  gpu: {
                    id: "gpu-rtx4090",
                    name: "NVIDIA RTX 4090",
                    type: "gpu",
                    color: "#1e293b",
                    position: [-0.05, 0.21, -0.1],
                    rotation: [0, 0, 0],
                    scale: [0.008, 0.008, 0.008],
                    description:
                      "GPU: A graphics processor that accelerates visuals and parallel tasks like gaming, 3D rendering, and AI. It handles complex calculations in parallel, making it ideal for demanding visual applications and machine learning workloads.",
                  },
                  ram: [
                    {
                      id: "ram-corsair-01",
                      name: "Corsair Vengeance RGB 32GB",
                      type: "ram",
                      color: "#0ea5e9",
                      position: [
                        (positions.ram?.[0] || 0.02) + 0.012,
                        0.325,
                        -0.08,
                      ],
                      rotation: [Math.PI / 2, Math.PI / 2, 0],
                      scale: [0.00835, 0.00835, 0.00835],
                      description:
                        "RAM (Random Access Memory) is your computer's short-term memory, used to store and quickly access data that's actively being worked on. The more RAM you have, the more tasks and applications your system can juggle smoothly without slowing down. Think of it as your desk space—a bigger desk means more room to multitask.",
                    },
                    {
                      id: "ram-corsair-02",
                      name: "Corsair Vengeance RGB 32GB",
                      type: "ram",
                      color: "#06b6d4",
                      position: [
                        (positions.ram?.[0] || 0.02) + 0.027,
                        0.325,
                        -0.08,
                      ],
                      rotation: [Math.PI / 2, Math.PI / 2, 0],
                      scale: [0.00835, 0.00835, 0.00835],
                      description:
                        "RAM (Random Access Memory) is your computer's short-term memory, used to store and quickly access data that's actively being worked on. The more RAM you have, the more tasks and applications your system can juggle smoothly without slowing down. Think of it as your desk space—a bigger desk means more room to multitask.",
                    },
                  ],
                  psu: {
                    id: "psu-corsair-sf850l",
                    name: "Corsair SF850L",
                    type: "psu",
                    color: "#ef4444",
                    position: [-0.14, 0.06, -0.08],
                    rotation: [0, Math.PI + Math.PI / 2, 0],
                    scale: [1, 1, 1],
                    description:
                      "PSU (Power Supply Unit) safely distributes electrical power to all your components. A reliable, high-wattage PSU ensures stable operation and protects your hardware from power fluctuations. The wattage determines how many power-hungry components you can run.",
                  },
                  storage: [
                    {
                      id: "ssd-samsung-990pro",
                      name: "Samsung 990 Pro 2TB",
                      type: "storage",
                      color: "#06b6d4",
                      position: [
                        positions.storage?.[0] || 0.1,
                        positions.storage?.[1] || -0.12,
                        positions.storage?.[2] || 0,
                      ],
                      rotation: [0, 0, 0],
                      scale: [0.9, 0.9, 0.9],
                      description:
                        "Storage Drive (SSD/HDD): Permanently stores all your files, programs, and operating system. SSDs are much faster than traditional hard drives, dramatically speeding up boot times and program loading.",
                    },
                  ],
                  cooler: {
                    id: "cooler-nzxt-kraken",
                    name: "NZXT Kraken X73 RGB",
                    type: "cooler",
                    color: "#0ea5e9",
                    position: [
                      positions.cooler?.[0] || -0.05,
                      positions.cooler?.[1] || 0.15,
                      positions.cooler?.[2] || 0,
                    ],
                    rotation: [0, 0, 0],
                    scale: [0.95, 0.95, 0.95],
                    description:
                      "CPU Cooler: Removes heat from your processor to maintain optimal temperatures. Better cooling allows your CPU to run faster and more efficiently, and helps extend the lifespan of your components by preventing thermal damage.",
                  },
                  fans: [],
                };
                return (
                  <>
                    <Mobile3DVisualizerModal
                      isOpen={showModal}
                      onClose={() => setShowModal(false)}
                    />
                    <Suspense fallback={<RouteLoader />}>
                      <Interactive3DBuilder
                        components={sampleBuild}
                        caseType="mid-tower"
                        isOpen={true}
                        onClose={() => go("home")}
                        showCableRouting={true}
                        rgbPreview={true}
                      />
                    </Suspense>
                  </>
                );
              };
              return <VisualizerWithModal />;
            })()}
          </PageErrorBoundary>
        }
      />

      <Route
        path="/checkout"
        element={
          <PageErrorBoundary pageName="Checkout">
            <Suspense fallback={<RouteLoader />}>
              <CheckoutPage
                cartItems={cartItems}
                cartHydrated={cartHydrated}
                onBack={() => go("pc-builder")}
                onSuccess={() => go("home")}
              />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/member"
        element={
          <PageErrorBoundary pageName="Member Area">
            <Suspense fallback={<RouteLoader />}>
              <MemberArea onNavigate={go} />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/admin"
        element={
          <PageErrorBoundary pageName="Admin Panel">
            {isAdmin ? (
              <Suspense fallback={<RouteLoader />}>
                <div className="container mx-auto px-4">
                  <AdminPanel />
                </div>
              </Suspense>
            ) : (
              <AccessDenied
                onLogin={() => setShowLoginDialog(true)}
                onNavigate={go}
              />
            )}
          </PageErrorBoundary>
        }
      />

      <Route
        path="/repair"
        element={
          <PageErrorBoundary pageName="Repair Service">
            <Suspense fallback={<RouteLoader />}>
              <RepairService onNavigate={go} />
            </Suspense>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/terms"
        element={
          <PageErrorBoundary pageName="Terms & Conditions">
            <TermsPage />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/warranty"
        element={
          <PageErrorBoundary pageName="Warranty">
            <WarrantyPage onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/process"
        element={
          <PageErrorBoundary pageName="Our Process">
            <OurProcessPage onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/support"
        element={
          <PageErrorBoundary pageName="Technical Support">
            <TechnicalSupportPage onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/quality"
        element={
          <PageErrorBoundary pageName="Quality Standards">
            <QualityStandardsPage onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/returns"
        element={
          <PageErrorBoundary pageName="Returns & Refunds">
            <ReturnsRefundsPage onNavigate={go} />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/privacy"
        element={
          <PageErrorBoundary pageName="Privacy Policy">
            <PrivacyPage />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/cookies"
        element={
          <PageErrorBoundary pageName="Cookie Policy">
            <CookiePolicyPage />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/cms-diagnostics"
        element={
          <PageErrorBoundary pageName="CMS Diagnostics">
            {isAdmin ? (
              <Suspense fallback={<RouteLoader />}>
                <CmsDiagnostics />
              </Suspense>
            ) : (
              <AccessDenied
                onLogin={() => setShowLoginDialog(true)}
                onNavigate={go}
              />
            )}
          </PageErrorBoundary>
        }
      />
    </Routes>
  );
}
