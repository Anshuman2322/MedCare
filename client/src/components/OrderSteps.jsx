import React from 'react';

const STEPS = [
  { n: 1, title: 'Tell us what you need', text: 'Pick a medicine and quantity and send a free quote request. It takes about a minute.' },
  { n: 2, title: 'Get your quote', text: 'Our team checks availability and replies with pricing, shipping and an estimated timeline.' },
  { n: 3, title: 'Confirm, then pay', text: 'You confirm the quote. Nothing is final, and nothing is paid, until you do.' },
];

/** The three-step "how ordering works" strip, the same process the FAQ and the chat describe. */
export default function OrderSteps({ heading = 'How ordering works' }) {
  return (
    <section aria-labelledby="order-steps-heading">
      <h2 id="order-steps-heading" className="cn-reveal mb-6 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{heading}<span className="cn-title-rule" aria-hidden="true" /></h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.n} className="cn-glow-card cn-reveal rounded-xl border border-gray-200 bg-white p-5 shadow-sm" style={{ '--cn-d': `${index * 110}ms` }}>
            <span className="cn-icon-glow mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white" aria-hidden="true">{step.n}</span>
            <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
            <p className="text-sm leading-relaxed text-gray-600">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
