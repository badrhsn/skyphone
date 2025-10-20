export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Terms and Conditions</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h2>
              <p>
                By accessing and using Skyphone services, you accept and agree to be bound by the 
                terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Service Description</h2>
              <p>
                Skyphone provides international calling services through web-based technology. 
                Our service allows you to make calls to international destinations using credits 
                purchased through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account information 
                and for all activities that occur under your account. You agree to use our service 
                in compliance with all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Payment and Credits</h2>
              <p>
                All purchases are final. Credits are deducted based on the duration and destination 
                of your calls. Unused credits expire 12 months after purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitation of Liability</h2>
              <p>
                Skyphone shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <p>
                For questions about these Terms and Conditions, please contact us at{" "}
                <a href="mailto:legal@skyphone.com" className="text-blue-600 hover:text-blue-800">
                  legal@skyphone.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: October 19, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}