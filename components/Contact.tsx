"use client";

import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import type { HomeMessages } from "@/lib/i18n";

type ContactProps = {
  copy: HomeMessages["contact"];
};

export const Contact: React.FC<ContactProps> = ({ copy }) => {
  const [state, handleSubmit] = useForm("xykdkpen");

  if (state.succeeded) {
    return (
      <section id="contact" className="bg-slate-950 py-32 px-6 md:px-14">
        <div className="container mx-auto">
          <div className="reveal opacity-0 translate-y-10 transition-all duration-700 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                className="w-10 h-10 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="font-bebas text-4xl md:text-5xl text-white mb-4">
              {copy.successTitle}
            </h3>
            <p className="text-slate-400 text-lg">{copy.successMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="bg-slate-950 py-32 px-6 md:px-14">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Column - Image and Info */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-700">
            <h2 className="font-bebas text-5xl md:text-6xl mb-6">
              <span className="text-white">{copy.titleLead}</span>{" "}
              <span className="text-gold">{copy.titleHighlight}</span>
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              {copy.intro}
            </p>

            <div className="relative overflow-hidden mb-10">
              <img
                src="/images/oleh-attack.jpg"
                alt={copy.imageAlt}
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Available For */}
            <div>
              <h4 className="font-barlow font-bold text-white uppercase tracking-widest mb-4">
                {copy.availableForTitle}
              </h4>
              <ul className="grid grid-cols-2 gap-3">
                {copy.availableFor.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-slate-400"
                  >
                    <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-700 delay-200">
            <div className="bg-white/5 border border-white/10 p-8 md:p-10">
              <h3 className="font-bebas text-3xl text-white mb-2">
                {copy.formTitle}
              </h3>
              <p className="text-slate-400 mb-8">{copy.formSubtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-barlow text-sm uppercase tracking-wider text-slate-300 mb-2"
                    >
                      {copy.nameLabel} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-gold transition-colors rounded-none"
                      placeholder={copy.namePlaceholder}
                    />
                    <ValidationError
                      prefix={copy.nameLabel}
                      field="name"
                      errors={state.errors}
                      className="text-red-400 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-barlow text-sm uppercase tracking-wider text-slate-300 mb-2"
                    >
                      {copy.emailLabel} *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-gold transition-colors rounded-none"
                      placeholder={copy.emailPlaceholder}
                    />
                    <ValidationError
                      prefix={copy.emailLabel}
                      field="email"
                      errors={state.errors}
                      className="text-red-400 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="block font-barlow text-sm uppercase tracking-wider text-slate-300 mb-2"
                  >
                    {copy.companyLabel}
                  </label>
                  <input
                    id="company"
                    type="text"
                    name="company"
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-gold transition-colors rounded-none"
                    placeholder={copy.companyPlaceholder}
                  />
                </div>

                {/* Cooperation Type */}
                <div>
                  <label
                    htmlFor="cooperation-type"
                    className="block font-barlow text-sm uppercase tracking-wider text-slate-300 mb-2"
                  >
                    {copy.typeLabel} *
                  </label>
                  <select
                    id="cooperation-type"
                    name="cooperation-type"
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors rounded-none appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "20px",
                    }}
                  >
                    <option value="" disabled className="bg-slate-900">
                      {copy.typePlaceholder}
                    </option>
                    {copy.cooperationTypes.map((type, index) => (
                      <option key={index} value={type} className="bg-slate-900">
                        {type}
                      </option>
                    ))}
                  </select>
                  <ValidationError
                    prefix={copy.typeLabel}
                    field="cooperation-type"
                    errors={state.errors}
                    className="text-red-400 text-sm mt-1"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block font-barlow text-sm uppercase tracking-wider text-slate-300 mb-2"
                  >
                    {copy.messageLabel} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-gold transition-colors rounded-none resize-none"
                    placeholder={copy.messagePlaceholder}
                  />
                  <ValidationError
                    prefix={copy.messageLabel}
                    field="message"
                    errors={state.errors}
                    className="text-red-400 text-sm mt-1"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={state.submitting}
                  className="w-full bg-gold text-slate-950 font-barlow font-bold uppercase tracking-wider py-4 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.submitting ? copy.sendingButton : copy.submitButton}
                </button>

                {state.errors && (
                  <p className="text-red-400 text-sm text-center">
                    {copy.errorMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
