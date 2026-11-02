'use client';

import { useStore } from '@/lib/store';
import { format } from 'date-fns';

export default function ObserverSuggestionsPanel() {
  const { currentRoom, suggestions, showSuggestions } = useStore();

  if (!currentRoom || currentRoom.roomType !== 'stranger_chat' || !showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="border-b-[3px] border-black bg-surface p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase text-purple flex items-center gap-1.5">
          <span>💡 Observer Suggestions</span>
          <span className="badge-brutal text-[10px] bg-purple text-white px-1 py-0">
            {suggestions.length}
          </span>
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {suggestions.slice(0, 5).map((sugg) => (
          <div
            key={sugg._id}
            className="card-brutal bg-white p-2.5 min-w-[240px] max-w-[320px] flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-[11px] text-dark">
                #{sugg.observerPublicId} ({sugg.observerUsername})
              </span>
              <span className="text-[10px] font-bold text-dim">
                {format(new Date(sugg.createdAt), 'HH:mm')}
              </span>
            </div>
            <p className="text-xs font-medium text-dark line-clamp-2">
              {sugg.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

