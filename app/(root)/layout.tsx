import LightRays from "@/components/LightRays";
import Navbar from "@/components/Navbar";

const StorefrontLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <>
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
      <main>{children}</main>
    </>
  );
};

export default StorefrontLayout;
