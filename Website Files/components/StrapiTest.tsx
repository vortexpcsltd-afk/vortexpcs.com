/**
 * Strapi Connection Test Component
 * This component tests the connection to your Strapi CMS
 */

import { useState, useEffect } from "react";
import { fetchCategories, type Category } from "../services/cms";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function StrapiTest() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setConnected(null);

    try {
      console.log("🔍 Testing Strapi connection...");
      const data = await fetchCategories();

      if (data && data.length > 0) {
        setCategories(data);
        setConnected(true);
        console.log("✅ Strapi connection successful:", data);
      } else {
        setConnected(false);
        setError("No categories found - using mock data");
      }
    } catch (err: any) {
      setConnected(false);
      setError(err.message || "Connection failed");
      console.error("❌ Strapi connection failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          {connected === true && (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
          {connected === false && <XCircle className="h-6 w-6 text-red-500" />}
          {connected === null && loading && (
            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          )}
          Strapi CMS Connection Test
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-300">
              Status:{" "}
              {connected === true && (
                <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                  Connected
                </Badge>
              )}
              {connected === false && (
                <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
                  Disconnected
                </Badge>
              )}
              {connected === null && loading && (
                <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-400">
                  Testing...
                </Badge>
              )}
            </p>
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <Button
            onClick={testConnection}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:border-sky-500/50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Test Again"
            )}
          </Button>
        </div>

        {categories.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Categories Found ({categories.length})
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">{category.name}</h4>
                    <Badge
                      variant="outline"
                      className="border-sky-500/40 text-sky-400"
                    >
                      ID: {category.id}
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-gray-400 text-sm mt-1">
                      {category.description}
                    </p>
                  )}
                  {category.slug && (
                    <p className="text-gray-500 text-xs mt-1">
                      Slug: {category.slug}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <h4 className="font-medium text-white mb-2">Connection Details</h4>
          <div className="space-y-1 text-sm">
            <p className="text-gray-400">
              Strapi URL:{" "}
              <span className="text-sky-400">http://localhost:1337</span>
            </p>
            <p className="text-gray-400">
              API Endpoint:{" "}
              <span className="text-sky-400">/api/categories</span>
            </p>
            <p className="text-gray-400">
              Expected Categories: Budget PCs, Gaming PCs, Workstation PCs
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
