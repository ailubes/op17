import React from "react";
import ClientLayout from "./ClientLayout";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
