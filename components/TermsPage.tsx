import { FileText, Scale, Shield, AlertTriangle, Mail, Phone } from 'lucide-react';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

export function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full mb-6 inline-flex items-center space-x-2">
                <Scale className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Legal Terms</span>
              </div>
            </div>
            <h1>Terms & Conditions</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using our services or purchasing our products.
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
                These Terms and Conditions ("Terms") govern your use of the VortexPCs Limited website and the 
                purchase of products and services from us. VortexPCs Limited ("we", "us", "our") is a company 
                registered in England and Wales.
              </p>
              <p className="text-gray-300 mb-4">
                By accessing our website or placing an order, you agree to be bound by these Terms. If you 
                disagree with any part of these Terms, you must not use our website or services.
              </p>
              <p className="text-gray-300">
                These Terms comply with the Consumer Rights Act 2015, the Consumer Contracts (Information, 
                Cancellation and Additional Charges) Regulations 2013, and other applicable UK consumer protection laws.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Company Information */}
            <div>
              <h2 className="mb-4">2. Company Information</h2>
              <div className="glass p-6 rounded-lg border border-white/10 space-y-2">
                <p className="text-gray-300"><strong>Company Name:</strong> VortexPCs Limited</p>
                <p className="text-gray-300"><strong>Registered Office:</strong> Manchester, United Kingdom</p>
                <p className="text-gray-300"><strong>Company Number:</strong> [Company Registration Number]</p>
                <p className="text-gray-300"><strong>VAT Number:</strong> GB [VAT Number]</p>
                <p className="text-gray-300"><strong>Email:</strong> hello@vortexpcs.com</p>
                <p className="text-gray-300"><strong>Phone:</strong> 0800 123 4567</p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Ordering and Payment */}
            <div>
              <h2 className="mb-4">3. Ordering and Payment</h2>
              
              <h3 className="mb-3">3.1 Order Process</h3>
              <p className="text-gray-300 mb-4">
                When you place an order through our website, you are making an offer to purchase products from us. 
                We will send you an order confirmation email acknowledging receipt of your order. This does not 
                constitute acceptance of your order. A contract between us comes into existence when we send you 
                a dispatch confirmation email.
              </p>

              <h3 className="mb-3">3.2 Pricing</h3>
              <p className="text-gray-300 mb-4">
                All prices are displayed in British Pounds (£) and include VAT at the current rate (unless otherwise 
                stated). We reserve the right to change prices at any time, but changes will not affect orders for 
                which we have sent a dispatch confirmation.
              </p>

              <h3 className="mb-3">3.3 Payment</h3>
              <p className="text-gray-300 mb-4">
                Payment is required in full at the time of ordering. We accept major credit/debit cards and other 
                payment methods as displayed on our website. All transactions are processed securely through 
                PCI-DSS compliant payment providers.
              </p>

              <h3 className="mb-3">3.4 Custom PC Builds</h3>
              <p className="text-gray-300">
                Custom PC orders are built to your specifications. Once production has commenced, significant 
                configuration changes may not be possible. Component availability and compatibility is verified 
                before dispatch confirmation.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Delivery */}
            <div>
              <h2 className="mb-4">4. Delivery</h2>
              
              <h3 className="mb-3">4.1 Delivery Times</h3>
              <p className="text-gray-300 mb-4">
                Custom PC builds typically take 5-10 working days from order confirmation. Standard components 
                may be dispatched within 1-3 working days. Delivery estimates are provided at checkout and are 
                not guaranteed. We will notify you of any delays.
              </p>

              <h3 className="mb-3">4.2 Delivery Area</h3>
              <p className="text-gray-300 mb-4">
                We deliver to addresses within the United Kingdom mainland. Remote areas, Scottish Highlands, 
                Northern Ireland, and offshore islands may incur additional charges or extended delivery times.
              </p>

              <h3 className="mb-3">4.3 Delivery Charges</h3>
              <p className="text-gray-300 mb-4">
                Delivery charges vary based on the service selected and are displayed at checkout. Standard 
                delivery, express delivery, and collection options may be available depending on your location.
              </p>

              <h3 className="mb-3">4.4 Failed Delivery</h3>
              <p className="text-gray-300">
                If delivery cannot be completed due to incorrect address details or unavailability, you may be 
                charged for redelivery. Uncollected parcels will be returned to us, and refunds (less delivery 
                costs) will be processed in accordance with our returns policy.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Returns and Cancellations */}
            <div>
              <h2 className="mb-4">5. Returns and Cancellations</h2>
              
              <h3 className="mb-3">5.1 Your Right to Cancel</h3>
              <p className="text-gray-300 mb-4">
                Under the Consumer Contracts Regulations 2013, you have the right to cancel your order within 
                14 days of receiving the product without giving any reason. To exercise this right, you must 
                inform us of your decision using a clear statement (email or letter).
              </p>

              <h3 className="mb-3">5.2 Custom-Built PCs</h3>
              <p className="text-gray-300 mb-4">
                Custom-built PCs made to your specification may not qualify for the standard 14-day cancellation 
                right, as they are bespoke products. However, your statutory rights under the Consumer Rights 
                Act 2015 (faulty goods, not as described) remain unaffected.
              </p>

              <h3 className="mb-3">5.3 Return Conditions</h3>
              <p className="text-gray-300 mb-4">
                Returned products must be in their original condition, unused, and in original packaging. You are 
                responsible for the cost of returning items unless the product is faulty or not as described. 
                We recommend using tracked delivery for returns.
              </p>

              <h3 className="mb-3">5.4 Refunds</h3>
              <p className="text-gray-300">
                Refunds will be processed within 14 days of receiving the returned product. We will refund the 
                price paid for the product and standard delivery charges (if you cancelled the entire order). 
                Refunds will be made to the original payment method.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Warranty */}
            <div>
              <h2 className="mb-4">6. Warranty and Guarantees</h2>
              
              <h3 className="mb-3">6.1 VortexPCs Warranty</h3>
              <p className="text-gray-300 mb-4">
                All complete PC systems built by VortexPCs come with a comprehensive warranty covering parts 
                and labour. Warranty periods vary by product and are specified at the time of purchase (typically 
                1-3 years for complete systems).
              </p>

              <h3 className="mb-3">6.2 Component Warranties</h3>
              <p className="text-gray-300 mb-4">
                Individual components are covered by manufacturer warranties, which range from 1-5 years depending 
                on the component. We will facilitate warranty claims with manufacturers on your behalf.
              </p>

              <h3 className="mb-3">6.3 Consumer Rights Act 2015</h3>
              <p className="text-gray-300 mb-4">
                Your statutory rights under the Consumer Rights Act 2015 are not affected by our warranty. Goods 
                must be as described, fit for purpose, and of satisfactory quality. If products are faulty within 
                30 days, you may be entitled to a full refund. Within 6 months, products are presumed faulty at 
                the time of delivery unless we can prove otherwise.
              </p>

              <h3 className="mb-3">6.4 Warranty Exclusions</h3>
              <p className="text-gray-300">
                Warranties do not cover damage caused by misuse, accidents, unauthorised modifications, liquid 
                damage, or normal wear and tear. Opening PC cases does not void warranty, but damage caused by 
                user-installed components or improper handling is not covered.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Repair Services */}
            <div>
              <h2 className="mb-4">7. Repair Services</h2>
              
              <h3 className="mb-3">7.1 Collect & Return Service</h3>
              <p className="text-gray-300 mb-4">
                Our Collect & Return repair service provides convenient collection and return of your PC for 
                repairs. Collection and return charges apply as displayed on our website.
              </p>

              <h3 className="mb-3">7.2 Diagnosis and Estimates</h3>
              <p className="text-gray-300 mb-4">
                We provide free diagnosis for warranty repairs. For out-of-warranty repairs, a diagnosis fee 
                may apply (waived if you proceed with the repair). You will receive a detailed estimate before 
                work commences, and we will not proceed without your approval.
              </p>

              <h3 className="mb-3">7.3 Turnaround Times</h3>
              <p className="text-gray-300 mb-4">
                Standard repairs are completed within 5-7 working days. Express services are available for urgent 
                repairs. Turnaround times exclude component delivery times for parts not in stock.
              </p>

              <h3 className="mb-3">7.4 Data and Software</h3>
              <p className="text-gray-300">
                We are not responsible for data loss during repairs. You should back up all data before sending 
                your PC for repair. Software reinstallation services are available at an additional charge.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Liability */}
            <div>
              <h2 className="mb-4">8. Limitation of Liability</h2>
              
              <h3 className="mb-3">8.1 Consumer Rights</h3>
              <p className="text-gray-300 mb-4">
                Nothing in these Terms excludes or limits our liability for death or personal injury caused by 
                our negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be 
                excluded or limited under UK law.
              </p>

              <h3 className="mb-3">8.2 Business Use</h3>
              <p className="text-gray-300 mb-4">
                If you are purchasing for business purposes, we exclude all implied conditions, warranties, and 
                other terms that may apply. Our liability for business customers is limited to the purchase price 
                of the products, and we are not liable for loss of profits, revenue, data, or indirect losses.
              </p>

              <h3 className="mb-3">8.3 Data Loss</h3>
              <p className="text-gray-300">
                We strongly recommend backing up all data before any repair or service. We are not liable for 
                any data loss, regardless of cause, except where caused by our negligence.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Intellectual Property */}
            <div>
              <h2 className="mb-4">9. Intellectual Property</h2>
              <p className="text-gray-300 mb-4">
                All content on our website, including text, graphics, logos, images, and software, is owned by 
                VortexPCs Limited or our licensors and is protected by UK and international copyright, trademark, 
                and other intellectual property laws.
              </p>
              <p className="text-gray-300">
                You may not reproduce, distribute, modify, or create derivative works from our content without 
                our express written permission. Component manufacturer trademarks remain the property of their 
                respective owners.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Privacy */}
            <div>
              <h2 className="mb-4">10. Privacy and Data Protection</h2>
              <p className="text-gray-300">
                We are committed to protecting your privacy. Our{' '}
                <button
                  onClick={() => onNavigate('privacy')}
                  className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </button>
                {' '}explains how we collect, use, and protect your personal information in accordance with UK GDPR 
                and the Data Protection Act 2018.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Acceptable Use */}
            <div>
              <h2 className="mb-4">11. Acceptable Use</h2>
              <p className="text-gray-300 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>Use our website in any way that violates UK laws or regulations</li>
                <li>Attempt to gain unauthorised access to our systems or networks</li>
                <li>Transmit viruses, malware, or other harmful code</li>
                <li>Scrape, harvest, or collect data from our website using automated means</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Use our services for fraudulent purposes</li>
              </ul>
            </div>

            <Separator className="bg-white/10" />

            {/* Force Majeure */}
            <div>
              <h2 className="mb-4">12. Force Majeure</h2>
              <p className="text-gray-300">
                We will not be liable for any failure or delay in performing our obligations caused by events 
                beyond our reasonable control, including but not limited to acts of God, war, terrorism, civil 
                unrest, industrial disputes, component shortages, pandemics, or failure of telecommunications or 
                transport networks.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Changes to Terms */}
            <div>
              <h2 className="mb-4">13. Changes to These Terms</h2>
              <p className="text-gray-300">
                We may revise these Terms from time to time. Updated Terms will be posted on our website with 
                a revised "Last Updated" date. Changes will not affect orders already placed unless required by 
                law. Your continued use of our website constitutes acceptance of the updated Terms.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Governing Law */}
            <div>
              <h2 className="mb-4">14. Governing Law and Jurisdiction</h2>
              <p className="text-gray-300 mb-4">
                These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms 
                or your use of our website will be subject to the exclusive jurisdiction of the courts of England 
                and Wales.
              </p>
              <p className="text-gray-300">
                If you are a consumer, you may also have rights under the laws of your country of residence, and 
                nothing in these Terms affects your statutory rights.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Dispute Resolution */}
            <div>
              <h2 className="mb-4">15. Dispute Resolution</h2>
              <p className="text-gray-300 mb-4">
                If you have a complaint, please contact us first so we can try to resolve the issue. We are 
                committed to resolving disputes amicably.
              </p>
              <p className="text-gray-300">
                If you are not satisfied with our response, you may refer your complaint to an alternative 
                dispute resolution provider or the appropriate regulatory body. EU consumers may also use the 
                European Commission's Online Dispute Resolution platform.
              </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Contact Information */}
            <div>
              <h2 className="mb-4">16. Contact Us</h2>
              <p className="text-gray-300 mb-6">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="glass p-6 border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm mb-1">Email</h3>
                      <p className="text-sm text-gray-300">hello@vortexpcs.com</p>
                      <p className="text-xs text-gray-400 mt-1">General Enquiries</p>
                    </div>
                  </div>
                </Card>

                <Card className="glass p-6 border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm mb-1">Phone</h3>
                      <p className="text-sm text-gray-300">0800 123 4567</p>
                      <p className="text-xs text-gray-400 mt-1">Mon-Fri, 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-6 glass p-4 rounded-lg border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <strong>Important:</strong> These Terms and Conditions are provided for demonstration purposes. 
                      In a production environment, you should seek professional legal advice to ensure compliance 
                      with all applicable laws and regulations.
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
