import { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Clock,
  Users,
  Sparkles,
  Trophy,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  getActiveGiveaways,
  getPastGiveaways,
  enterGiveaway,
  hasUserEntered,
  type SocialGiveaway,
} from "../services/socialGiveaways";
import { logger } from "../services/logger";

interface SocialGiveawaysWidgetProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export function SocialGiveawaysWidget({
  userId,
  userName,
  userEmail,
}: SocialGiveawaysWidgetProps) {
  const [activeGiveaways, setActiveGiveaways] = useState<SocialGiveaway[]>([]);
  const [pastGiveaways, setPastGiveaways] = useState<SocialGiveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState<string | null>(null);
  const [socialHandle, setSocialHandle] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [userEntries, setUserEntries] = useState<Set<string>>(new Set());

  const loadGiveaways = useCallback(async () => {
    try {
      setLoading(true);
      const [active, past] = await Promise.all([
        getActiveGiveaways(),
        getPastGiveaways(3),
      ]);

      setActiveGiveaways(active);
      setPastGiveaways(past);

      // Check which giveaways user has entered
      if (userId) {
        const entries = new Set<string>();
        for (const giveaway of active) {
          const entered = await hasUserEntered(giveaway.id, userId);
          if (entered) entries.add(giveaway.id);
        }
        setUserEntries(entries);
      }
    } catch (error) {
      logger.error("Error loading giveaways:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGiveaways();
  }, [loadGiveaways]);

  const handleEnter = async (giveawayId: string) => {
    if (!userId || !userName || !userEmail) {
      toast.error("Please log in to enter giveaways");
      return;
    }

    try {
      const result = await enterGiveaway(
        giveawayId,
        userId,
        userName,
        userEmail,
        socialHandle || undefined,
        proofUrl || undefined
      );

      if (result.success) {
        toast.success(result.message);
        setUserEntries((prev) => new Set([...prev, giveawayId]));
        setSelectedGiveaway(null);
        setSocialHandle("");
        setProofUrl("");
        await loadGiveaways();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error("Error entering giveaway:", error);
      toast.error("Failed to enter giveaway");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      case "twitter":
        return <Twitter className="w-4 h-4" />;
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon!";
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Weekly Giveaways</h3>
          <p className="text-sm text-gray-400">
            Win free gear by sharing your builds & engaging with us!
          </p>
        </div>
      </div>

      {/* Active Giveaways */}
      {activeGiveaways.length > 0 ? (
        <div className="space-y-4">
          {activeGiveaways.map((giveaway) => {
            const hasEntered = userEntries.has(giveaway.id);
            const isExpanded = selectedGiveaway === giveaway.id;

            return (
              <Card
                key={giveaway.id}
                className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30 backdrop-blur-xl p-6 hover:border-pink-500/50 transition-all"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40">
                          {getPlatformIcon(giveaway.platform)}
                          <span className="ml-1 capitalize">
                            {giveaway.platform}
                          </span>
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeRemaining(giveaway.endDate)}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {giveaway.title}
                      </h4>
                      <p className="text-sm text-gray-300">
                        {giveaway.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">
                        £{giveaway.prizeValue}
                      </div>
                      <div className="text-xs text-gray-400">prize value</div>
                    </div>
                  </div>

                  {/* Prize */}
                  <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-semibold">
                      {giveaway.prize}
                    </span>
                  </div>

                  {/* Entry Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{giveaway.totalEntries} entries</span>
                  </div>

                  {/* Entry Methods */}
                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <p className="text-sm font-semibold text-white">
                        How to Enter:
                      </p>
                      <ul className="space-y-2">
                        {giveaway.entryMethods.map((method, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <Sparkles className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                            <span>
                              {method.method}
                              {method.required && (
                                <span className="text-pink-400 ml-1">*</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {!hasEntered && userId && (
                        <div className="space-y-3 pt-3">
                          <div>
                            <Label className="text-white text-sm">
                              Your Social Handle (Optional)
                            </Label>
                            <Input
                              value={socialHandle}
                              onChange={(e) => setSocialHandle(e.target.value)}
                              placeholder="@yourhandle"
                              className="bg-white/5 border-white/10 text-white mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">
                              Link to Post/Share (Optional)
                            </Label>
                            <Input
                              value={proofUrl}
                              onChange={(e) => setProofUrl(e.target.value)}
                              placeholder="https://..."
                              className="bg-white/5 border-white/10 text-white mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {hasEntered ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/40 px-4 py-2">
                        ✓ Entered! Good luck
                      </Badge>
                    ) : userId ? (
                      <>
                        {!isExpanded ? (
                          <Button
                            onClick={() => setSelectedGiveaway(giveaway.id)}
                            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Enter Giveaway
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEnter(giveaway.id)}
                              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
                            >
                              Confirm Entry
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedGiveaway(null);
                                setSocialHandle("");
                                setProofUrl("");
                              }}
                              className="border-white/20 text-white"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-pink-500/30 text-pink-300"
                        disabled
                      >
                        Log in to enter
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 text-center">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No active giveaways right now</p>
          <p className="text-sm text-gray-400">Check back next week!</p>
        </Card>
      )}

      {/* Recent Winners */}
      {pastGiveaways.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Recent Winners
          </h4>
          <div className="space-y-3">
            {pastGiveaways.map((giveaway) => (
              <div
                key={giveaway.id}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {giveaway.prize}
                  </p>
                  {giveaway.winnerName && (
                    <p className="text-xs text-gray-400">
                      Won by {giveaway.winnerName}
                    </p>
                  )}
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                  £{giveaway.prizeValue}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
