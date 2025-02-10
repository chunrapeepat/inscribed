import { create } from "zustand";

export type ModalType = "custom-fonts-modal";

interface ModalState {
  openCustomFontsModal: boolean;
  props: object;
  openModal: (type: ModalType, props?: object) => void;
  closeModal: (type: ModalType) => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  openCustomFontsModal: false,
  props: {},
  openModal: (type: ModalType, props = {}) =>
    set((state) => {
      if (type === "custom-fonts-modal") {
        return { openCustomFontsModal: true, props };
      }
      return state;
    }),

  closeModal: (type: ModalType) =>
    set((state) => {
      if (type === "custom-fonts-modal") {
        return { openCustomFontsModal: false, props: {} };
      }
      return state;
    }),
}));
