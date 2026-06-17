import OrgLayout from "../../../src/components/layout/org/OrgLayout";
import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Espace Organisateurs",
  description: "Hummind : créez, apprenez et gérez avec une IA intégrée.",
};

const UserLayout = ({ children }: { children: ReactNode }) => {
  return <OrgLayout>{children}</OrgLayout>;
};

export default UserLayout;
