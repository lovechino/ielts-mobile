import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
  
  // Modals state
  modals: {
    lowBalance: boolean;
  };
  showModal: (name: keyof UIState['modals']) => void;
  hideModal: (name: keyof UIState['modals']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  modals: {
    lowBalance: false,
  },

  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-hide after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  showModal: (name) => {
    set((state) => ({
      modals: { ...state.modals, [name]: true },
    }));
  },

  hideModal: (name) => {
    set((state) => ({
      modals: { ...state.modals, [name]: false },
    }));
  },
}));
