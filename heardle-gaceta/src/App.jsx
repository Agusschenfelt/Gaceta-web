import { GameContainer } from "./containers/GameContainer.jsx";

/**
 * Fixed-height frame. `h-svh` plus `overflow-hidden` is the whole contract:
 * nothing inside is allowed to scroll the page, so every view has to fit and
 * the elastic play circle takes up the slack.
 */
export default function App() {
  return (
    <div
      className="mx-auto flex h-svh w-full max-w-md flex-col gap-2 overflow-hidden px-4 sm:px-6 lg:max-w-5xl"
      style={{
        paddingTop: "max(0.875rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))",
      }}
    >
      <header className="flex shrink-0 items-baseline justify-between gap-3">
        {/* The real wordmark, cropped so its bottom edge is the letter baseline
            — that is what makes `items-baseline` line it up with the serif.
            Its isotype is not repeated here: it lives inside the play circle. */}
        <span className="flex items-baseline gap-2">
          <img
            src="/assets/gaceta-word.webp"
            alt="GACETA"
            width={367}
            height={64}
            className="h-4 w-auto"
          />
          {/* Instrument Serif needs real leading; at 1 its italic gets clipped. */}
          <em className="font-display text-lg italic leading-[1.3]">heardle</em>
        </span>
        <a
          href="https://esgaceta.com"
          target="_blank"
          rel="noopener noreferrer"
          className="label transition-colors hover:text-fg"
        >
          esgaceta.com
        </a>
      </header>
      <h1 className="sr-only">GACETA Heardle — Adiviná el tema</h1>
      <main className="flex min-h-0 flex-1 flex-col">
        <GameContainer />
      </main>
    </div>
  );
}
