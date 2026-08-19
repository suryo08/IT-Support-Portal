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
    label: '@chitraparatama_id',
  },
  {
    icon: Globe,
    href: 'https://www.chitraparatama.co.id',
    label: 'www.chitraparatama.co.id',
  },
  {
    icon: LinkedinIcon,
    href: 'https://linkedin.com/company/Chitra-Paratama',
    label: 'Chitra Paratama',
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-brand-800 bg-brand-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Fix IT"
              className="h-14 w-auto object-contain brightness-0 invert"
            />
            <img
              src="/ChitraParatama_Logo_OnWhite_Color_Primary.png"
              alt="PT. Chitra Paratama"
              className="h-11 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div>
            <p className="text-base font-semibold text-white" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              PT. Chitra Paratama
            </p>
            <p className="text-sm text-brand-300 leading-relaxed mt-1.5" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Graha Indah Jl. Amd No.69, Karang Joang,<br />
              Kec. Balikpapan Utara, Kota Balikpapan,<br />
              Kalimantan Timur 76127
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex items-center gap-3 text-brand-200 hover:text-white transition-colors duration-200 group"
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-brand-400 group-hover:text-brand-200 transition-colors duration-200">
                <link.icon className="w-5 h-5" />
              </span>
              <span className="text-sm w-48 text-left md:text-right" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {link.label}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-brand-800">
        <p className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-white" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
          &copy; 2026 PT. Chitra Paratama
        </p>
      </div>
    </footer>
  );
};

export default Footer;
