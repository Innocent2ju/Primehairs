import type { Metadata } from "next";
import { Schibsted_Grotesk,  Martian_Mono } from "next/font/google";
import "./globals.css";
import LightRays from '@/components/LightRays';
import Navbar from '@/components/Navbar';

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prime Hairs",
  description: "Human hairs, extension bundles, wigs and hair E - commerce Store",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibstedGrotesk.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
      <Navbar />
      <div className="absolute z-[-1] min-h-screen inset-0 top-0 ">

  <LightRays
    raysOrigin="top-center"
    raysColor="#ffffff"
    raysSpeed={0.05}
    lightSpread={0.5}
    rayLength={3}
    glow={0.6}
    haze={0.25}
    followMouse
    mouseInfluence={0.01}
    rayDensity={0.5}
    tilt={0}
    raySharpness={0.02}
    atmosphere={-0.2}
    intensity={0.5}
    fadeDistance={1}
    saturation={1.2}
    noiseAmount={0}
    distortion={0}
    pulsating={false}
    cursorShadow
    clickPulse
    intro
    lightMode={false}
/>
</div>
      <main>
        {children}
      </main>


      </body>
    </html>
  );
}