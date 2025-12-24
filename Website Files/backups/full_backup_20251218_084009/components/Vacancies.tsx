import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Briefcase,
  MapPin,
  Clock3,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Laptop2,
  HeartHandshake,
  ArrowRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { fetchVacancies, type Vacancy } from "../services/cms";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import {
  BLOCKS,
  MARKS,
  type Document as RichDocument,
} from "@contentful/rich-text-types";

const benefits = [
  {
    title: "Flexible-first",
    description:
      "Hybrid, remote-friendly culture with quarterly in-person build weeks.",
    icon: <Laptop2 className="w-5 h-5 text-sky-400" />,
  },
  {
    title: "Impactful work",
    description:
      "Ship features that directly shape how professionals buy and manage PCs.",
    icon: <Sparkles className="w-5 h-5 text-sky-400" />,
  },
  {
    title: "Wellbeing",
    description:
      "Private healthcare stipend, mental health days, and ergonomic gear budget.",
    icon: <HeartHandshake className="w-5 h-5 text-sky-400" />,
  },
  {
    title: "Growth budget",
    description:
      "Annual learning allowance for certs, hardware, and conferences.",
    icon: <TrendingUp className="w-5 h-5 text-sky-400" />,
  },
  {
    title: "Security minded",
    description:
      "Secure-by-default practices with time for hardening and resilience.",
    icon: <ShieldCheck className="w-5 h-5 text-sky-400" />,
  },
  {
    title: "Modern stack",
    description:
      "Vite, shadcn/ui, Stripe, Firebase, and a strong observability backbone.",
    icon: <Briefcase className="w-5 h-5 text-sky-400" />,
  },
];

const processSteps = [
  {
    title: "Intro & portfolio",
    detail: "20–30 minute conversation to align on role fit and recent work.",
  },
  {
    title: "Practical exercise",
    detail:
      "A short, relevant brief (2–3 hours max) or code review session—no whiteboard trivia.",
  },
  {
    title: "Team conversation",
    detail:
      "Meet future teammates, discuss architecture choices, and ways of working.",
  },
  {
    title: "Offer & onboarding",
    detail:
      "Clear compensation, equipment preferences, and a 30-60-90 day plan.",
  },
];

