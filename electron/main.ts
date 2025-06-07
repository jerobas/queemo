import fs from "fs";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import store from "./helpers/store";
import { getLockFile } from "./helpers/lockfile";
import ApiService from "./helpers/axios";
import isProcessRunning from "./helpers/inspect";
import { IpcMethod } from "../src/interfaces";
import { getAutoUpdater } from "./helpers/auto-updater";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let api: ApiService;
let win: BrowserWindow | null;
const autoUpdater = getAutoUpdater();

function createWindow() {
  isProcessRunning().then((isRunning) => {
    if (!isRunning && !process.env.DEV) {
      dialog.showErrorBox(
        "League of Legends não está aberto",
        "Por favor, abra o League of Legends e faça login antes de iniciar o aplicativo."
      );
      app.quit();
      return;
    }
  });
  const lockfile = getLockFile();
  api = new ApiService(lockfile.port, lockfile.password);
  win = new BrowserWindow({
    width: 386,
    height: 678,
    frame: false,
    maximizable: false,
    resizable: false,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  fs.watch(path.dirname(lockfile.filePath), (_, filename) => {
    if (filename === "lockfile" && !fs.existsSync(lockfile.filePath)) {
      dialog.showErrorBox(
        "League of Legends foi fechado",
        "O jogo foi encerrado. O aplicativo também será fechado."
      );
      app.quit();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
});

ipcMain.handle(IpcMethod.UPDATER_CHECK, async () =>
  !app.isPackaged
    ? null
    : (await autoUpdater.checkForUpdates())?.isUpdateAvailable
);

ipcMain.handle(IpcMethod.UPDATER_DOWNLOAD, async () =>
  !app.isPackaged ? null : await autoUpdater.downloadUpdate()
);

ipcMain.handle(IpcMethod.UPDATER_INSTALL, async () =>
  !app.isPackaged ? null : autoUpdater.quitAndInstall()
);

ipcMain.handle(IpcMethod.GET, async (_event, endpoint: string) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (e) {
    return { error: (e as Error).message };
  }
});

ipcMain.handle(IpcMethod.POST, async (_event, endpoint: string, data?: any) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (e) {
    return { error: (e as Error).message };
  }
});

ipcMain.handle(IpcMethod.MINIMIZE, () => {
  win?.minimize();
});

ipcMain.handle(IpcMethod.CLOSE, () => {
  win?.close();
});

ipcMain.handle(IpcMethod.GET_AUDIO, () => {
  return store.get("audioDeviceId");
});

ipcMain.handle(IpcMethod.SET_AUDIO, (_event, id: string) => {
  store.set("audioDeviceId", id);
});

ipcMain.handle(IpcMethod.GET_AUTO_JOIN_CALL, () => {
  return store.get("autoJoinCall");
});

ipcMain.handle(IpcMethod.SET_AUTO_JOIN_CALL, (_event, value: boolean) => {
  store.set("autoJoinCall", value);
});
