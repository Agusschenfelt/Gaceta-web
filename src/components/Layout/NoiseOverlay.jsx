export default function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="noise-texture fixed inset-0 z-[9999] pointer-events-none opacity-[0.04]"
    />
  );
}