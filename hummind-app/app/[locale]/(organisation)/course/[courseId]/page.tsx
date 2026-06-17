"use client";

import { useAppSelector } from "../../../../../src/store/hooks";
import React from "react";

function page() {
  const data = useAppSelector((state) => state.course);
  console.log("Selector:", data);
  return <div>Bientot</div>;
}

export default page;
