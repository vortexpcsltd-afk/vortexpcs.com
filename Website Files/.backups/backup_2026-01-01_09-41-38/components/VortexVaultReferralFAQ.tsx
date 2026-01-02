/**
 * VortexVaultReferralFAQ Component
 * Modal dialog explaining referral system details, terms, and troubleshooting
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card } from "./ui/card";
import {
  Gift,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface VortexVaultReferralFAQProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VortexVaultReferralFAQ({
  isOpen,
  onClose,
}: VortexVaultReferralFAQProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10 max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-cyan-400" />
            Referral Program Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* How It Works */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-cyan-400" />
              How It Works
            </h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">
                    Share Your Link
                  </p>
                  <p>
                    Copy your unique referral link or use social share buttons
                    to invite friends. Each link contains your personal referral
                    code.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">
                    Friend Signs Up
                  </p>
                  <p>
                    When your friend creates an account using your link, they
                    receive <strong className="text-cyan-400">50 points</strong>{" "}
                    as a welcome bonus. You'll see them listed as "Pending" in
                    your referral dashboard.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">
                    Friend Makes First Purchase
                  </p>
                  <p>
                    Once your friend completes their first order, you earn{" "}
                    <strong className="text-green-400">100 points</strong>! The
                    referral status changes to "Completed" and you receive an
                    email notification.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Points & Value */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-400" />
              Points & Value
            </h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span>Your friend signs up</span>
                <span className="font-bold text-cyan-400">+50 points</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span>Friend makes first purchase</span>
                <span className="font-bold text-green-400">+100 points</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-purple-500/30">
                <span className="font-semibold">Points Value</span>
                <span className="font-bold text-purple-400">
                  10 points = £1 discount
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Points can be redeemed during checkout for instant discounts on
              any order. There's no limit to how many points you can earn!
            </p>
          </Card>

          {/* Important Terms */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-400" />
              Important Terms
            </h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>90-Day Expiry:</strong> Pending referrals expire after
                  90 days if your friend hasn't made a purchase. The signup
                  bonus remains theirs, but you won't receive the 100-point
                  referral bonus.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>One Referral Per Account:</strong> Each user can only
                  be referred once. They must sign up using your link before
                  creating their account.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>No Self-Referrals:</strong> You cannot refer yourself
                  or create multiple accounts to earn referral bonuses.
                </p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Points Never Expire:</strong> Once earned, your
                  referral points remain in your account forever. Use them
                  whenever you're ready!
                </p>
              </div>
            </div>
          </Card>

          {/* Troubleshooting */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-sky-400" />
              Troubleshooting
            </h3>
            <div className="space-y-4 text-gray-300 text-sm">
              <div>
                <p className="font-semibold text-white mb-1">
                  Q: My friend signed up but I don't see them listed
                </p>
                <p>
                  A: Make sure your friend used your referral link{" "}
                  <em>before</em> creating their account. The referral code must
                  be present in the URL when they sign up. If they already have
                  an account, they'll need to create a new one using your link.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  Q: Friend made a purchase but I didn't get points
                </p>
                <p>
                  A: The 100-point bonus is awarded only for the <em>first</em>{" "}
                  purchase. Check your email for a confirmation notification. If
                  you didn't receive one, contact support with your friend's
                  email address.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  Q: How do I track link clicks and conversions?
                </p>
                <p>
                  A: Your referral dashboard shows total link clicks and
                  conversion rate. This helps you see which sharing methods work
                  best (social media, direct link, QR code, etc).
                </p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  Q: Can I refer friends who live outside the UK?
                </p>
                <p>
                  A: Yes! As long as they can receive deliveries to their
                  location and complete a purchase, the referral will count.
                </p>
              </div>
            </div>
          </Card>

          {/* Need Help */}
          <Card className="bg-sky-500/10 border-sky-500/30 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-sky-200">
                <p className="font-semibold mb-1">Still Have Questions?</p>
                <p>
                  Contact our support team at{" "}
                  <a
                    href="mailto:support@vortexpcs.com"
                    className="text-sky-400 hover:text-sky-300 underline"
                  >
                    support@vortexpcs.com
                  </a>{" "}
                  or use the chat widget. We're here to help you maximize your
                  referral earnings!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
