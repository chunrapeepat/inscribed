import { create } from "zustand";

export type ModalType = "fonts-manager";

interface ModalState {
  openFontsManagerModal: boolean;
  props: object;
  openModal: (type: ModalType, props?: object) => void;
  closeModal: (type: ModalType) => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  openFontsManagerModal: false,
  props: {},
  openModal: (type: ModalType, props = {}) =>
    set((state) => {
      if (type === "fonts-manager") {
        return { openFontsManagerModal: true, props };
      }
      return state;
    }),

  closeModal: (type: ModalType) =>
    set((state) => {
      if (type === "fonts-manager") {
        return { openFontsManagerModal: false, props: {} };
      }
      return state;
    }),
}));
