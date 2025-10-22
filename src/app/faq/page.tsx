"use client";

import React from "react";
import { HelpCircle, Phone, CreditCard, Shield, Clock } from "lucide-react";
import PageLayout, { Card, Button } from "../../components/PageLayout";
import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      icon: <Phone className="h-6 w-6 text-blue-500" />,
      category: "Calling",
      questions: [
        {
          question: "How do I make an international call?",
          answer: "Simply sign up for a Skyphone account, add credits, select your destination country in our dialer, enter the phone number, and click call. No downloads or installations required!"
        },
        {
          question: "What's the call quality like?",
          answer: "We use advanced WebRTC technology and premium carrier networks to ensure crystal-clear call quality comparable to traditional phone services."
        },
        {
          question: "Can I call both mobile and landline numbers?",
          answer: "Yes! You can call both mobile and landline numbers worldwide. Mobile rates are typically slightly higher than landline rates."
        }
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-blue-500" />,
      category: "Billing & Credits",
      questions: [
        {
          question: "How does the credit system work?",
          answer: "You prepay for credits which are used to pay for your calls. Credits are deducted based on the per-minute rate for your destination and call duration."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees! The rates displayed are exactly what you pay per minute. No connection fees, monthly charges, or surprise costs."
        },
        {
          question: "Do my credits expire?",
          answer: "Credits remain valid for 12 months from the date of purchase. We'll send you email reminders before any credits are set to expire."
        }
      ]
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      category: "Security & Privacy",
      questions: [
        {
          question: "Is my personal information secure?",
          answer: "Yes! We use industry-standard encryption and security measures. We never share your personal information with third parties."
        },
        {
          question: "Are my calls private?",
          answer: "Absolutely. All calls are encrypted end-to-end, and we don't record or monitor your conversations."
        },
        {
          question: "How do you handle payment information?",
          answer: "We use Stripe for secure payment processing. We never store your credit card information on our servers."
        }
      ]
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      category: "Technical",
      questions: [
        {
          question: "What browsers are supported?",
          answer: "Skyphone works on all modern browsers including Chrome, Firefox, Safari, and Edge. No plugins or downloads required."
        },
        {
          question: "Do I need a microphone?",
          answer: "Yes, you'll need a microphone to make calls. Most laptops have built-in microphones, or you can use a headset for better audio quality."
        },
        {
          question: "What if I have connection issues?",
          answer: "Skyphone requires a stable internet connection. For best results, use a broadband connection. If you experience issues, try refreshing your browser or checking your internet connection."
        }
      ]
    }
  ];

  return (
    <PageLayout
      title="Frequently Asked Questions"
      description="Find answers to common questions about Skyphone"
      icon={HelpCircle}
    >

      {/* FAQ Sections */}
      <div className="space-y-8">
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  {React.cloneElement(section.icon, { className: "h-6 w-6 text-white" })}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.category}</h2>
              </div>
              
              <div className="space-y-6">
                {section.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Contact Section */}
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you get the most out of Skyphone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@skyphone.com">
              <Button>
                Email Support
              </Button>
            </a>
            <Link href="/contact">
              <Button variant="secondary">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}