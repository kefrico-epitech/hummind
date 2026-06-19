'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { http, ApiError } from '@/shared/api/http';
import { cn } from '@/shared/lib/cn';

const courseSchema = z.object({
  entityId: z.string().min(1, 'L’ID de l’organisation est requis.'),
  title: z.string().min(2, 'Le titre est trop court.'),
  slug: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  domain: z.string().optional().or(z.literal('')),
  level: z.string().optional().or(z.literal('')),
  objectivesText: z.string().optional().or(z.literal('')),
  coverImage: z.string().url('URL invalide').optional().or(z.literal('')),
  picture: z.string().url('URL invalide').optional().or(z.literal('')),
});

type CourseCreateFormValues = z.infer<typeof courseSchema>;

type CreatedCourse = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  entityId: string;
  domain: string | null;
  level: string | null;
  description: string | null;
  objectives: string[];
  createdAt: string;
  updatedAt: string;
};

type DemoOrg = {
  id: string;
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  description: string | null;
  membersCount: number;
  coursesCount: number;
  subscription: {
    tier: string;
    status: string;
    tokensLimit: number;
    tokensUsed: number;
  } | null;
};

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function CourseCreateForm() {
  const [result, setResult] = useState<CreatedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orgs, setOrgs] = useState<DemoOrg[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const form = useForm<CourseCreateFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      entityId: '',
      title: 'Premiers pas avec Hummind',
      slug: 'premiers-pas-hummind',
      description: 'Cours de test pour vérifier le flux de création côté frontend.',
      domain: 'IA',
      level: 'Débutant',
      objectivesText: 'Comprendre la plateforme\nTester la création de cours\nValider la publication',
      coverImage: '',
      picture: '',
    },
  });

  const values = form.watch();

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const items = await http<DemoOrg[]>('/org/mine');
        if (!alive) return;
        setOrgs(items);
        if (!form.getValues('entityId') && items[0]?.id) {
          form.setValue('entityId', items[0].id, { shouldValidate: true });
        }
      } catch {
        if (!alive) return;
        setOrgs([]);
      } finally {
        if (!alive) return;
        setLoadingOrgs(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [form]);

  async function onSubmit(data: CourseCreateFormValues) {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        entityId: data.entityId,
        title: data.title,
        slug: data.slug || undefined,
        description: data.description || undefined,
        domain: data.domain || undefined,
        level: data.level || undefined,
        objectives: (data.objectivesText ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        coverImage: data.coverImage || undefined,
        picture: data.picture || undefined,
      };

      const created = await http<CreatedCourse>('/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(created);
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(`${cause.code}: ${cause.message}`);
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError('Une erreur inattendue est survenue.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-[32px] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,17,20,0.08)]"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
            Test frontend
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#111116]">
            Créer un cours depuis l&apos;interface
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Cette page envoie une vraie requête au backend. Elle est pensée pour valider le flux de
            création, sans attendre l&apos;éditeur complet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Organisation"
            hint={loadingOrgs ? 'Chargement...' : `${orgs.length} organisation(s) disponible(s)`}
            error={form.formState.errors.entityId?.message}
          >
            <select
              {...form.register('entityId')}
              className={inputClass}
              disabled={loadingOrgs}
            >
              <option value="">Choisir une organisation</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.city ? `• ${org.city}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Slug" hint="Optionnel" error={form.formState.errors.slug?.message}>
            <input
              {...form.register('slug')}
              placeholder="premiers-pas-hummind"
              className={inputClass}
            />
          </Field>
          <Field label="Titre" error={form.formState.errors.title?.message}>
            <input
              {...form.register('title')}
              placeholder="Premiers pas avec Hummind"
              className={inputClass}
            />
          </Field>
          <Field label="Domaine" hint="Optionnel">
            <input {...form.register('domain')} placeholder="IA, Maths..." className={inputClass} />
          </Field>
          <Field label="Niveau" hint="Optionnel">
            <input {...form.register('level')} placeholder="Débutant" className={inputClass} />
          </Field>
          <Field label="Couverture" hint="Optionnel" error={form.formState.errors.coverImage?.message}>
            <input
              {...form.register('coverImage')}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>
          <Field label="Image" hint="Optionnel" error={form.formState.errors.picture?.message}>
            <input {...form.register('picture')} placeholder="https://..." className={inputClass} />
          </Field>
          <Field label="Objectifs" hint="1 ligne = 1 objectif">
            <textarea
              {...form.register('objectivesText')}
              rows={5}
              className={cn(inputClass, 'md:col-span-2')}
              placeholder={'Comprendre la plateforme\nTester la création de cours\nValider la publication'}
            />
          </Field>
        </div>

        <Field label="Description" hint="Optionnel">
          <textarea
            {...form.register('description')}
            rows={5}
            className={inputClass}
            placeholder="Décris le but de ce cours en quelques lignes."
          />
        </Field>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Création en cours...' : 'Créer le cours'}
          </button>
          <button
            type="button"
            onClick={() =>
              form.reset({
                entityId: '',
                title: 'Premiers pas avec Hummind',
                slug: 'premiers-pas-hummind',
                description: 'Cours de test pour vérifier le flux de création côté frontend.',
                domain: 'IA',
                level: 'Débutant',
                objectivesText: 'Comprendre la plateforme\nTester la création de cours\nValider la publication',
                coverImage: '',
                picture: '',
              })
            }
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:bg-black/[0.03]"
          >
            Réinitialiser
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 rounded-3xl border border-mint-200 bg-mint-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-500">
                  Créé avec succès
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[#111116]">
                  {result.title}
                </h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-mint-500">
                {result.status}
              </span>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#101114] p-4 text-xs leading-6 text-white/85">
              {prettyJson(result)}
            </pre>
          </div>
        ) : null}
      </form>

      <aside className="space-y-6">
        <div className="rounded-[32px] border border-black/8 bg-[#111116] p-6 text-white shadow-[0_24px_80px_rgba(17,17,20,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">
            Prévisualisation
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Flux de test frontend</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Tu peux créer un cours depuis cette page et vérifier immédiatement ce que le backend
            renvoie. C&apos;est le bon point d&apos;entrée avant de brancher l&apos;éditeur complet.
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <PreviewRow label="Titre" value={values.title || '—'} />
            <PreviewRow label="Slug" value={values.slug || 'automatique'} />
            <PreviewRow label="Domaine" value={values.domain || '—'} />
            <PreviewRow label="Niveau" value={values.level || '—'} />
            <PreviewRow
              label="Objectifs"
              value={(values.objectivesText || '')
                .split('\n')
                .filter(Boolean)
                .slice(0, 3)
                .join(' • ') || '—'}
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Données de démo
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-black/60">
            <p>Le seed crée plusieurs organisations de test, prêtes à être choisies dans la liste.</p>
            <p>Tu peux créer un cours immédiatement dans l’une des organisations seedées.</p>
            <p>Si tu veux tester un autre contexte, change simplement l’organisation dans le sélecteur.</p>
          </div>
          <div className="mt-5 space-y-3">
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => form.setValue('entityId', org.id, { shouldValidate: true })}
                className={cn(
                  'block w-full rounded-2xl border px-4 py-3 text-left text-sm transition',
                  form.watch('entityId') === org.id
                    ? 'border-brand-300 bg-brand-50 text-brand-800'
                    : 'border-black/8 bg-white hover:border-brand-200 hover:bg-brand-50/40',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <strong className="font-semibold">{org.name}</strong>
                  <span className="text-xs uppercase tracking-[0.16em] text-black/35">
                    {org.coursesCount} cours
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/45">
                  {org.city ?? '—'} {org.country ? `• ${org.country}` : ''} • {org.id.slice(0, 8)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-black/80">{label}</span>
        {hint ? <span className="text-xs text-black/40">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</span>
      <span className="max-w-[70%] text-right text-sm text-white/88">{value}</span>
    </div>
  );
}

const inputClass =
  'mt-0 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111116] outline-none transition placeholder:text-black/30 focus:border-brand-400 focus:ring-4 focus:ring-brand-100';
