# Design System Hummind - Guide d'Adaptation

## Architecture Créée

### Composants Réutilisables (`src/components/`)
- **Header.tsx** - Navigation cohérente avec hamburger mobile dropdown
- **PageLayout.tsx** - Wrapper pour hero sections uniformes
- **Footer.tsx** - Footer cohérent à travers l'app

## Design System

### Couleurs
- **Primary**: #6b4ee6 (Brand color)
- **Dark**: #171729, #141426 (Text/BG)
- **Light**: #f5f1ef (Background)
- **White**: #f5f1ef with /90 opacity
- **Accent**: #5656a2 → #e84747 (Gradient)
- **Mint**: #1fa876 (Secondary)

### Typographie
- **Display**: Poppins (headings)
- **Body**: Inter (text)
- **Font weights**: 400, 500, 600, 700, 800

### Spacing (Tailwind)
- Mobile-first: px-4 → sm:px-6 → lg:px-10
- Padding vertical: py-2 → sm:py-3 → lg:py-4
- Gap/margins: proportional across breakpoints

### Breakpoints
- Default (0px) - Mobile
- xs (320px+) - Small phones
- sm (640px) - Tablets
- md (768px) - Medium tablets
- lg (1024px) - Desktops

### Responsive Text
- Headings: text-[36px] → xs:[42px] → sm:[56px] → md:[68px] → lg:[80px]
- Body: text-[12px] → xs:[13px] → sm:[14px]

### Components Styling
- **Buttons**: rounded-full, min-h-[44px] (accessibility), focus:ring-2 focus:ring-[#6d72d8]
- **Links**: hover:opacity-80 or hover:bg-white/40
- **Inputs**: rounded-lg, focus:ring-2 focus:ring-[#6d72d8]
- **Cards**: rounded-xl, shadow-[0_16px_40px_rgba(28,22,54,0.12)], backdrop-blur

### Animations
- Mobile dropdown: animate-in fade-in slide-in-from-top-2 duration-200
- Button hover: hover:scale-95, hover:shadow-lg
- Transitions: transition (default), transition-colors, transition-shadow

## Pages à Adapter

### Priority 1 (Public)
- [ ] `/` (page.tsx) - ✅ DONE
- [ ] `/produit` (produit/page.tsx)
- [ ] `/login` (login/page.tsx)
- [ ] `/demo` (demo/page.tsx)

### Priority 2 (Informational)
- [ ] `/faq` (faq/page.tsx)
- [ ] `/contact` (contact/page.tsx)
- [ ] `/conditions` (conditions/page.tsx)
- [ ] `/confidentialite` (confidentialite/page.tsx)

### Priority 3 (App)
- [ ] `/espace/cours/nouveau` (espace/cours/nouveau/page.tsx)

## Modèle d'Adaptation

### Avant (OLD)
```tsx
export default function ProductPage() {
  return (
    <main>
      {/* Custom header */}
      {/* Custom content */}
    </main>
  )
}
```

### Après (NEW)
```tsx
'use client';

import { Header } from '@/components/Header';
import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#d8d9fb_0%,#f7ece7_54%,#f5f1ef_100%)] px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8 lg:px-10 lg:pb-32 lg:pt-12">
        <div className="relative mx-auto max-w-[1120px]">
          <Header />
          
          <PageLayout 
            title="Notre Produit"
            subtitle="Découvrez comment Hummind transforme l'apprentissage"
            gradient="default"
          >
            {/* Page content */}
          </PageLayout>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
```

## Checklist d'Adaptation

Pour chaque page:
1. [ ] Importer Header, PageLayout, Footer
2. [ ] Wrapper avec `<main className="min-h-screen bg-[#f5f1ef] text-[#141426]">`
3. [ ] Ajouter hero section avec gradient
4. [ ] Utiliser PageLayout pour title/subtitle
5. [ ] Ajouter Footer
6. [ ] Vérifier responsive (xs, sm, md, lg)
7. [ ] Tester mobile hamburger menu
8. [ ] Vérifier accessibilité (44px min, focus rings)
9. [ ] Adapter couleurs au design system
10. [ ] Tester sur mobile, tablet, desktop

## Fichiers Créés

```
src/components/
├── Header.tsx (172 lines)
├── PageLayout.tsx (46 lines)
└── Footer.tsx (62 lines)
```

## Next Steps

1. Adapter `/produit` comme template
2. Adapter pages informational (`/faq`, `/contact`, etc)
3. Adapter pages app (`/espace`)
4. Auditer accessibilité globale
5. Tester performance
