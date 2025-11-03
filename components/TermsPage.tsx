import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, FileText, AlertCircle, CheckCircle } from "lucide-react";

export function TermsPage() {
  const sections = [
    {
      title: "1. Agreement to Terms",
      content: `By accessing and using the Vortex PCs Ltd website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and continued use of our services constitutes acceptance of any changes.`,
    },
    {
      title: "2. Custom PC Building Services",
      content: `Our custom PC building services include consultation, component selection, assembly, testing, and delivery. All builds are completed within 5 working days from the date of order confirmation and payment receipt. Build specifications are finalised upon order placement and any changes requested after this point may incur additional fees and extend the build timeline.`,
    },
    {
      title: "3. Pricing and Payment",
      content: `All prices are displayed in British Pounds (GBP) and include VAT at the current rate. We require full payment before commencing the build process. Payment can be made via credit card, debit card, or bank transfer. Prices are subject to change based on component availability and market conditions. Once an order is placed and paid for, the agreed price is fixed.`,
    },
    {
      title: "4. Warranty Terms",
      content: `All custom-built PCs come with a comprehensive 3-year warranty covering parts and labour. This warranty covers manufacturing defects and component failures under normal use. The warranty does not cover damage caused by misuse, accidents, unauthorised modifications, or normal wear and tear. Warranty claims must be submitted in writing with proof of purchase.`,
    },
    {
      title: "5. Returns and Refunds",
      content: `Custom-built PCs can be returned within 14 days of receipt for a full refund, subject to the system being in original condition with all packaging and accessories. Returns must be authorised in advance. Refunds will be processed within 14 days of receiving the returned item. Return shipping costs are the responsibility of the customer unless the return is due to our error or a defective product.`,
    },
    {
      title: "6. Repair Services",
      content: `Our UK-wide collect and return repair service covers hardware diagnostics, component replacement, and system optimisation. Repair quotes are provided free of charge after initial assessment. Customers are responsible for backing up their data before sending systems for repair. We are not liable for data loss during the repair process.`,
    },
    {
      title: "7. Limitation of Liability",
      content: `Vortex PCs Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use our products or services. Our total liability shall not exceed the amount paid by you for the product or service in question. This limitation applies to all causes of action, including breach of contract, breach of warranty, negligence, and other torts.`,
    },
    {
      title: "8. Intellectual Property",
      content: `All content on this website, including text, graphics, logos, images, and software, is the property of Vortex PCs Ltd and is protected by UK and international copyright laws. You may not reproduce, distribute, or create derivative works from our content without explicit written permission.`,
    },
    {
      title: "9. Privacy and Data Protection",
      content: `We are committed to protecting your privacy in accordance with the UK GDPR and Data Protection Act 2018. Personal information collected during orders or account registration is used solely for fulfilling services and improving customer experience. We do not sell or share your personal information with third parties except as necessary to complete your order or as required by law.`,
    },
    {
      title: "10. Dispute Resolution",
      content: `Any disputes arising from these terms or our services shall be governed by the laws of England and Wales. We encourage customers to contact us directly to resolve any issues. If a resolution cannot be reached, disputes may be escalated to the appropriate UK courts.`,
    },
    {
      title: "11. Component Availability",
      content: `While we strive to maintain accurate inventory information, component availability can change rapidly. If a selected component becomes unavailable, we will contact you to offer suitable alternatives of equal or better specification. If no acceptable alternative is available, we will issue a full refund for that component or the entire order at your discretion.`,
    },
    {
      title: "12. Delivery and Risk",
      content: `We use fully insured courier services for all deliveries within the UK. Delivery times are estimates and not guaranteed. Risk of loss or damage passes to you upon delivery. You must inspect your delivery upon receipt and report any damage within 48 hours. Signature confirmation is required for all deliveries.`,
    },
  ];

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
            Legal
          </Badge>
          <h1 className="text-white mb-4">Terms of Service</h1>
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
              <FileText className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-white mb-2">Welcome to Vortex PCs Ltd</h2>
              <p className="text-gray-300">
                These Terms of Service govern your use of our website and
                services. Please read them carefully before placing an order or
                using our services.
              </p>
            </div>
          </div>
        </Card>

        {/* Important Notice */}
        <Card className="bg-orange-500/10 backdrop-blur-xl border-orange-500/30 p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white mb-2">Important Notice</h3>
              <p className="text-gray-300 text-sm">
                By using our services, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service. If
                you have any questions, please contact us before proceeding with
                your order.
              </p>
            </div>
          </div>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card
              key={index}
              className="bg-white/5 backdrop-blur-xl border-white/10 p-8 hover:border-sky-500/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-sky-400" />
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

        {/* Contact Information */}
        <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-8 mt-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-white mb-2">Questions About These Terms?</h3>
              <p className="text-gray-300 mb-4">
                If you have any questions or concerns about these Terms of
                Service, please don't hesitate to contact us.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:legal@vortexpcs.com"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    legal@vortexpcs.com
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
                <p>Address: Vortex PCs Ltd, London, United Kingdom</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Vortex PCs Ltd • Company Registration No. 16474994</p>
          <p className="mt-2">Registered in England and Wales</p>
        </div>
      </div>
    </div>
  );
}
