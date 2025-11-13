import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Zap,
  Shield,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { logger } from "../services/logger";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  fetchContactInformation,
  type ContactInformation,
} from "../services/cms";

interface ContactProps {
  onNavigate?: (view: string) => void;
}

export function Contact({ onNavigate }: ContactProps = {}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    enquiryType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInformation | null>(
    null
  );

  useEffect(() => {
    const loadContactInfo = async () => {
      const data = await fetchContactInformation();
      setContactInfo(data);
    };
    loadContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send to Vercel serverless function
      const response = await fetch("/api/contact/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          enquiryType: "",
          message: "",
        });

        // Reset success message after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        const errMsg = [data?.error, data?.hint, data?.details]
          .filter(Boolean)
          .join(" – ")
          .slice(0, 300);
        throw new Error(errMsg || "Failed to send message");
      }
    } catch (error) {
      logger.error("Contact form submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again or contact us directly at info@vortexpcs.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      value: "info@vortexpcs.com",
      description: "Send us an email any time",
      href: "mailto:info@vortexpcs.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "01603 975440",
      description: contactInfo?.businessHours
        ? (() => {
            const hours = contactInfo.businessHours!;
            const parts: string[] = [];

            // Check Mon-Fri
            const weekdayHours = hours.monday;
            const allWeekdaysSame = [
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
            ].every((day) => hours[day] === weekdayHours);

            if (allWeekdaysSame && weekdayHours) {
              parts.push(`Mon-Fri ${weekdayHours}`);
            } else {
              ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(
                (day) => {
                  if (hours[day]) {
                    parts.push(
                      `${day.charAt(0).toUpperCase() + day.slice(1, 3)} ${
                        hours[day]
                      }`
                    );
                  }
                }
              );
            }

            if (hours.saturday) parts.push(`Sat ${hours.saturday}`);
            if (hours.sunday) parts.push(`Sun ${hours.sunday}`);

            return parts.join(", ");
          })()
        : "Mon-Fri 08:30-18:00, Sat 09:00-16:00, Sun Closed",
      href: "tel:+441603975440",
      color: "blue",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Rapid Response",
      description: "We aim to respond to all enquiries within 24 hours",
    },
    {
      icon: Shield,
      title: "Expert Advice",
      description: "20+ years of experience at your service",
    },
    {
      icon: Award,
      title: "Personalised Service",
      description: "Direct communication with Kevin Mackay",
    },
  ];

  return (
    <div className="min-h-screen py-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-sky-500/20 rounded-full">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-sky-400">We're Here to Help</span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-white">Get in Touch</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent mx-auto"></div>
            </div>

            {/* Intro text */}
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Have questions about our builds? Need expert advice? Ready to
              start your custom PC journey? We'd love to hear from you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="relative py-16 overflow-hidden">
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
              {contactMethods.map((method, index) => (
                <Card
                  key={index}
                  className="group relative bg-white/5 backdrop-blur-xl border-white/10 p-8 text-center hover:border-sky-500/30 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-500/0 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                  <div className="relative space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                      <method.icon className="w-8 h-8 text-sky-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl text-white">{method.title}</h3>
                      {method.href ? (
                        <a
                          href={method.href}
                          className="block text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          {method.value}
                        </a>
                      ) : (
                        <p className="text-gray-300">{method.value}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Contact Form Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 md:p-12">
                  <div className="space-y-8">
                    {/* Form header */}
                    <div className="space-y-4">
                      <h2 className="text-white">Send Us a Message</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-sky-500 to-transparent"></div>
                      <p className="text-gray-400">
                        Fill out the form below and we'll get back to you as
                        soon as possible.
                      </p>
                    </div>

                    {/* Success message */}
                    {isSubmitted && (
                      <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-400">
                            Message sent successfully!
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            We'll get back to you within 24 hours.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-300">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              handleChange("name", e.target.value)
                            }
                            placeholder="John Smith"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-sky-500/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-300">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              handleChange("email", e.target.value)
                            }
                            placeholder="john@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-sky-500/20"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-300">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleChange("phone", e.target.value)
                            }
                            placeholder="+44 7123 456789"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-sky-500/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="enquiryType"
                            className="text-gray-300"
                          >
                            Enquiry Type *
                          </Label>
                          <Select
                            value={formData.enquiryType}
                            onValueChange={(value) =>
                              handleChange("enquiryType", value)
                            }
                            required
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-sky-500/50 focus:ring-sky-500/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                              <SelectItem value="custom-build">
                                Custom Build Enquiry
                              </SelectItem>
                              <SelectItem value="repair">
                                Repair Service
                              </SelectItem>
                              <SelectItem value="upgrade">
                                Upgrade Consultation
                              </SelectItem>
                              <SelectItem value="warranty">
                                Warranty Support
                              </SelectItem>
                              <SelectItem value="general">
                                General Question
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-gray-300">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={(e) =>
                            handleChange("subject", e.target.value)
                          }
                          placeholder="How can we help you?"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-sky-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-gray-300">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) =>
                            handleChange("message", e.target.value)
                          }
                          placeholder="Tell us about your requirements..."
                          rows={6}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50 focus:ring-sky-500/20 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        variant="primary"
                        size="lg"
                        className="w-full md:w-auto"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Send Message
                          </span>
                        )}
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Opening Hours */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-sky-400" />
                      </div>
                      <h3 className="text-white">Opening Hours</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      {contactInfo?.businessHours ? (
                        (() => {
                          // Group consecutive days with same hours
                          const hours = contactInfo.businessHours!;
                          const grouped: Array<{
                            label: string;
                            hours: string;
                          }> = [];

                          // Check Mon-Fri
                          const weekdayHours = hours.monday;
                          const allWeekdaysSame = [
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                          ].every((day) => hours[day] === weekdayHours);

                          if (allWeekdaysSame && weekdayHours) {
                            grouped.push({
                              label: "Mon-Fri",
                              hours: weekdayHours,
                            });
                          } else {
                            // List individually if different
                            [
                              "monday",
                              "tuesday",
                              "wednesday",
                              "thursday",
                              "friday",
                            ].forEach((day) => {
                              if (hours[day]) {
                                grouped.push({
                                  label:
                                    day.charAt(0).toUpperCase() +
                                    day.slice(1, 3),
                                  hours: hours[day],
                                });
                              }
                            });
                          }

                          // Add Saturday
                          if (hours.saturday) {
                            grouped.push({
                              label: "Sat",
                              hours: hours.saturday,
                            });
                          }

                          // Add Sunday
                          if (hours.sunday) {
                            grouped.push({ label: "Sun", hours: hours.sunday });
                          }

                          return grouped.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between py-2"
                            >
                              <span className="text-gray-400">
                                {item.label}
                              </span>
                              <span
                                className={
                                  item.hours.toLowerCase() === "closed"
                                    ? "text-gray-500"
                                    : "text-white"
                                }
                              >
                                {item.hours}
                              </span>
                            </div>
                          ));
                        })()
                      ) : (
                        <>
                          <div className="flex justify-between py-2">
                            <span className="text-gray-400">Mon-Fri</span>
                            <span className="text-white">08:30 - 18:00</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-gray-400">Sat</span>
                            <span className="text-white">09:00 - 16:00</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-gray-400">Sun</span>
                            <span className="text-gray-500">Closed</span>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-gray-500 pt-2">
                        All times in GMT/BST
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Why Contact Us */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
                  <div className="space-y-6">
                    <h3 className="text-white">Why Contact Us?</h3>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                          <h4 className="text-white text-sm">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Info */}
                <Card className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 backdrop-blur-xl border-sky-500/20 p-6">
                  <div className="space-y-3">
                    <h3 className="text-white">Need Immediate Help?</h3>
                    <p className="text-sm text-gray-300">
                      For urgent enquiries, give us a call during business hours
                      and speak directly with our team.
                    </p>
                    <a
                      href="tel:+441603975440"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/20 border border-sky-500/30 rounded-lg text-sky-400 hover:bg-sky-500/30 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      01603 975440
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative py-24 overflow-hidden">
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border-white/10 p-12 text-center">
              <div className="space-y-6">
                <h2 className="text-white">Prefer to Build Online?</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Use our intelligent PC Builder or PC Finder to create your
                  perfect custom system tailored to your exact needs and budget.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    onClick={() => onNavigate?.("pc-builder")}
                    variant="primary"
                    size="lg"
                  >
                    Start PC Builder
                  </Button>
                  <Button
                    onClick={() => onNavigate?.("pc-finder")}
                    variant="ghost"
                    size="lg"
                  >
                    Use PC Finder
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
