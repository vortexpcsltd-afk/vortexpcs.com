import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  ShieldCheck,
  Undo2,
  AlertTriangle,
  Package,
  Receipt,
  ChevronRight,
} from "lucide-react";

interface ReturnsRefundsPageProps {
  onNavigate?: (view: string) => void;
}

export function ReturnsRefundsPage({ onNavigate }: ReturnsRefundsPageProps) {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute -top-24 -left-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -top-16 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Hero */}
      <section className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs">Aligned with UK consumer rights</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Returns & Refunds
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We follow UK law to make returns straightforward and fair. If
            something isn’t right, we’ll work quickly to put it right.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              Consumer Rights Act 2015
            </Badge>
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
              Consumer Contracts Regs 2013
            </Badge>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => onNavigate?.("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Contact Support <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.("warranty")}
              className="border-white/20 hover:border-white/40"
            >
              View Warranty <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Summary of rights */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Undo2 className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Change of Mind (Distance Sales)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <p>
                For eligible products purchased online/phone, you may have a
                14-day right to cancel under the Consumer Contracts Regulations
                2013. This generally excludes goods made to your specification
                or clearly personalised.
              </p>
              <ul className="space-y-2">
                <li>
                  Accessories/peripherals sealed and unused: typically eligible
                </li>
                <li>
                  Custom-built PCs: often exempt from the 14-day cooling-off
                  period
                </li>
                <li>If unsure, contact us before returning so we can advise</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <CardTitle className="text-white">
                  Faulty Goods (UK Consumer Rights)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <ul className="space-y-2">
                <li>
                  <strong>First 30 days:</strong> short-term right to reject for
                  a refund if the product is faulty
                </li>
                <li>
                  <strong>Within 6 months:</strong> presumed faulty unless we
                  can prove otherwise — repair or replace first
                </li>
                <li>
                  <strong>Up to 6 years (5 in Scotland):</strong> you can claim
                  if goods were not of satisfactory quality at delivery
                </li>
              </ul>
              <p>
                We aim to resolve issues quickly and fairly with repair,
                replacement, or refund in line with the law.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What we accept / exclusions */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-white">
                  Eligibility & Condition
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <ul className="space-y-2">
                <li>
                  Return items with original packaging, accessories, and manuals
                </li>
                <li>Back up data and remove personal accounts before return</li>
                <li>
                  We may reduce refunds for handling beyond what’s necessary to
                  establish nature/characteristics/functioning
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-white">
                  Exclusions & Limitations
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm space-y-3">
              <ul className="space-y-2">
                <li>
                  Custom-built PCs may not be eligible for change-of-mind
                  returns
                </li>
                <li>Software licences/activated software and consumables</li>
                <li>
                  Damage caused by misuse, liquid ingress, or unauthorised
                  modification
                </li>
                <li>Cosmetic damage not affecting function</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Return process */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pb-16">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-white">
                How to Start a Return
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-gray-300 text-sm space-y-3">
            <ol className="list-decimal ml-5 space-y-3">
              <li>
                Contact us via the{" "}
                <button
                  onClick={() => onNavigate?.("contact")}
                  className="text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-2"
                >
                  contact page
                </button>{" "}
                with your order number, serial, and reason for return.
              </li>
              <li>
                We’ll confirm eligibility and issue an RMA with packing
                instructions.
              </li>
              <li>
                Package securely; we’ll advise labels and courier options.
                Faulty returns: we’ll provide a label or reimburse reasonable
                costs.
              </li>
              <li>
                We’ll assess the item on arrival. Refunds are typically
                processed within 5–10 business days after inspection.
              </li>
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                Proof of purchase required
              </Badge>
              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300">
                Data backup recommended
              </Badge>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Where a change-of-mind return is accepted, you may be responsible
              for return shipping and diminished value due to handling.
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onNavigate?.("contact")}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            Start a Return <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("faq")}
            className="border-white/20 hover:border-white/40"
          >
            Read FAQs <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default ReturnsRefundsPage;
