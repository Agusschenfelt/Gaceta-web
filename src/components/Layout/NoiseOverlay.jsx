import React from "react";

export default function NoiseOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none w-full h-full">
      {/* CAMBIO CLAVE:
         - opacity-[0.07]: Suficiente para verse, no tanto para molestar.
         - Sin mix-blend-mode complejo: Esto asegura que se vea sobre negro.
      */}
      <svg className="h-full w-full opacity-[0.07]">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8" // Frecuencia alta = grano fino
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" fill="white" />
      </svg>
    </div>
  );
}