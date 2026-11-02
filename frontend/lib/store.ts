import { create } from 'zustand';
import type { User, Room, Message, ActiveUser, Suggestion } from './types';

interface AppState {
  user: User | null;
  currentRoom: Room | null;
  rooms: Room[];
  messages: Message[];
  activeUsers: ActiveUser[];
  isConnected: boolean;
  typingUsers: string[];

  // Stranger Matching State
  isMatching: boolean;
  matchingPreference: 'male' | 'female' | 'any';
  matchError: string | null;
  matchedPartner: { publicId: number; username: string; gender: string } | null;

  // Observer & Suggestions State
  userRoleInCurrentRoom: 'participant' | 'observer';
  suggestions: Suggestion[];
  showSuggestions: boolean;

  setUser: (user: User | null) => void;
  setCurrentRoom: (room: Room | null) => void;
  setRooms: (rooms: Room[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setActiveUsers: (users: ActiveUser[]) => void;
  setConnected: (isConnected: boolean) => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  setMatching: (isMatching: boolean) => void;
  setMatchingPreference: (pref: 'male' | 'female' | 'any') => void;
  setMatchError: (err: string | null) => void;
  setMatchedPartner: (partner: { publicId: number; username: string; gender: string } | null) => void;
  setUserRoleInCurrentRoom: (role: 'participant' | 'observer') => void;
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestion: (suggestion: Suggestion) => void;
  updateSuggestionVisibility: (suggestionId: string, visible: boolean) => void;
  setShowSuggestions: (show: boolean) => void;
  updateCurrentRoomObserverCount: (count: number) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  currentRoom: null,
  rooms: [],
  messages: [],
  activeUsers: [],
  isConnected: false,
  typingUsers: [],

  isMatching: false,
  matchingPreference: 'any',
  matchError: null,
  matchedPartner: null,

  userRoleInCurrentRoom: 'participant',
  suggestions: [],
  showSuggestions: true,

  setUser: (user) => set({ user }),

  setCurrentRoom: (room) => set({
    currentRoom: room,
    messages: [],
    suggestions: [],
    userRoleInCurrentRoom: room?.role || 'participant',
  }),

  setRooms: (rooms) => set({ rooms }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  setActiveUsers: (users) => set({ activeUsers: users }),

  setConnected: (isConnected) => set({ isConnected }),

  addTypingUser: (username) => set((state) => ({
    typingUsers: state.typingUsers.includes(username)
      ? state.typingUsers
      : [...state.typingUsers, username]
  })),

  removeTypingUser: (username) => set((state) => ({
    typingUsers: state.typingUsers.filter(u => u !== username)
  })),

  setMatching: (isMatching) => set({ isMatching }),
  setMatchingPreference: (matchingPreference) => set({ matchingPreference }),
  setMatchError: (matchError) => set({ matchError }),
  setMatchedPartner: (matchedPartner) => set({ matchedPartner }),

  setUserRoleInCurrentRoom: (userRoleInCurrentRoom) =>
    set((state) => (state.userRoleInCurrentRoom === userRoleInCurrentRoom ? state : { userRoleInCurrentRoom })),
  setSuggestions: (suggestions) => set({ suggestions }),
  addSuggestion: (suggestion) => set((state) => ({
    suggestions: [suggestion, ...state.suggestions],
  })),
  updateSuggestionVisibility: (suggestionId, visible) =>
    set((state) => ({
      suggestions: visible
        ? state.suggestions
        : state.suggestions.filter((s) => s._id !== suggestionId),
    })),
  setShowSuggestions: (showSuggestions) => set({ showSuggestions }),
  updateCurrentRoomObserverCount: (observerCount) =>
    set((state) => {
      if (!state.currentRoom || state.currentRoom.observerCount === observerCount) {
        return state;
      }
      return {
        currentRoom: { ...state.currentRoom, observerCount },
      };
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      import('./useSocket').then(({ disconnectSocket }) => {
        disconnectSocket();
      });
      window.location.href = '/login';
    }
    set({
      user: null,
      currentRoom: null,
      messages: [],
      activeUsers: [],
      isMatching: false,
      suggestions: [],
    });
  },
}));
