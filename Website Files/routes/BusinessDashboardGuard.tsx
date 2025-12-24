import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Building2, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { BusinessDashboard } from "../components/BusinessDashboard";

export function BusinessDashboardGuard({
  isLoggedIn,
  setShowLoginDialog,
}: {
  isLoggedIn: boolean;
  setShowLoginDialog: (show: boolean) => void;
}) {
  const { navigate } = useNavigation();
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white py-12 px-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-sky-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            You must be logged in to access the Business Dashboard.
          </p>
          <Button
            onClick={() => setShowLoginDialog(true)}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (userProfile?.accountType !== "business") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white py-12 px-4">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 max-w-md text-center">
          <Building2 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Business Account Required</h2>
          <p className="text-gray-400 mb-6">
            The Business Dashboard is only accessible to verified business
            customers. Business accounts are created by our team during
            onboarding.
          </p>
          <Button
            onClick={() => navigate("business-solutions")}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            Learn About Business Solutions
          </Button>
        </Card>
      </div>
    );
  }

  return <BusinessDashboard />;
}
