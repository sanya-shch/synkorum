import type { Metadata } from "next";

// Sign-in / registration / reset screens have nothing worth indexing.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
