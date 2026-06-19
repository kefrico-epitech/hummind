import Link from 'next/link';
import type { Route } from 'next';

export function Footer() {
  return (
    <footer className="bg-[#f5f1ef] border-t border-white/20 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#151526] mb-4">Hummind OS</h3>
            <p className="text-[12px] text-[#807779]">Transformer l'apprentissage avec l'IA</p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#151526] mb-3">Produit</h4>
            <nav className="space-y-2">
              <Link href={'/produit' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                Notre produit
              </Link>
              <Link href={'/demo' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                Réserver une démo
              </Link>
              <Link href={'/faq' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                FAQ
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-[13px] font-semibold text-[#151526] mb-3">Légal</h4>
            <nav className="space-y-2">
              <Link href={'/conditions' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                Conditions
              </Link>
              <Link href={'/confidentialite' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                Confidentialité
              </Link>
              <Link href={'/contact' as Route} className="block text-[12px] text-[#807779] hover:text-[#151526] transition">
                Contact
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-8">
          <p className="text-[11px] text-[#807779] text-center">
            © {new Date().getFullYear()} Hummind. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
