import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Horaires et billets de taxi-brousse",
  description:
    "Consultez les horaires, comparez les prix et trouvez les places disponibles pour vos trajets en taxi-brousse à Madagascar.",
  path: "/search",
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
