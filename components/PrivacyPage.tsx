import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: "1. Information We Collect",
      content: `We collect information that you provide directly to us, including: personal details (name, email address, phone number, postal address), payment information (processed securely through our payment providers), technical details about your PC build preferences, and account information if you create a member account. We also automatically collect certain information about your device and how you interact with our website, including IP address, browser type, operating system, and pages visited.`,
    },
    {
      icon: Eye,
      title: "2. How We Use Your Information",
      content: `We use the information we collect to: process and fulfil your orders, communicate with you about your orders and our services, provide customer support, send you marketing communications (with your consent), improve our website and services, prevent fraud and ensure security, and comply with legal obligations. We will never sell your personal information to third parties.`,
    },
    {
      icon: Lock,
      title: "3. Data Security",
      content: `We implement industry-standard security measures to protect your personal information, including SSL encryption for data transmission, secure payment processing through PCI DSS compliant providers, regular security audits and updates, restricted access to personal data on a need-to-know basis, and secure data storage with encrypted backups. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
      icon: UserCheck,
      title: "4. Your Rights Under UK GDPR",
      content: `Under UK GDPR and the Data Protection Act 2018, you have the following rights: the right to access your personal data, the right to rectification of inaccurate data, the right to erasure ("right to be forgotten"), the right to restrict processing, the right to data portability, the right to object to processing, and rights related to automated decision-making. To exercise any of these rights, please contact our Data Protection Officer.`,
    },
    {
      icon: Shield,
      title: "5. Cookies and Tracking",
      content: `We use cookies and similar tracking technologies to enhance your experience on our website. Essential cookies are necessary for the website to function properly. Analytics cookies help us understand how visitors interact with our website. Marketing cookies (with your consent) allow us to show you relevant advertisements. You can control cookie preferences through our Cookie Settings, accessible via the cookie banner or in your account settings.`,
    },
    {
      icon: Database,
      title: "6. Data Retention",
      content: `We retain your personal information for as long as necessary to fulfil the purposes outlined in this privacy policy, unless a longer retention period is required by law. Order and warranty information is retained for 7 years to comply with UK tax and accounting requirements. Marketing consent and preferences are retained until you withdraw consent. Account information is retained for as long as your account remains active or as needed to provide services.`,
    },
    {
      icon: Shield,
      title: "7. Third-Party Services",
      content: `We work with trusted third-party service providers to help us operate our business, including payment processors (Stripe, PayPal), shipping companies, email service providers, analytics providers (Google Analytics), and cloud hosting services. These providers are contractually obligated to protect your data and use it only for the specific services they provide to us.`,
    },
    {
      icon: Lock,
      title: "8. International Data Transfers",
      content: `While we primarily operate within the UK, some of our service providers may process data outside the UK. When transferring data internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the UK Information Commissioner's Office, to ensure your data receives the same level of protection as within the UK.`,
    },
    {
      icon: Eye,
      title: "9. Children's Privacy",
      content: `Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information from our systems.`,
    },
    {
      icon: UserCheck,
      title: "10. Changes to This Policy",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.`,
    },
  ];

  const dataTypes = [
    {
      type: "Personal Information",
      examples: "Name, email, phone number, address",
      purpose: "Order processing and communication",
    },
    {
      type: "Payment Information",
      examples: "Card details, billing address",
      purpose: "Payment processing (not stored by us)",
    },
    {
      type: "Technical Information",
      examples: "IP address, browser type, device info",
      purpose: "Website optimisation and security",
    },
    {
      type: "Usage Information",
      examples: "Pages visited, time spent, interactions",
      purpose: "Service improvement and analytics",
    },
    {
      type: "PC Build Preferences",
      examples: "Component selections, specifications",
      purpose: "Personalised recommendations",
    },
  ];

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
            Privacy & Data Protection
          </Badge>
          <h1 className="text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Introduction */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-white mb-2">Your Privacy Matters</h2>
              <p className="text-gray-300">
                At Vortex PCs Ltd, we are committed to protecting your privacy
                and ensuring the security of your personal information. This
                Privacy Policy explains how we collect, use, protect, and share
                your data in compliance with UK GDPR and the Data Protection Act
                2018.
              </p>
            </div>
          </div>
        </Card>

        {/* GDPR Compliance Notice */}
        <Card className="bg-green-500/10 backdrop-blur-xl border-green-500/30 p-6 mb-12">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white mb-2">UK GDPR Compliant</h3>
              <p className="text-gray-300 text-sm">
                We are fully compliant with the UK General Data Protection
                Regulation (UK GDPR) and the Data Protection Act 2018. Your data
                is processed lawfully, fairly, and transparently, and you have
                full control over your personal information.
              </p>
            </div>
          </div>
        </Card>

        {/* Data We Collect Table */}
        <div className="mb-12">
          <h2 className="text-white mb-6">Types of Data We Collect</h2>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white">Data Type</th>
                    <th className="text-left p-4 text-white">Examples</th>
                    <th className="text-left p-4 text-white">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTypes.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-gray-300">{item.type}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {item.examples}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {item.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card
              key={index}
              className="bg-white/5 backdrop-blur-xl border-white/10 p-8 hover:border-sky-500/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-sky-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white mb-3">{section.title}</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Your Rights Card */}
        <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-8 mt-12">
          <h3 className="text-white mb-6">Exercise Your Data Rights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Request access to your data",
              "Correct inaccurate information",
              "Request data deletion",
              "Restrict data processing",
              "Data portability",
              "Object to processing",
              "Withdraw consent",
              "Lodge a complaint with ICO",
            ].map((right, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">{right}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact DPO */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-white mb-2">
                Contact Our Data Protection Officer
              </h3>
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or wish to
                exercise your data rights, please contact our Data Protection
                Officer.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:dpo@vortexpcs.com"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    dpo@vortexpcs.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a
                    href="tel:+441603975440"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    01603 975440
                  </a>
                </p>
                <p>
                  Address: Data Protection Officer, Vortex PCs Ltd, London,
                  United Kingdom
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* ICO Information */}
        <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/30 p-6 mt-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white mb-2">Right to Complain</h3>
              <p className="text-gray-300 text-sm">
                You have the right to lodge a complaint with the Information
                Commissioner's Office (ICO) if you believe your data protection
                rights have been violated. Visit{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                >
                  ico.org.uk
                </a>{" "}
                or call 0303 123 1113.
              </p>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Vortex PCs Ltd • Company Registration No. 16474994</p>
          <p className="mt-2">ICO Registration Number: ZA123456</p>
        </div>
      </div>
    </div>
  );
}
