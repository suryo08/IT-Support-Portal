'use client';

import React, { useState } from 'react';

const contacts = [
  { name: 'Aditya Jarangmula N', phone: '62816209911' },
  { name: 'Firmanto S', phone: '628111668978' },
  { name: 'Gilang Suryo W', phone: '6285651152360' },
];

const HelpdeskIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SupportButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72">
          <p className="text-sm font-semibold text-brand-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Hubungi IT Support
          </p>
          <div className="flex flex-col gap-2">
            {contacts.map((c) => (
              <a
                key={c.phone}
                href={`https://wa.me/${c.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-50 transition-colors duration-200 group"
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <HelpdeskIcon className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                    {c.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {c.phone.replace(/^62/, '+62 ').replace(/(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3')}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg hover:bg-brand-600 hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="Hubungi IT Support"
      >
        <HelpdeskIcon className="w-7 h-7" />
      </button>
    </div>
  );
};

export default SupportButton;
