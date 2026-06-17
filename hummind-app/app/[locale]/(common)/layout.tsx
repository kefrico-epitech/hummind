import OrgLayout from "../../../src/components/layout/org/OrgLayout";
import React, { ReactNode } from "react";

const OrganisationLayout = ({ children }: { children: ReactNode }) => {
  return <OrgLayout>{children}</OrgLayout>;
};

export default OrganisationLayout;
