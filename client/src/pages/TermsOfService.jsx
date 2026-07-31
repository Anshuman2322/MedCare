import React from 'react';

const sections = [
  {
    title: 'Acceptance of Terms',
    body: `By accessing or using the CureNeed website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our site.`,
  },
  {
    title: 'Use of the Site',
    body: `You agree to use this site only for lawful purposes and in a way that does not infringe the rights of, or restrict or inhibit the use and enjoyment of, this site by anyone else. Product listings, pricing, and availability are provided for informational purposes and may change without notice.`,
  },
  {
    title: 'Inquiries and Product Availability',
    body: `Submitting an inquiry through our site does not constitute a purchase or guarantee of availability. All inquiries are reviewed by our team, who will follow up with next steps, including confirming pricing, availability, and any requirements (such as a valid prescription where applicable).`,
  },
  {
    title: 'No Medical Advice',
    body: `Content on this site is provided for general informational purposes only and does not constitute medical advice. Always consult a licensed healthcare professional before starting, stopping, or changing any medication.`,
  },
  {
    title: 'Intellectual Property',
    body: `All content on this site, including text, graphics, logos, and images, is the property of CureNeed or its licensors and is protected by applicable intellectual property laws.`,
  },
  {
    title: 'Limitation of Liability',
    body: `CureNeed is not liable for any indirect, incidental, or consequential damages arising from your use of this site, to the fullest extent permitted by law.`,
  },
  {
    title: 'Changes to These Terms',
    body: `We may revise these terms at any time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.`,
  },
];

export default function TermsOfService() {
  return (
    <div className="bg-white min-h-screen">
      <div className="w-full bg-sky-50/60 pb-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Last updated: July 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <p className="text-gray-600 text-base leading-relaxed">
          These Terms of Service govern your use of the CureNeed website. Please read them carefully before using our site.
        </p>
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-gray-600 text-base leading-relaxed">{section.body}</p>
          </div>
        ))}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Contact Us</h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Questions about these terms can be sent to{' '}
            <a href="mailto:support@cureneed.com" className="text-emerald-600 hover:text-emerald-700">
              support@cureneed.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
