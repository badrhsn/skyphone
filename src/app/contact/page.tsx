"use client";

import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Card, Button } from "../../components/PageLayout";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Local header to match Add Credits layout (no back button) */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-[#f3fbff] border border-[#e6fbff] flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-[#00aff0]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
            <p className="text-sm text-gray-600">We're here to help! Get in touch with our support team</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* Contact Form centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Card>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Send us a Message</h2>
                
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#f3fbff] border border-[#e6fbff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-[#00aff0]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="secondary"
                        onClick={() => setIsSubmitted(false)}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#00aff0] focus:ring-2 focus:ring-[#e6fbff]"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#00aff0] focus:ring-2 focus:ring-[#e6fbff]"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#00aff0] focus:ring-2 focus:ring-[#e6fbff]"
                      >
                        <option value="">Select a subject</option>
                        <option value="technical-support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="account">Account Issue</option>
                        <option value="feature-request">Feature Request</option>
                        <option value="partnership">Partnership Inquiry</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#00aff0] focus:ring-2 focus:ring-[#e6fbff]"
                        placeholder="Please describe your question or issue in detail..."
                      />
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full max-w-xs bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-6 py-3 rounded-xl font-medium hover:from-[#0099d6] hover:to-[#0086c2] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Need Quick Help? placed at the bottom */}
        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Quick Help?</h3>
              <div className="space-y-3">
                <Link href="/faq" className="block text-[#00aff0] hover:text-blue-800 font-medium transition-colors">
                  📋 Check our FAQ
                </Link>
                <Link href="/rates" className="block text-[#00aff0] hover:text-blue-800 font-medium transition-colors">
                  💰 View calling rates
                </Link>
                <Link href="/dashboard" className="block text-[#00aff0] hover:text-blue-800 font-medium transition-colors">
                  🏠 Go to your dashboard
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}