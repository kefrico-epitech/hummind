# Typography Component Guide

## Available Components

Located in `src/components/Typography.tsx`

### 1. HeroTitle
**Size:** 48-52px | **Weight:** Black | **Use:** Main page titles (3 lines max)

```tsx
import { HeroTitle } from '@/components/Typography';

<HeroTitle>
  Your main title here<br/>
  With gradient if needed
</HeroTitle>
```

### 2. SectionTitle  
**Size:** 48-52px | **Weight:** Bold | **Use:** Section headings (2 lines)

```tsx
<SectionTitle>
  Section Title<br/>
  on two lines
</SectionTitle>
```

### 3. FAQTitle
**Size:** 40-80px responsive | **Weight:** Semibold | **Use:** FAQ section heading

```tsx
<FAQTitle>FAQ</FAQTitle>
```

### 4. FAQSubtitle
**Size:** 14-18px | **Weight:** Normal | **Color:** white/65 | **Use:** FAQ subtitle

```tsx
<FAQSubtitle>Your subtitle here</FAQSubtitle>
```

### 5. CTATitle
**Size:** 46-72px responsive | **Weight:** Semibold | **Use:** Call-to-action titles

```tsx
<CTATitle>
  Parlez de votre projet
</CTATitle>
```

### 6. Subtitle
**Size:** 12-14px | **Weight:** Medium | **Color:** #807779 | **Use:** Secondary text

```tsx
<Subtitle className="mx-auto max-w-[480px]">
  Secondary text with optional className
</Subtitle>
```

### 7. BodyText
**Size:** 13-15px | **Weight:** Normal | **Use:** Body paragraphs

```tsx
<BodyText className="custom-color-if-needed">
  Body paragraph text
</BodyText>
```

### 8. Label
**Size:** 11-13px | **Weight:** Semibold | **Use:** Tags, labels, badges

```tsx
<Label>Tag</Label>
```

### 9. FeatureTitle
**Size:** 18-22px | **Weight:** Semibold | **Use:** Feature card titles

```tsx
<FeatureTitle>Feature Name</FeatureTitle>
```

### 10. FeatureDescription
**Size:** 13-15px | **Weight:** Normal | **Use:** Feature card descriptions

```tsx
<FeatureDescription>
  Description text for features
</FeatureDescription>
```

## Migration Guide

### Before (Inline styles)
```tsx
<h1 className="text-[48px] sm:text-[52px] font-black leading-tight tracking-normal text-[#171728]">
  Hero Title
</h1>
```

### After (Component)
```tsx
import { HeroTitle } from '@/components/Typography';

<HeroTitle>Hero Title</HeroTitle>
```

## Benefits

✅ **DRY Principle** - Single source of truth for typography  
✅ **Consistency** - Same styles across entire app  
✅ **Maintainability** - Update all titles in one place  
✅ **Cleaner Code** - Less class pollution  
✅ **Accessibility** - Built-in focus states and semantic HTML  

## Pages Updated

- [x] Homepage (page.tsx) - HeroTitle, SectionTitle, FAQTitle, Subtitle, CTATitle
- [x] /produit - FeatureTitle
- [x] /demo - SectionTitle
- [x] /faq - FAQTitle (via PageLayout)
- [x] /contact - FeatureTitle
- [x] /login - SectionTitle (via PageLayout)
- [x] /conditions - SectionTitle
- [x] /confidentialite - SectionTitle
- [x] /espace/cours/nouveau - SectionTitle

## Next Steps

1. Update remaining pages progressively
2. Add more components as needed (Button, Card, Badge, etc.)
3. Consider creating Color/Spacing utilities
