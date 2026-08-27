import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      minimize: () => void
      maximize: () => void
      toggleFullscreen: () => void
      close: () => void
      printThermalReceipt: (htmlContent: string) => Promise<{ success: boolean; reason?: string; error?: string }>
    }
  }
}
