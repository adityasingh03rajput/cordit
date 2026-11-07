'use client';

import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';
import { format } from 'date-fns';

export default function ObserverSuggestionsPanel() {
  const { currentRoom, user, suggestions, showSuggestions, userRoleInCurrentRoom } = useStore();
  const { toggleSuggestionVisibility } = useSocket();

  if (!currentRoom || currentRoom.roomType !== 'stranger_chat' || !showSuggestions || suggestions.length === 0) {
    return null;
  }

  const isParticipant =
    userRoleInCurrentRoom === 'participant' ||
    (user && currentRoom.participants?.some((p: any) => p === user._id || p?._id === user._id || String(p) === String(user._id)));

  return (
    <div className="border-b-[3px] border-black bg-surface p-2.5 sm:p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase text-purple flex items-center gap-1.5">
          <span>💡 Observer Suggestions</span>
          <span className="badge-brutal text-[10px] bg-purple text-white px-1 py-0">
            {suggestions.length}
          </span>
        </span>
        {isParticipant && (
          <span className="text-[10px] font-bold text-dim">
            Participants can dismiss suggestions individually
          </span>
        )}
      </div>

      <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {suggestions.slice(0, 10).map((sugg) => (
          <div
            key={sugg._id}
            className="card-brutal bg-white p-2.5 min-w-[220px] max-w-[300px] flex-shrink-0 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-black text-[11px] text-dark truncate">
                  #{sugg.observerPublicId} ({sugg.observerUsername})
                </span>
                <span className="text-[10px] font-bold text-dim flex-shrink-0">
                  {format(new Date(sugg.createdAt), 'HH:mm')}
                </span>
              </div>
              <p className="text-xs font-medium text-dark line-clamp-2">
                {sugg.content}
              </p>
            </div>

            {isParticipant && (
              <div className="mt-2 pt-1.5 border-t border-black/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => toggleSuggestionVisibility(sugg._id, false)}
                  className="btn-brutal bg-surface hover:bg-error hover:text-white text-[10px] font-black px-2 py-0.5 uppercase transition-colors"
                  title="Hide this suggestion from my view"
                >
                  ✕ HIDE
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

