import Store from "electron-store";
import { IStore } from "../../src/interfaces";

const store = new Store<IStore>({
  defaults: {
    audioDeviceId: null,
    autoJoinCall: false
  },
});

export default store;
