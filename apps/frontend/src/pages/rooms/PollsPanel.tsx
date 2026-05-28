export function PollsPanel() {
  return (
    <aside className="h-full bg-white border-l border-forest-100 flex flex-col">
      <div className="px-4 py-4 border-b border-forest-100">
        <h2 className="font-display text-sm uppercase tracking-widest text-forest-500">
          Голосування
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="text-center text-forest-500 font-body text-sm">
          <p className="mb-1">🗳️</p>
          <p>Активних голосувань поки немає.</p>
          <p className="text-xs mt-2 text-forest-700">
            Голосування з'являться тут у наступному блоці.
          </p>
        </div>
      </div>
    </aside>
  );
}
