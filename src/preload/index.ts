import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  minimize: (): void => ipcRenderer.send('window-minimize'),
  maximize: (): void => ipcRenderer.send('window-maximize'),
  toggleFullscreen: (): void => ipcRenderer.send('window-toggle-fullscreen'),
  close: (): void => ipcRenderer.send('window-close'),
  printThermalReceipt: (htmlContent: string, deviceName?: string) => ipcRenderer.invoke('print-thermal-receipt', htmlContent, deviceName),
  openVirtualKeyboard: (): void => ipcRenderer.send('open-virtual-keyboard')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
