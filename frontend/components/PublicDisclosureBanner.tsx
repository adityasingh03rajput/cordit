'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useSocket } from '@/lib/useSocket';

export default function PublicDisclosureBanner() {
  const { currentRoom, userRoleInCurrentRoom, suggestions, showSuggestions, setShowSuggestions } = useStore();
  const { sendSuggestion } = useSocket();
  const [suggestionText, setSuggestionText] = useState('');
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [suggestionSent, setSuggestionSent] = useState(false);

  if (!currentRoom || currentRoom.roomType !== 'stranger_chat') {
    return null;
  }

  const isObserver = userRoleInCurrentRoom === 'observer';

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim() || sendingSuggestion) return;

    setSendingSuggestion(true);
    sendSuggestion(suggestionText.trim());
    setSuggestionText('');
    setSendingSuggestion(false);
    setSuggestionSent(true);
    setTimeout(() => setSuggestionSent(false), 3000);
  };

  return (
    <div className="border-b-[3px] border-black bg-yellow p-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Public Notice */}
        <div className="flex items-center gap-2">
          <span className="badge-brutal bg-black text-yellow text-xs font-black uppercase px-2 py-0.5">
            PUBLIC LIVE ROOM
          </span>
          <p className="text-xs font-bold text-dark">
            {isObserver
              ? 'You are observing this conversation in read-only mode.'
              : 'Observers can watch this conversation live and drop advice/suggestions.'}
          </p>
        </div>

        {/* Participant Controls / Observer Controls */}
        <div className="flex items-center gap-2">
          {!isObserver ? (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="btn-brutal bg-card text-dark text-xs font-black px-3 py-1 flex items-center gap-1.5"
            >
              <span>{showSuggestions ? 'HIDE SUGGESTIONS' : 'VIEW SUGGESTIONS'}</span>
              {suggestions.length > 0 && (
                <span className="badge-brutal bg-purple text-white text-[10px] px-1 py-0">
                  {suggestions.length}
                </span>
              )}
            </button>
          ) : (
            <span className="badge-brutal bg-card text-dark text-xs font-black uppercase px-2 py-1">
              OBSERVER MODE (READ-ONLY)
            </span>
          )}
        </div>
      </div>

      {/* Observer Suggestion Input Box */}
      {isObserver && (
        <form onSubmit={handleSuggestionSubmit} className="mt-2.5 flex items-center gap-2">
          <input
            type="text"
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            placeholder="Drop a suggestion or topic for the participants..."
            maxLength={500}
            className="input-brutal flex-1 py-1.5 px-3 text-xs bg-white"
          />
          <button
            type="submit"
            disabled={!suggestionText.trim() || sendingSuggestion}
            className="btn-brutal bg-purple text-white font-black text-xs px-4 py-1.5 uppercase hover:brightness-105"
          >
            {sendingSuggestion ? 'SENDING...' : suggestionSent ? 'SENT!' : 'SUGGEST'}
          </button>
        </form>
      )}
    </div>
  );
}

