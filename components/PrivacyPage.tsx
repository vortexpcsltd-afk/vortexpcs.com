import { Shield, Mail, Phone, FileText, Clock, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full mb-6 inline-flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">UK Data Protection</span>
              </div>
            </div>
            <h1>Privacy Policy</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.
            </p>
            <p className="text-sm text-gray-400">
              Last updated: 14th October 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-strong rgb-glow p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <div>
              <h2 className="mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                VortexPCs Limited ("we", "us", "our") is committed to protecting and respecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you visit our website or purchase our products and services.
              </p>
              <p className="text-gray-300">
                This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data 
                Protection Act 2018. We are registered with the Information Commissioner's Office (ICO) 
                under registration number [ICO Registration Number].
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Information We Collect */}
            <div>
              <h2 className="mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2">2.1 Personal Information</h3>
                  <p className="text-gray-300 mb-2">
                    We may collect the following personal information:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Name and contact details (email address, phone number, postal address)</li>
                    <li>Billing and delivery information</li>
                    <li>Payment card details (processed securely by our payment provider)</li>
                    <li>Order history and transaction details</li>
                    <li>Account credentials and preferences</li>
                    <li>Technical support and repair service information</li>
                    <li>Marketing preferences and communication history</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2">2.2 Technical Information</h3>
                  <p className="text-gray-300 mb-2">
                    When you visit our website, we automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>IP address and browser type</li>
                    <li>Device information and operating system</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring website and exit pages</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* How We Use Your Information */}
            <div>
              <h2 className="mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">
                We use your personal information for the following purposes:
              </p>
              <div className="space-y-3">
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-2">Order Processing & Fulfilment</h3>
                  <p className="text-sm text-gray-400">
                    To process your orders, arrange delivery, and provide after-sales support including 
                    warranty claims and repairs.
                  </p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-2">Customer Service</h3>
                  <p className="text-sm text-gray-400">
                    To respond to your enquiries, provide technical support, and manage your account.
                  </p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-2">Marketing Communications</h3>
                  <p className="text-sm text-gray-400">
                    To send you promotional emails about new products, special offers, and updates 
                    (only with your consent, which you can withdraw at any time).
                  </p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-2">Website Improvement</h3>
                  <p className="text-sm text-gray-400">
                    To analyse website usage, improve our services, and personalise your experience.
                  </p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-2">Legal Compliance</h3>
                  <p className="text-sm text-gray-400">
                    To comply with legal obligations, including consumer rights, taxation, and accounting requirements.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Legal Basis */}
            <div>
              <h2 className="mb-4">4. Legal Basis for Processing</h2>
              <p className="text-gray-300 mb-4">
                Under UK GDPR, we process your personal data on the following legal grounds:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Contract Performance:</strong> Processing necessary to fulfil our contract with you when you purchase our products or services</li>
                <li><strong>Legitimate Interests:</strong> For business operations, fraud prevention, and improving our services</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies (which you can withdraw at any time)</li>
                <li><strong>Legal Obligation:</strong> To comply with UK laws and regulations</li>
              </ul>
            </div>

            <Separator className="bg-white/10" />

            {/* Data Sharing */}
            <div>
              <h2 className="mb-4">5. Sharing Your Information</h2>
              <p className="text-gray-300 mb-4">
                We may share your personal information with:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Trusted third parties who help us operate our business (e.g., payment processors, delivery services, IT support)</li>
                <li><strong>Component Suppliers:</strong> To fulfil custom PC orders and arrange warranty claims</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-gray-300 mt-4">
                We do not sell your personal information to third parties for their marketing purposes.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Cookies */}
            <div>
              <h2 className="mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your browsing experience. Cookies are 
                small text files stored on your device that help us:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Analyse website traffic and user behaviour</li>
                <li>Personalise content and advertisements</li>
                <li>Improve website functionality and security</li>
              </ul>
              <p className="text-gray-300">
                You can manage your cookie preferences through our cookie banner or your browser settings. 
                Disabling certain cookies may affect website functionality.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Data Security */}
            <div>
              <h2 className="mb-4">7. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate technical and organisational security measures to protect your 
                personal data against unauthorised access, alteration, disclosure, or destruction. These include:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure payment processing through PCI-DSS compliant providers</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Restricted access to personal data on a need-to-know basis</li>
                <li>Staff training on data protection and security</li>
              </ul>
            </div>

            <Separator className="bg-white/10" />

            {/* Data Retention */}
            <div>
              <h2 className="mb-4">8. Data Retention</h2>
              <p className="text-gray-300">
                We retain your personal data only for as long as necessary to fulfil the purposes outlined 
                in this policy, comply with legal obligations, resolve disputes, and enforce agreements. 
                Typically:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4 mt-4">
                <li>Order and transaction data: 7 years (for tax and accounting purposes)</li>
                <li>Marketing data: Until you withdraw consent or unsubscribe</li>
                <li>Website analytics: Up to 26 months</li>
                <li>Support tickets: 3 years after resolution</li>
              </ul>
            </div>

            <Separator className="bg-white/10" />

            {/* Your Rights */}
            <div>
              <h2 className="mb-4">9. Your Rights</h2>
              <p className="text-gray-300 mb-4">
                Under UK GDPR, you have the following rights:
              </p>
              <div className="space-y-3">
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Access</h3>
                  <p className="text-sm text-gray-400">Request a copy of your personal data</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Rectification</h3>
                  <p className="text-sm text-gray-400">Request correction of inaccurate data</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Erasure</h3>
                  <p className="text-sm text-gray-400">Request deletion of your personal data (subject to legal obligations)</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Restrict Processing</h3>
                  <p className="text-sm text-gray-400">Request limitation on how we use your data</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Data Portability</h3>
                  <p className="text-sm text-gray-400">Receive your data in a structured, machine-readable format</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Object</h3>
                  <p className="text-sm text-gray-400">Object to processing based on legitimate interests or for marketing</p>
                </div>
                <div className="glass p-4 rounded-lg border border-white/10">
                  <h3 className="text-sm mb-1">Right to Withdraw Consent</h3>
                  <p className="text-sm text-gray-400">Withdraw consent for data processing at any time</p>
                </div>
              </div>
              <p className="text-gray-300 mt-4">
                To exercise any of these rights, please contact us using the details below. We will respond 
                within one month of your request.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Third Party Links */}
            <div>
              <h2 className="mb-4">10. Third-Party Links</h2>
              <p className="text-gray-300">
                Our website may contain links to third-party websites. We are not responsible for the privacy 
                practices of these external sites. We encourage you to read their privacy policies before 
                providing any personal information.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Children's Privacy */}
            <div>
              <h2 className="mb-4">11. Children's Privacy</h2>
              <p className="text-gray-300">
                Our services are not directed at children under 16 years of age. We do not knowingly collect 
                personal data from children. If you believe we have inadvertently collected information from 
                a child, please contact us immediately.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Changes to Policy */}
            <div>
              <h2 className="mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time to reflect changes in our practices or 
                legal requirements. We will notify you of any significant changes by posting the new policy 
                on our website with an updated "Last Updated" date. Your continued use of our services 
                constitutes acceptance of the updated policy.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Contact Information */}
            <div>
              <h2 className="mb-4">13. Contact Us</h2>
              <p className="text-gray-300 mb-6">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="glass p-6 border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm mb-1">Email</h3>
                      <p className="text-sm text-gray-300">privacy@vortexpcs.com</p>
                      <p className="text-xs text-gray-400 mt-1">Data Protection Enquiries</p>
                    </div>
                  </div>
                </Card>

                <Card className="glass p-6 border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm mb-1">Postal Address</h3>
                      <p className="text-sm text-gray-300">Data Protection Officer</p>
                      <p className="text-sm text-gray-300">VortexPCs Limited</p>
                      <p className="text-sm text-gray-300">Manchester, UK</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-6 glass p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <strong>ICO Complaints:</strong> If you are not satisfied with our response, you have the right 
                      to lodge a complaint with the Information Commissioner's Office (ICO) at{' '}
                      <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                        ico.org.uk
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
