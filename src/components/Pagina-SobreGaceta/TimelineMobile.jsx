// src/components/Pagina-SobreGaceta/TimelineMobile.jsx
import { GACETA_TIMELINE } from "./data";

function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export default function TimelineMobile() {
  return (
    <section className="w-full bg-black text-white px-5 pb-16">
      <div className="relative max-w-md mx-auto">
        {/* línea vertical continua */}
        <div className="pointer-events-none absolute left-[10px] top-0 bottom-0 w-px bg-white/25" />

        <div className="flex flex-col gap-16">
          {GACETA_TIMELINE.map((block) => (
            <YearBlockMobile key={block.year} year={block.year} events={block.events} />
          ))}
        </div>
      </div>
    </section>
  );
}

function YearBlockMobile({ year, events }) {
  return (
    <div className="relative pl-10">
      {/* header de año */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-4 w-4 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.2)]" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white">
          {year}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {events.map((ev) => (
          <div key={ev.id} className="relative">
            {/* conector horizontal desde la línea al evento */}
            <div className="absolute -left-8 top-7 h-px w-6 bg-white/35 rounded-full" />
            <EventCardMobile ev={ev} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCardMobile({ ev }) {
  return (
    <article className="w-full">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
        {fmt(ev.date)}
      </p>
      <h3 className="mt-1 text-sm font-semibold leading-snug">
        {ev.title}
      </h3>
      {ev.desc && (
        <p className="mt-2 text-xs text-white/75 leading-relaxed">
          {ev.desc}
        </p>
      )}

      {ev.media?.type === "image" && (
        <img
          src={ev.media.src}
          alt={ev.media.alt || ev.title}
          className="mt-3 w-full aspect-[4/3] object-cover rounded-xl ring-1 ring-white/10"
          loading="lazy"
          decoding="async"
        />
      )}

      {ev.media?.type === "video" && (
        <video
          className="mt-3 w-full aspect-[4/3] object-cover rounded-xl ring-1 ring-white/10"
          src={ev.media.src}
          muted
          playsInline
          preload="metadata"
        />
      )}
    </article>
  );
}
