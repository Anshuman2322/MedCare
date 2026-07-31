import React from 'react';

const sections = [
  {
    title: 'Information We Collect',
    body: `When you submit an inquiry, contact us, or browse our site, we may collect information such as your name, email address, phone number, city, and the details of your request. We also collect standard technical information (like browser type and IP address) automatically as part of operating the website.`,
  },
  {
    title: 'How We Use Your Information',
    body: `We use the information you provide to respond to your inquiries and messages, process and fulfill requests, improve our product catalog and site experience, and send you relevant updates about your request when necessary. We do not sell your personal information to third parties.`,
  },
  {
    title: 'Information Sharing',
    body: `We share information only with service providers who help us operate the site (such as email delivery, hosting, and image storage providers), and only to the extent necessary for them to perform those services. We may also disclose information if required by law.`,
  },
  {
    title: 'Data Security',
    body: `We use reasonable technical and organizational measures to protect your information, including encrypted connections and access controls on our systems. No method of transmission or storage is 100% secure, but we work to protect your data appropriately.`,
  },
  {
    title: 'Your Choices',
    body: `You may contact us at any time to ask what information we hold about you, request corrections, or request deletion of your information, subject to any legal or operational requirements to retain certain records.`,
  },
  {
    title: 'Changes to This Policy',
    body: `We may update this policy from time to time. Changes will be posted on this page with an updated revision date.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen">
      <div className="w-full bg-sky-50/60 pb-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Last updated: July 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <p className="text-gray-600 text-base leading-relaxed">
          CureNeed ("we", "us", "our") respects your privacy. This policy explains what information we collect,
          how we use it, and the choices you have regarding your information.
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
            Questions about this policy can be sent to{' '}
            <a href="mailto:support@cureneed.com" className="text-emerald-600 hover:text-emerald-700">
              support@cureneed.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
