import type { Metadata } from 'next';
import { requireRole } from '@/shared/auth/session';
import { CourseCreateForm } from '@/features/cours/components/course-create-form';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Créer un cours',
  description: 'Page de test pour valider la création de cours depuis le frontend.',
};

export default async function NewCoursePage() {
  await requireRole('ADMIN', 'ROOT');

  return (
    <main className="min-h-screen bg-[#f5f1ef] text-[#141426]">
      <div className="sticky top-0 z-50 flex justify-center px-4 py-4 sm:px-6 lg:px-10">
        <Header />
      </div>

      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(107,78,230,0.16),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(95,208,166,0.18),_transparent_32%),linear-gradient(180deg,_#f8f7ff_0%,_#ffffff_36%,_#f7f8fb_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(17,17,20,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,20,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 rounded-[20px] xs:rounded-[24px] sm:rounded-[28px] border border-black/8 bg-white/80 p-4 xs:p-5 sm:p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">Espace enseignement</p>
              <h1 className="mt-2 font-display text-xl xs:text-2xl sm:text-3xl font-semibold text-[#111116]">
                Création de cours
              </h1>
              <p className="mt-1 max-w-2xl text-xs xs:text-sm text-black/55">
                Version front pour tester le flux de création avant de brancher l'éditeur complet.
              </p>
            </div>
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3">
              <div className="rounded-full border border-brand-100 bg-brand-50 px-3 xs:px-4 py-2 text-xs xs:text-sm font-medium text-brand-700">
                POST /api/v1/courses
              </div>
              <LogoutButton />
            </div>
          </div>

          <div className="mx-auto max-w-2xl">
            <CourseCreateForm />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
