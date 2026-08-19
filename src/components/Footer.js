'use client';

import React from 'react';
import { Globe } from 'lucide-react';

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socialLinks = [
  {
    icon: InstagramIcon,
    href: 'https://instagram.com/chitraparatama_id',
    label: 'Instagram',
  },
  {
    icon: Globe,
    href: 'https://www.chitraparatama.co.id',
    label: 'Website',
  },
  {
    icon: LinkedinIcon,
    href: 'https://linkedin.com/company/Chitra-Paratama',
    label: 'LinkedIn',
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center gap-5">
        <div className="flex items-center gap-6">
          <img
            src="/logo.png"
            alt="Fix IT"
            className="h-10 w-auto object-contain"
          />
          <div className="h-8 w-px bg-slate-200"></div>
          <img
            src="/ChitraParatama_Logo_OnWhite_Color_Primary.png"
            alt="PT. Chitra Paratama"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="text-brand-400 hover:text-brand-500 transition-colors duration-200"
            >
              <link.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
        <p className="text-sm text-brand-700" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          &copy; 2026 PT. Chitra Paratama
        </p>
      </div>
    </footer>
  );
};

export default Footer;
