import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import MotionEffects from "@/components/MotionEffects";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { FloatingLineButton } from "@/components/LineCta";

export const metadata: Metadata = {
  title: {
    default: "Bhutan Center | ผู้เชี่ยวชาญท่องเที่ยวภูฏาน",
    template: "%s | Bhutan Center",
  },
  description: "เที่ยวภูฏานแบบส่วนตัว ดูแลครบทั้งแพ็กเกจ Bhutan Airlines วีซ่า ที่พัก ไกด์ รถ และการวางแผนทริปโดยผู้เชี่ยวชาญภูฏาน",
  metadataBase: new URL("https://www.bhutancenter.org"),
  applicationName: "Bhutan Center",
  category: "travel",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <StructuredData />
        <MotionEffects />
        <AnalyticsTracker />
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingLineButton />
      </body>
    </html>
  );
}
