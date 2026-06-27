import { Footer, Header } from "@/components/easybaby/ui";
import "@/components/easybaby/easybaby.css";

// Wspólna „rama” easybaby (pasek górny + stopka) dla strony mapy i list województw.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eb-app">
      <Header />
      <main className="eb-wrap">{children}</main>
      <Footer />
    </div>
  );
}
