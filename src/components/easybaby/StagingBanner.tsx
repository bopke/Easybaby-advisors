// Orange "this is the test environment" bar, fixed to the top of the viewport.
// Ported from clauwi.pl.
//
// NEXT_PUBLIC_APP_ENV is inlined at BUILD time by `npm run deploy:staging`
// (see package.json) — prerendered pages would never see a runtime Worker
// variable. `npm run deploy` builds without it, so production renders nothing.
//
// Sticky headers (.eb-header, .adm-top) and the mobile menu offset themselves by
// --staging-bar so they stick below the bar instead of sliding under it.

const BAR_HEIGHT = 28;

export function StagingBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "staging") return null;

  return (
    <>
      <style>{`:root { --staging-bar: ${BAR_HEIGHT}px; }`}</style>
      <div
        role="status"
        className="fixed inset-x-0 top-0 z-[100001] flex items-center justify-center bg-orange-500 px-4 text-center text-xs font-semibold uppercase tracking-wide text-white shadow"
        style={{ height: BAR_HEIGHT }}
      >
        Środowisko testowe (staging) — to nie jest strona produkcyjna
      </div>
      {/* Pushes the page down so the bar doesn't cover the header. */}
      <div aria-hidden style={{ height: BAR_HEIGHT, flexShrink: 0 }} />
    </>
  );
}
