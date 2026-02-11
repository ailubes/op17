"use client";

import React, { useState } from "react";

interface NewsletterFormProps {
  placeholder: string;
  button: string;
  success: string;
}

export default function NewsletterForm({
  placeholder,
  button,
  success,
}: NewsletterFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-gold/10 border border-gold/30 px-6 py-4 text-gold font-barlow font-bold uppercase tracking-wider">
        {success}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <input
        type="email"
        placeholder={placeholder}
        required
        className="flex-1 bg-white/5 border border-white/10 px-6 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-gold transition-colors font-inter"
      />
      <button
        type="submit"
        className="bg-gold text-slate-950 px-8 py-4 font-bebas text-xl uppercase tracking-wider hover:bg-white transition-colors"
      >
        {button}
      </button>
    </form>
  );
}
