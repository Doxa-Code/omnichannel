import { create } from "zustand";

type Store = {
  open: boolean;
  toggleOpen(): void;
  channelId: string;
  channelDescription: string;
  setChannelValues(channelId: string, channelDescription: string): void;
};

export const useChannels = create<Store>((set, get) => ({
  open: false,
  channelId: "",
  channelDescription: "",
  setChannelValues(channelId: string, channelDescription: string) {
    set({ channelId, channelDescription });
  },
  toggleOpen() {
    set({ open: !get().open });
  },
}));
