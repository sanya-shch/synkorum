import { create } from "zustand";

interface MembersModalStore {
  isOpen: boolean;
  organizationId?: string;
  onOpen: (organizationId: string) => void;
  onClose: () => void;
}

export const useMembersModal = create<MembersModalStore>((set) => ({
  isOpen: false,
  organizationId: undefined,
  onOpen: (organizationId) => set({ isOpen: true, organizationId }),
  onClose: () => set({ isOpen: false, organizationId: undefined }),
}));
