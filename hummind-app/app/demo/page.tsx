'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d8d9fb_0%,#f7ece7_54%,#f5f1ef_100%)] px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-10 lg:pb-32 lg:pt-20">
        <div className="absolute left-[-15%] top-[20%] h-64 w-64 rounded-full bg-[#f4cabc]/70 blur-[100px] sm:h-80 sm:w-80 sm:blur-[120px]" />
        <div className="absolute right-[-12%] top-[-5%] h-72 w-72 rounded-full bg-[#cfd1ff]/80 blur-[100px] sm:h-96 sm:w-96 sm:blur-[140px]" />

        <div className="relative mx-auto max-w-[1120px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 xs:gap-10 sm:gap-12 lg:gap-16">
            <div className="flex flex-col justify-start pt-6 xs:pt-8">
              <div>
                <h1 className="text-balance font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#171728] xs:text-[42px] sm:text-[48px]">
                  Parlons de votre projet <span className="bg-[linear-gradient(90deg,#5656a2_0%,#e84747_100%)] bg-clip-text text-transparent">pedagogique</span>
                </h1>

                <p className="mt-6 xs:mt-8 text-[13px] xs:text-[14px] sm:text-[15px] leading-7 text-[#807779]">
                  Que vous soyez enseignant, directeur d'etablissement ou responsable de formation, notre equipe vous repond sous 24h
                </p>
              </div>

              <div className="mt-8 xs:mt-10 space-y-4 xs:space-y-5">
                {[
                  'Demander une demonstration de HummindOS',
                  'Trouvez le meilleur forfait pour votre equipe',
                  'Obtenez de l aide pour votre integration',
                ].map((item) => (
                  <div key={item} className="flex gap-3 xs:gap-4 items-start">
                    <CheckCircle2 className="h-5 xs:h-6 w-5 xs:w-6 text-[#6d72d8] flex-shrink-0 mt-0.5" />
                    <span className="text-[12px] xs:text-[13px] sm:text-[14px] font-medium text-[#807779]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 xs:mt-10">
                <p className="text-[11px] xs:text-[12px] text-black/50">Des problemes techniques ou des questions sur le produit ?</p>
                <Link
                  href={'/contact' as Route}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] xs:text-[13px] font-semibold text-[#6d72d8] hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#6d72d8] rounded px-1"
                >
                  Contactez l assistance <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="pt-6 xs:pt-8">
              <form onSubmit={handleSubmit} className="space-y-5 xs:space-y-6">
                <div>
                  <label className="block text-[12px] xs:text-[13px] font-semibold text-[#17172A] mb-2 xs:mb-3">
                    Nom et prenom
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-4 xs:px-5 py-3 xs:py-3.5 text-[13px] xs:text-[14px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] xs:text-[13px] font-semibold text-[#17172A] mb-2 xs:mb-3">
                    Courriel professionnel
                  </label>
                  <input
                    type="email"
                    placeholder="johndoe@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-4 xs:px-5 py-3 xs:py-3.5 text-[13px] xs:text-[14px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] xs:text-[13px] font-semibold text-[#17172A] mb-2 xs:mb-3">
                    Votre role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-4 xs:px-5 py-3 xs:py-3.5 text-[13px] xs:text-[14px] text-black/60 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] transition appearance-none cursor-pointer"
                  >
                    <option value="">Selectionner votre role</option>
                    <option value="teacher">Enseignant</option>
                    <option value="director">Directeur d etablissement</option>
                    <option value="coordinator">Coordinateur pedagogique</option>
                    <option value="admin">Administrateur IT</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] xs:text-[13px] font-semibold text-[#17172A] mb-2 xs:mb-3">
                    Votre message
                  </label>
                  <textarea
                    placeholder="Parler nous de votre contexte, vos besoins..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-black/10 bg-white px-4 xs:px-5 py-3 xs:py-3.5 text-[13px] xs:text-[14px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[linear-gradient(90deg,#5656a2_0%,#e84747_100%)] px-6 py-3 xs:py-3.5 text-[13px] xs:text-[14px] font-semibold text-white transition hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6d72d8] focus:ring-offset-2 min-h-[44px]"
                >
                  Envoyer ma demande
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
