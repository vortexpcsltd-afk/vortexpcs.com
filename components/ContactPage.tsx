import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useState } from "react";
const backgroundImage = "/vortex-keyboard.png";

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "hello@vortexpcs.com",
      subContent: "We respond within 24 hours",
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "0800 123 4567",
      subContent: "Mon-Fri, 9:00 AM - 6:00 PM",
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      content: "Instant Help Available",
      subContent: "Chat with our intelligent AI",
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: "Monday - Friday",
      subContent: "9:00 AM - 6:00 PM GMT",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-block">
              <div className="glass px-4 py-2 rounded-full mb-6 inline-flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">
                  We're Here to Help
                </span>
              </div>
            </div>
            <h1>Get in Touch</h1>
            <p className="text-xl text-gray-300">
              Have a question about our custom PCs or repair services? Our
              expert team is ready to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative -mt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, index) => (
              <Card
                key={index}
                className="glass-strong rgb-glow p-6 hover:scale-105 transition-transform"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm mb-1">{item.title}</h3>
                    <p className="text-gray-100">{item.content}</p>
                    <p className="text-sm text-gray-400">{item.subContent}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">Get in Touch</span>
                </div>
                <h2 className="mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Send Us a Message
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Fill out the form below and we'll get back to you as soon as
                  possible. For urgent enquiries, please call us directly.
                </p>
              </div>

              <Card className="glass-strong rgb-glow p-8 relative overflow-hidden">
                {/* Decorative gradient orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 relative z-10"
                >
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3 group">
                      <Label
                        htmlFor="name"
                        className="text-gray-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-focus-within:scale-150 transition-transform"></span>
                        Full Name
                      </Label>
                      <div className="relative">
                        <Input
                          id="name"
                          placeholder="John Smith"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          className="bg-white/5 border-white/10 focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-cyan-400/10 pl-4"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 group">
                      <Label
                        htmlFor="email"
                        className="text-gray-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-focus-within:scale-150 transition-transform"></span>
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                          className="bg-white/5 border-white/10 focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-cyan-400/10 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="phone"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-focus-within:scale-150 transition-transform"></span>
                      Phone Number{" "}
                      <span className="text-xs text-gray-500">(Optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07XXX XXXXXX"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-white/5 border-white/10 focus:border-blue-400/50 focus:bg-white/10 placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-blue-400/10 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="subject"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-focus-within:scale-150 transition-transform"></span>
                      Subject
                    </Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <Input
                        id="subject"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                        className="bg-white/5 border-white/10 focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-cyan-400/10 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label
                      htmlFor="message"
                      className="text-gray-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-focus-within:scale-150 transition-transform"></span>
                      Message
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your enquiry..."
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
                        rows={6}
                        className="bg-white/5 border-white/10 focus:border-cyan-400/50 focus:bg-white/10 resize-none placeholder:text-gray-500 transition-all duration-300 focus:shadow-lg focus:shadow-cyan-400/10"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-2xl shadow-cyan-400/30 hover:shadow-cyan-400/50 transition-all duration-300 group relative overflow-hidden h-12"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                      <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                      <span className="text-base">Send Message</span>
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-3">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </form>
              </Card>
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-6">Why Choose VortexPCs?</h2>
                <div className="space-y-6">
                  <Card className="glass p-6">
                    <h3 className="text-sm mb-3">Expert Consultation</h3>
                    <p className="text-gray-400">
                      Our team of PC building experts will help you find the
                      perfect configuration for your needs and budget.
                    </p>
                  </Card>

                  <Card className="glass p-6">
                    <h3 className="text-sm mb-3">Premium Components</h3>
                    <p className="text-gray-400">
                      We only use high-quality, reliable components from trusted
                      manufacturers to ensure peak performance.
                    </p>
                  </Card>
                </div>
              </div>

              <Card className="glass-strong rgb-glow p-8">
                <h3 className="mb-4">Quick Response Times</h3>
                <p className="text-gray-400 mb-6">
                  We pride ourselves on our rapid response times. Most enquiries
                  are answered within 24 hours during business days.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Email Enquiries</span>
                    <span className="text-gray-100">Within 24 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Phone Support</span>
                    <span className="text-gray-100">Immediate</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Technical Support</span>
                    <span className="text-gray-100">Same day</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder / Location Section */}
    </div>
  );
}
