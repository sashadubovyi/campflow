interface Props {
  roomName: string;
}

export function ChatPanel({ roomName }: Props) {
  return (
    <section className="h-full flex flex-col bg-forest-50">
      <div className="px-6 py-4 border-b border-forest-100 bg-white">
        <h2 className="font-display text-lg font-bold text-forest-900">{roomName}</h2>
        <p className="font-body text-xs text-forest-500">Обговорення</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex items-center justify-center">
        <div className="text-center text-forest-500 font-body">
          <p className="text-2xl mb-2">💬</p>
          <p>Тут буде чат обговорення.</p>
          <p className="text-xs mt-2 text-forest-700">
            Real-time чат підключимо в наступному блоці.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-forest-100 bg-white">
        <input
          disabled
          placeholder="Написати повідомлення…"
          className="w-full px-4 py-2.5 rounded-xl border border-forest-100 bg-forest-50 text-forest-500 outline-none"
        />
      </div>
    </section>
  );
}
