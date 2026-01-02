/**
 * System Monitoring Dashboard Component
 * Simplified real-time system health monitoring
 */

import { useState, useEffect } from "react";
import { logger } from "../services/logger";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  Server,
  Mail,
  Database,
  CreditCard,
  FileText,
  Cloud,
  AlertTriangle,
} from "lucide-react";
import { auth, db } from "../config/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { toast } from "sonner";

interface ServiceCheck {
  name: string;
  status: "checking" | "healthy" | "error";
  message: string;
  icon: typeof Server;
}

export function MonitoringDashboard() {
  const [services, setServices] = useState<ServiceCheck[]>([
    {
      name: "Firebase Auth",
      status: "checking",
      message: "Checking...",
      icon: Database,
    },
    {
      name: "Firestore Database",
      status: "checking",
      message: "Checking...",
      icon: Database,
    },
    {
      name: "Contentful CMS",
      status: "checking",
      message: "Checking...",
      icon: FileText,
    },
    {
      name: "Stripe Payments",
      status: "checking",
      message: "Checking...",
      icon: CreditCard,
    },
    {
      name: "Email Service",
      status: "checking",
      message: "Checking...",
      icon: Mail,
    },
    {
      name: "Vercel Hosting",
      status: "checking",
      message: "Checking...",
      icon: Cloud,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    runHealthChecks();

    if (autoRefresh) {
      const interval = setInterval(runHealthChecks, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const runHealthChecks = async () => {
    setLoading(true);
    const checks: ServiceCheck[] = [];

    // 1. Check Firebase Auth
    try {
      if (auth && auth.currentUser) {
        checks.push({
          name: "Firebase Auth",
          status: "healthy",
          message: "Connected and authenticated",
          icon: Database,
        });
      } else if (auth) {
        checks.push({
          name: "Firebase Auth",
          status: "healthy",
          message: "Service available (not signed in)",
          icon: Database,
        });
      } else {
        checks.push({
          name: "Firebase Auth",
          status: "error",
          message: "Not initialized",
          icon: Database,
        });
      }
    } catch (error) {
      checks.push({
        name: "Firebase Auth",
        status: "error",
        message: error instanceof Error ? error.message : "Connection failed",
        icon: Database,
      });
    }

    // 2. Check Firestore
    try {
      if (db) {
        const testQuery = query(collection(db, "orders"), limit(1));
        await getDocs(testQuery);
        checks.push({
          name: "Firestore Database",
          status: "healthy",
          message: "Connected and responsive",
          icon: Database,
        });
      } else {
        checks.push({
          name: "Firestore Database",
          status: "error",
          message: "Not initialized",
          icon: Database,
        });
      }
    } catch (error) {
      checks.push({
        name: "Firestore Database",
        status: "error",
        message: error instanceof Error ? error.message : "Query failed",
        icon: Database,
      });
    }

    // 3. Check Contentful CMS
    try {
      const spaceId = import.meta.env.VITE_CONTENTFUL_SPACE_ID;
      const accessToken = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN;

      if (spaceId && accessToken) {
        const response = await fetch(
          `https://cdn.contentful.com/spaces/${spaceId}/entries?limit=1`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.ok) {
          checks.push({
            name: "Contentful CMS",
            status: "healthy",
            message: "API responding",
            icon: FileText,
          });
        } else {
          checks.push({
            name: "Contentful CMS",
            status: "error",
            message: `HTTP ${response.status}`,
            icon: FileText,
          });
        }
      } else {
        checks.push({
          name: "Contentful CMS",
          status: "error",
          message: "Not configured",
          icon: FileText,
        });
      }
    } catch (error) {
      logger.warn("Contentful CMS check failed", { error });
      checks.push({
        name: "Contentful CMS",
        status: "error",
        message: "Connection failed",
        icon: FileText,
      });
    }

    // 4. Check Stripe (via public key presence)
    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (stripeKey && stripeKey.startsWith("pk_")) {
        checks.push({
          name: "Stripe Payments",
          status: "healthy",
          message: "API key configured",
          icon: CreditCard,
        });
      } else {
        checks.push({
          name: "Stripe Payments",
          status: "error",
          message: "Not configured",
          icon: CreditCard,
        });
      }
    } catch (error) {
      logger.warn("Stripe key check failed", { error });
      checks.push({
        name: "Stripe Payments",
        status: "error",
        message: "Configuration error",
        icon: CreditCard,
      });
    }

    // 5. Check Email Service (via API endpoint)
    try {
      // Frontend cannot check SMTP env vars (backend only)
      // Use API health check instead
      const response = await fetch("/api/email/verify-config");
      if (response.ok) {
        checks.push({
          name: "Email Service",
          status: "healthy",
          message: "API responding",
          icon: Mail,
        });
      } else {
        checks.push({
          name: "Email Service",
          status: "error",
          message: "API check failed",
          icon: Mail,
        });
      }
    } catch (error) {
      logger.warn("Email service config check failed", { error });
      checks.push({
        name: "Email Service",
        status: "error",
        message: "Configuration error",
        icon: Mail,
      });
    }

    // 6. Vercel Hosting (always healthy if we're running)
    checks.push({
      name: "Vercel Hosting",
      status: "healthy",
      message: "Application running",
      icon: Cloud,
    });

    setServices(checks);
    setLastCheck(new Date());
    setLoading(false);

    // Show toast if any services are down
    const failedServices = checks.filter((s) => s.status === "error");
    if (failedServices.length > 0) {
      toast.warning(`${failedServices.length} service(s) reporting issues`);
    }
  };

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const errorCount = services.filter((s) => s.status === "error").length;
  const overallStatus =
    errorCount === 0 ? "healthy" : errorCount >= 3 ? "down" : "degraded";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400 bg-green-500/20 border-green-500/40";
      case "checking":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/40";
      case "error":
        return "text-red-400 bg-red-500/20 border-red-500/40";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/40";
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case "healthy":
        return "bg-green-500/10 border-green-500/30";
      case "degraded":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "down":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-gray-500/10 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
          <p className="text-gray-400 mt-1">
            Real-time health checks and service status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "border-sky-500/50 text-sky-400" : ""}
          >
            <Activity
              className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`}
            />
            Auto-Refresh {autoRefresh ? "On" : "Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthChecks}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className={`p-6 ${getOverallStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {overallStatus === "healthy" ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : overallStatus === "degraded" ? (
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h3 className="text-xl font-bold text-white capitalize">
                System Status: {overallStatus}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {healthyCount} of {services.length} services operational
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge
              className={getStatusColor(
                overallStatus === "healthy" ? "healthy" : "error"
              )}
            >
              {overallStatus.toUpperCase()}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card
              key={index}
              className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:border-sky-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      service.status === "healthy"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : service.status === "error"
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : "bg-gradient-to-r from-yellow-500 to-amber-500"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">
                    {service.name}
                  </span>
                </div>
                {service.status === "healthy" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : service.status === "error" ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />
                )}
              </div>
              <div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
                <p className="text-sm text-gray-400 mt-2">{service.message}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Service Status Summary */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">System Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{healthyCount}</p>
            <p className="text-sm text-gray-400 mt-1">Healthy</p>
          </div>
          <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">
              {services.filter((s) => s.status === "checking").length}
            </p>
            <p className="text-sm text-gray-400 mt-1">Checking</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{errorCount}</p>
            <p className="text-sm text-gray-400 mt-1">Errors</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() =>
              window.open("https://console.firebase.google.com", "_blank")
            }
          >
            <Server className="w-4 h-4 mr-2" />
            Firebase Console
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => window.open("https://app.contentful.com", "_blank")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Contentful Dashboard
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() =>
              window.open("https://dashboard.stripe.com", "_blank")
            }
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Stripe Dashboard
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() =>
              window.open("https://vercel.com/dashboard", "_blank")
            }
          >
            <Cloud className="w-4 h-4 mr-2" />
            Vercel Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
