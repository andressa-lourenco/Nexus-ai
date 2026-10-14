import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryView } from "@/components/documents/library-view";

export const metadata: Metadata = { title: "Library" };

export default function DocumentsPage() {
  return (
    <Suspense>
      <LibraryView />
    </Suspense>
  );
}