// Helper to render summary content (plain text or rich text)
const renderSummary = (summary: string | RichDocument | undefined) => {
  if (!summary) return null;

  // If it's a string, render as plain text
  if (typeof summary === "string") {
    return (
      <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
        {summary}
      </p>
    );
  }

  // If it's a RichDocument, use documentToReactComponents
  if (typeof summary === "object" && "nodeType" in summary) {
    return (
      <div className="text-gray-300 text-sm lg:text-base leading-relaxed prose-sm prose-invert max-w-none">
        {documentToReactComponents(summary as RichDocument, {
          renderNode: {
            [BLOCKS.PARAGRAPH]: (_node, children) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
            [BLOCKS.HEADING_1]: (_node, children) => (
              <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>
            ),
            [BLOCKS.HEADING_2]: (_node, children) => (
              <h5 className="text-base font-semibold mt-2 mb-1">{children}</h5>
            ),
            [BLOCKS.UL_LIST]: (_node, children) => (
              <ul className="list-disc list-inside ml-2 mb-2">{children}</ul>
            ),
            [BLOCKS.OL_LIST]: (_node, children) => (
              <ol className="list-decimal list-inside ml-2 mb-2">{children}</ol>
            ),
            [BLOCKS.LIST_ITEM]: (_node, children) => (
              <li className="mb-1">{children}</li>
            ),
          },
          renderMark: {
            [MARKS.BOLD]: (text) => (
              <strong className="font-semibold">{text}</strong>
            ),
            [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
            [MARKS.CODE]: (text) => (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono">
                {text}
              </code>
            ),
          },
        })}
      </div>
    );
  }

  return null;
};

export function VacanciesPage() {
  const [roles, setRoles] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Vacancy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
    cvFile: null as File | null,
  });

  // Load vacancies from Contentful on mount
  useEffect(() => {
    const loadVacancies = async () => {
      try {
        setLoading(true);
        const data = await fetchVacancies();
        setRoles(data);
      } catch (error) {
        console.error("Failed to load vacancies:", error);
        // Fallback handled in fetchVacancies
      } finally {
        setLoading(false);
      }
    };

    loadVacancies();
  }, []);

  const openApplication = (role: Vacancy) => {
    setSelectedRole(role);
    setApplicationForm((prev) => ({
      ...prev,
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
      coverLetter: "",
      cvFile: null,
    }));
    setApplicationOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Select a role to apply for.");
      return;
    }

    if (!applicationForm.fullName || !applicationForm.email) {
      toast.error("Please add your name and email.");
      return;
    }

    if (!applicationForm.cvFile) {
      toast.error("Please attach your CV.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        roleId: selectedRole.id,
        roleTitle: selectedRole.title,
        ...applicationForm,
        cvFileName: applicationForm.cvFile.name,
        cvFileSize: applicationForm.cvFile.size,
      };

      console.log("Submitting application", payload);
      toast.success("Application sent! We'll be in touch soon.");
      setApplicationOpen(false);
    } catch (error) {
      console.error("Application submit failed", error);
      toast.error("Unable to submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <Card className="bg-black/80 border-white/10 p-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
              <p className="text-gray-300">Loading vacancies...</p>
            </div>
          </Card>
        </div>
      )}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <header className="space-y-8">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-cyan-500/15 border border-sky-500/30 backdrop-blur-xl shadow-lg shadow-sky-500/30">
            <Badge className="bg-gradient-to-r from-sky-500/40 to-blue-500/40 border-sky-500/60 text-sky-100 font-semibold text-xs uppercase tracking-wider">
              ✦ We're hiring
            </Badge>
            <span className="text-gray-200 font-medium text-sm">
              Build the future of pro PC buying
            </span>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                  Join the team
                </span>
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">
                Powering modern workstations
              </h2>
            </div>
            <p className="text-lg text-gray-300 max-w-3xl leading-relaxed font-light">
              Vortex PCs crafts premium, performance-first systems with
              meticulous service. If you love fast feedback loops, thoughtful
              design, and resilient systems, you'll fit right in.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 font-semibold"
                asChild
              >
                <a href="#open-roles" className="flex items-center gap-2">
                  View open roles
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-sky-500/40 text-sky-200 hover:border-sky-500/70 hover:bg-sky-500/10 transition-all duration-300 font-semibold"
                asChild
              >
                <a href="mailto:careers@vortexpower.com">
                  Email the talent team
                </a>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
            {[
              { icon: "🏢", label: "Hybrid-first culture" },
              { icon: "🛠️", label: "Quarterly build weeks" },
              { icon: "👥", label: "Lean, senior team" },
            ].map((item) => (
              <Card
                key={item.label}
                className="group bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-xl border border-sky-500/20 text-gray-100 px-5 py-4 shadow-lg shadow-sky-500/15 hover:shadow-sky-500/25 hover:border-sky-500/40 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Card>
            ))}
          </div>
        </header>

        <section className="space-y-6 pt-8" id="open-roles">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-sky-300/70 font-semibold">
                Open positions
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Roles we're hiring for
              </h2>
            </div>
            <Badge className="bg-gradient-to-r from-sky-500/30 to-blue-500/30 border-sky-500/50 text-sky-100 px-4 py-2 font-semibold text-sm">
              {roles.length} open {roles.length === 1 ? "role" : "roles"}
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles
              .sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
              })
              .map((role) => {
                const isFeatured = role.featured ?? false;
                return (
                  <Card
                    key={role.id}
                    className={`group relative overflow-hidden transition-all duration-300 backdrop-blur-xl ${
                      isFeatured
                        ? "lg:col-span-2 md:col-span-1 bg-gradient-to-br from-sky-900/40 via-slate-900/50 to-black border border-sky-500/30 shadow-2xl shadow-sky-500/20 hover:shadow-sky-500/40 p-8"
                        : "bg-gradient-to-br from-white/5 via-slate-900/60 to-black border border-white/10 hover:border-sky-500/40 shadow-xl shadow-sky-500/10 hover:shadow-sky-500/30 p-6 sm:p-7"
                    }`}
                  >
                    {isFeatured && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-400/10 blur-3xl"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative space-y-6">
                      {/* Header with featured badge */}
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`space-y-3 flex-1 ${
                            isFeatured ? "max-w-2xl" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            {isFeatured && (
                              <Badge className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-500/50 text-yellow-200 animate-pulse">
                                <Star className="w-3 h-3 mr-1.5" />
                                Featured
                              </Badge>
                            )}
                            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-100 font-medium">
                              {role.level}
                            </Badge>
                            <Badge className="bg-white/10 border-white/20 text-gray-100">
                              {role.type}
                            </Badge>
                          </div>
                          <h3
                            className={`${
                              isFeatured ? "text-2xl lg:text-3xl" : "text-lg"
                            } font-bold text-white tracking-tight leading-tight`}
                          >
                            {role.title}
                          </h3>
                          {renderSummary(role.summary)}
                        </div>
                        <div className="shrink-0 hidden sm:flex">
                          <div
                            className={`${
                              isFeatured ? "w-14 h-14" : "w-12 h-12"
                            } rounded-full bg-gradient-to-br from-sky-500/30 to-blue-600/30 border border-sky-500/50 flex items-center justify-center text-sky-300 shadow-lg shadow-sky-500/30`}
                          >
                            <Briefcase
                              className={`${
                                isFeatured ? "w-7 h-7" : "w-6 h-6"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Skills/Tags Section */}
                      {role.tags && role.tags.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs uppercase tracking-widest text-sky-300/70 font-semibold">
                            Required skills
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {role.tags.map((tag) => (
                              <div key={tag} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <Badge className="relative bg-gradient-to-r from-sky-500/25 to-blue-500/25 border border-sky-500/40 text-sky-100 text-xs font-semibold px-3 py-1.5 hover:border-sky-500/70 hover:from-sky-500/35 hover:to-blue-500/35 transition-all duration-300 cursor-default">
                                  {tag}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location and hiring process */}
                      <div className="flex items-center flex-wrap gap-4 text-sm text-gray-300 pt-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                          <span>{role.location}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                          <Clock3 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span>2-step process</span>
                        </div>
                      </div>

                      {/* Ideal for Section */}
                      {role.idealFor && role.idealFor.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs uppercase tracking-widest text-cyan-300/70 font-semibold">
                            Ideal candidate profile
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {role.idealFor?.map((item: string) => (
                              <div key={item} className="group relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-500/40 text-cyan-100 text-xs font-semibold hover:border-cyan-500/70 hover:from-cyan-500/35 hover:to-blue-500/35 transition-all duration-300">
                                  {item}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CTA buttons */}
                      <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3">
                        <Button
                          className={`group/btn ${
                            isFeatured
                              ? "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/20"
                              : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                          }`}
                          onClick={() => openApplication(role)}
                        >
                          Apply now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 text-gray-200 hover:border-sky-500/40 hover:text-sky-200 hover:bg-sky-500/5"
                          asChild
                        >
                          <a href="mailto:careers@vortexpower.com">
                            Questions?
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-8">
          <Card className="lg:col-span-2 bg-gradient-to-br from-white/8 via-white/5 to-white/3 backdrop-blur-xl border border-sky-500/20 p-8 space-y-6 shadow-lg shadow-sky-500/15">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sky-300">
                <Sparkles className="w-5 h-5" />
                <span className="uppercase text-xs tracking-widest font-semibold">
                  Hiring process
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white">
                A thoughtful, transparent approach
              </h3>
            </div>
            <ol className="space-y-4 text-gray-200">
              {processSteps.map((step, idx) => (
                <li key={step.title} className="flex gap-4 group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/40 to-blue-600/40 border border-sky-500/50 text-sky-100 font-bold text-sm flex-shrink-0 group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 pt-1">
                    <p className="font-semibold text-white text-base">
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <Badge className="bg-sky-500/15 border-sky-500/30 text-sky-100 font-medium">
                ✓ No whiteboard trivia
              </Badge>
              <Badge className="bg-sky-500/15 border-sky-500/30 text-sky-100 font-medium">
                ✓ Replies within 5 days
              </Badge>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-sky-900/40 via-blue-900/30 to-black border border-sky-500/30 p-8 space-y-6 shadow-lg shadow-sky-500/25">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sky-300">
                <ShieldCheck className="w-5 h-5" />
                <span className="uppercase text-xs tracking-widest font-semibold">
                  Why join us
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Working at Vortex
              </h3>
            </div>
            <ul className="space-y-4 text-gray-200">
              <li className="flex gap-3 group">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-sm leading-relaxed">
                  Design-first mindset with engineering rigor.
                </span>
              </li>
              <li className="flex gap-3 group">
                <Clock3 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-sm leading-relaxed">
                  Predictable delivery cadences and respectful meetings.
                </span>
              </li>
              <li className="flex gap-3 group">
                <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="text-sm leading-relaxed">
                  Own domains end-to-end and ship frequently.
                </span>
              </li>
              <li className="flex gap-2">
                <HeartHandshake className="w-4 h-4 text-sky-400 mt-0.5" />
                <span>
                  Supportive peers who care about quality and wellbeing.
                </span>
              </li>
            </ul>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sky-300">
            <TrendingUp className="w-5 h-5" />
            <span className="uppercase text-xs tracking-[0.18em]">
              Benefits
            </span>
          </div>
          <h3 className="text-2xl font-semibold">
            Benefits that back high performance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-sky-500/30 transition-all duration-300 p-4 shadow-lg shadow-sky-500/10"
              >
                <div className="flex items-center gap-2 text-sky-300 mb-2">
                  {benefit.icon}
                  <p className="font-semibold text-white">{benefit.title}</p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center space-y-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-sky-500/20">
          <h3 className="text-2xl font-semibold">Ready to build with us?</h3>
          <p className="text-gray-300 max-w-3xl mx-auto">
            If you don't see the perfect role, email us with your portfolio. We
            hire thoughtfully and keep strong candidates close for upcoming
            openings.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500">
              Send your portfolio
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-sky-200 hover:border-sky-500/40"
              asChild
            >
              <a href="mailto:careers@vortexpower.com">
                careers@vortexpower.com
              </a>
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={applicationOpen} onOpenChange={setApplicationOpen}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Apply for {selectedRole?.title || "a role"}
            </DialogTitle>
            <DialogDescription>
              Complete your details and attach a CV. We'll follow up within 5
              business days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input
                  id="fullName"
                  value={applicationForm.fullName}
                  onChange={(e) =>
                    setApplicationForm((p) => ({
                      ...p,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Alex Taylor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationForm.email}
                  onChange={(e) =>
                    setApplicationForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={applicationForm.phone}
                  onChange={(e) =>
                    setApplicationForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="e.g. +44 7700 900123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={applicationForm.location}
                  onChange={(e) =>
                    setApplicationForm((p) => ({
                      ...p,
                      location: e.target.value,
                    }))
                  }
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={applicationForm.linkedin}
                  onChange={(e) =>
                    setApplicationForm((p) => ({
                      ...p,
                      linkedin: e.target.value,
                    }))
                  }
                  placeholder="https://linkedin.com/in/"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                <Input
                  id="portfolio"
                  value={applicationForm.portfolio}
                  onChange={(e) =>
                    setApplicationForm((p) => ({
                      ...p,
                      portfolio: e.target.value,
                    }))
                  }
                  placeholder="https://"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover letter</Label>
              <Textarea
                id="coverLetter"
                value={applicationForm.coverLetter}
                onChange={(e) =>
                  setApplicationForm((p) => ({
                    ...p,
                    coverLetter: e.target.value,
                  }))
                }
                placeholder="Tell us about your fit for this role."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">CV / Resume *</Label>
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setApplicationForm((p) => ({ ...p, cvFile: file }));
                }}
              />
              <p className="text-xs text-gray-400">
                Accepted: PDF, DOC, DOCX. Max 10MB.
              </p>
              {applicationForm.cvFile && (
                <p className="text-sm text-sky-200">
                  Attached: {applicationForm.cvFile.name} (
                  {Math.round(applicationForm.cvFile.size / 1024)} KB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => setApplicationOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
