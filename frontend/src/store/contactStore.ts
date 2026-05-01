import { create } from 'zustand';
import client from '../api/client';

interface ContactUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

interface ContactRequest {
  id: string;
  requester: ContactUser;
  createdAt: string;
}

interface ContactState {
  contacts: ContactUser[];
  incomingRequests: ContactRequest[];
  isLoading: boolean;

  fetchContacts: () => Promise<void>;
  fetchIncomingRequests: () => Promise<void>;
  sendRequest: (addresseeId: string) => Promise<void>;
  respondToRequest: (contactId: string, accept: boolean) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
  addIncomingRequest: (request: ContactRequest) => void;
  removeIncomingRequest: (contactId: string) => void;
  addContact: (user: ContactUser) => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  incomingRequests: [],
  isLoading: false,

  fetchContacts: async () => {
    try {
      const { data } = await client.get('/contacts');
      set({ contacts: data });
    } catch {
      // ignore
    }
  },

  fetchIncomingRequests: async () => {
    try {
      const { data } = await client.get('/contacts/requests');
      set({ incomingRequests: data });
    } catch {
      // ignore
    }
  },

  sendRequest: async (addresseeId: string) => {
    await client.post('/contacts', { addresseeId });
  },

  respondToRequest: async (contactId: string, accept: boolean) => {
    const { data } = await client.patch(`/contacts/${contactId}`, { accept });
    set({ incomingRequests: get().incomingRequests.filter(r => r.id !== contactId) });
    if (accept && data.requester) {
      set({ contacts: [...get().contacts, data.requester] });
    }
  },

  removeContact: async (contactId: string) => {
    await client.delete(`/contacts/${contactId}`);
    set({ contacts: get().contacts.filter(c => c.id !== contactId) });
  },

  addIncomingRequest: (request: ContactRequest) => {
    const exists = get().incomingRequests.some(r => r.id === request.id);
    if (!exists) {
      set({ incomingRequests: [request, ...get().incomingRequests] });
    }
  },

  removeIncomingRequest: (contactId: string) => {
    set({ incomingRequests: get().incomingRequests.filter(r => r.id !== contactId) });
  },

  addContact: (user: ContactUser) => {
    const exists = get().contacts.some(c => c.id === user.id);
    if (!exists) {
      set({ contacts: [...get().contacts, user] });
    }
  },
}));
