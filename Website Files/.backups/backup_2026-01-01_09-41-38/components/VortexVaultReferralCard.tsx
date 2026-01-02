/**
 * VortexVaultReferralCard Component
 * Displays referral link, code, and stats for sharing with friends
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Gift,
  Copy,
  Check,
  Users,
  TrendingUp,
  QrCode,
  Twitter,
  Facebook,
  MessageCircle,
  Link,
  Target,
  HelpCircle,
} from "lucide-react";
import { logger } from "../services/logger";
import { BONUS_POINTS } from "../services/vortexVault";
import { VortexVaultReferralFAQ } from "./VortexVaultReferralFAQ";
import type { ReferralStats } from "../services/vortexVaultReferrals";

interface VortexVaultReferralCardProps {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
}

export function VortexVaultReferralCard({
  referralCode,
  referralLink,
  stats,
}: VortexVaultReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const copyToClipboard = async (text: string, isCode: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      logger.info("Copied to clipboard", { type: isCode ? "code" : "link" });
    } catch (error) {
      logger.error("Failed to copy to clipboard", error);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out Vortex PCs - build your dream custom PC! Use my referral code ${referralCode} to get started.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank", "width=550,height=420");
    logger.info("Shared on Twitter");
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      referralLink
    )}`;
    window.open(url, "_blank", "width=550,height=420");
    logger.info("Shared on Facebook");
  };

  const shareOnWhatsApp = () => {
    const text = `Check out Vortex PCs - build your dream custom PC! Use my link: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    logger.info("Shared on WhatsApp");
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border-cyan-500/30 backdrop-blur-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Refer Friends & Earn
              </h3>
              <p className="text-sm text-gray-400">
                Get {BONUS_POINTS.REFERRAL_COMPLETION} points when they make
                their first purchase
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowFAQ(true)}
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 hover:bg-white/10 text-sky-300"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            How It Works
          </Button>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Your Referral Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-lg text-cyan-300 tracking-wider">
              {referralCode}
            </div>
            <Button
              onClick={() => copyToClipboard(referralCode, true)}
              variant="outline"
              className="bg-white/5 border-white/20 hover:bg-white/10"
            >
              {copiedCode ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Share This Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <Button
              onClick={() => copyToClipboard(referralLink)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={shareOnTwitter}
              variant="outline"
              size="sm"
              className="flex-1 bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 text-sky-300"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={shareOnFacebook}
              variant="outline"
              size="sm"
              className="flex-1 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-300"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button
              onClick={shareOnWhatsApp}
              variant="outline"
              size="sm"
              className="flex-1 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              size="sm"
              className="bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-300"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          </div>

          {/* QR Code Display */}
          {showQR && (
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg mt-3">
              <QRCodeSVG value={referralLink} size={200} level="H" />
              <p className="text-xs text-gray-600 mt-2">
                Scan to visit referral link
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.totalReferrals}
            </p>
            <p className="text-xs text-gray-400">Total Referrals</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.completedReferrals}
            </p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.pointsEarned}
            </p>
            <p className="text-xs text-gray-400">Points Earned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Link className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalClicks}</p>
            <p className="text-xs text-gray-400">Link Clicks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.conversionRate}%
            </p>
            <p className="text-xs text-gray-400">Conversion</p>
          </div>
        </div>
        {/* Tier Bonus Progress */}
        {stats.completedReferrals > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Referral Tier Bonuses
              </h4>
              <span className="text-xs text-purple-300 font-semibold">
                {stats.completedReferrals >= 10
                  ? "MAX TIER"
                  : stats.completedReferrals >= 5
                  ? "TIER 2"
                  : "TIER 1"}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div
                className={`flex justify-between items-center p-2 rounded ${
                  stats.completedReferrals < 5
                    ? "bg-cyan-500/20 border border-cyan-500/40"
                    : "bg-white/5"
                }`}
              >
                <span className="text-gray-300">
                  Referrals 1-4{" "}
                  {stats.completedReferrals < 5 && (
                    <span className="text-cyan-400 font-semibold">
                      (Current)
                    </span>
                  )}
                </span>
                <span className="font-bold text-white">100 points each</span>
              </div>

              <div
                className={`flex justify-between items-center p-2 rounded ${
                  stats.completedReferrals >= 5 && stats.completedReferrals < 10
                    ? "bg-purple-500/20 border border-purple-500/40"
                    : "bg-white/5"
                }`}
              >
                <span className="text-gray-300">
                  Referrals 5-9{" "}
                  {stats.completedReferrals >= 5 &&
                    stats.completedReferrals < 10 && (
                      <span className="text-purple-400 font-semibold">
                        (Current)
                      </span>
                    )}
                  {stats.completedReferrals < 5 && (
                    <span className="text-gray-500 text-xs">
                      ({5 - stats.completedReferrals} more to unlock)
                    </span>
                  )}
                </span>
                <span className="font-bold text-white">150 points each</span>
              </div>

              <div
                className={`flex justify-between items-center p-2 rounded ${
                  stats.completedReferrals >= 10
                    ? "bg-pink-500/20 border border-pink-500/40"
                    : "bg-white/5"
                }`}
              >
                <span className="text-gray-300">
                  Referrals 10+{" "}
                  {stats.completedReferrals >= 10 && (
                    <span className="text-pink-400 font-semibold">
                      (Current - Max!)
                    </span>
                  )}
                  {stats.completedReferrals < 10 && (
                    <span className="text-gray-500 text-xs">
                      ({10 - stats.completedReferrals} more to unlock)
                    </span>
                  )}
                </span>
                <span className="font-bold text-white">200 points each</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-purple-200">
              The more friends you refer, the bigger the bonuses! Keep sharing
              to earn maximum rewards.
            </p>
          </div>
        )}
        {/* Pending Referrals */}
        {stats.referrals.length > 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-white text-sm">
              Referred Members
            </h4>
            <div className="space-y-2">
              {stats.referrals.map((referral, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {referral.displayName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {referral.status === "pending"
                        ? `${BONUS_POINTS.REFERRAL_COMPLETION} points after first purchase`
                        : "Bonus awarded"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      referral.status === "pending"
                        ? "border-yellow-400/40 text-yellow-300 bg-yellow-500/10"
                        : "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                    }`}
                  >
                    {referral.status === "pending" ? "Pending" : "Completed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-300">
              Share your link to earn {BONUS_POINTS.REFERRAL_COMPLETION} points
              when friends make their first purchase!
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-white text-sm">Quick Overview</h4>
          <ol className="text-sm text-gray-400 space-y-1 pl-4">
            <li className="list-decimal">
              Share your referral link or code with friends
            </li>
            <li className="list-decimal">They sign up using your link/code</li>
            <li className="list-decimal">
              When they make their first purchase, you get{" "}
              {BONUS_POINTS.REFERRAL_COMPLETION} points!
            </li>
          </ol>
        </div>
      </Card>

      {/* FAQ Modal */}
      <VortexVaultReferralFAQ
        isOpen={showFAQ}
        onClose={() => setShowFAQ(false)}
      />
    </>
  );
}
