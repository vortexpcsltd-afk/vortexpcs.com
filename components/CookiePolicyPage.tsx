import React from "react";

export function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
          Cookie Policy
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files that are placed on your computer or
              mobile device when you visit a website. They are widely used to
              make websites work more efficiently and provide information to
              website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              2. Types of Cookies We Use
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Essential Cookies
                </h3>
                <p>
                  These cookies are necessary for the website to function
                  properly. They enable basic functions like page navigation,
                  access to secure areas, and shopping cart functionality.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Performance Cookies
                </h3>
                <p>
                  These cookies collect information about how visitors use our
                  website, such as which pages are visited most often. This data
                  helps us improve how our website works.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Functional Cookies
                </h3>
                <p>
                  These cookies allow the website to remember choices you make
                  and provide enhanced, more personal features such as
                  remembering your preferences.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-sky-400 mb-2">
                  Marketing Cookies
                </h3>
                <p>
                  These cookies are used to deliver advertisements more relevant
                  to you and your interests. They also help limit the number of
                  times you see an advertisement.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              3. Managing Cookies
            </h2>
            <p>
              You can control and manage cookies in various ways. Please note
              that removing or blocking cookies can impact your user experience
              and parts of our website may no longer be fully accessible.
            </p>

            <div className="mt-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
              <h4 className="font-bold text-sky-400 mb-2">Browser Settings</h4>
              <p className="text-sm">
                Most browsers allow you to refuse cookies or alert you when
                cookies are being sent. Check your browser's help section for
                instructions on how to manage cookies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              4. Third-Party Cookies
            </h2>
            <p>
              Some cookies on our website are set by third-party services. We
              use these services for analytics, advertising, and social media
              features. These third parties may use cookies to collect
              information about your online activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              5. Updates to This Policy
            </h2>
            <p>
              We may update this cookie policy from time to time to reflect
              changes in technology, legislation, or our business practices.
              Please check this page regularly for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-white">
              6. Contact Us
            </h2>
            <p>
              If you have any questions about our use of cookies, please contact
              us at privacy@vortexpcs.com or call +44 123 456 789.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
