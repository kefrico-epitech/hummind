import { Metadata } from "next";
import { ReactNode } from "react";
import LearnerLayout from "../../../src/components/layout/learner/LearnerLayout";

export const metadata: Metadata = {
  title: "Espace Apprenant",
  description: "Hummind : votre espace d'apprentissage.",
};

export default function LearnerRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <LearnerLayout>{children}</LearnerLayout>;
}
