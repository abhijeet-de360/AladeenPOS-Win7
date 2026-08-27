import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

// Enable support for older Windows 7 root certificate store
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('allow-insecure-localhost', 'true')

app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault()
  callback(true)
})

let mainWindow: BrowserWindow | null = null

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Update not available.')
  })

  autoUpdater.on('error', (err) => {
    console.log('[AutoUpdater] Error in auto-updater:', err)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version)
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: `A new version (v${info.version}) has been downloaded. Restart Aladeen POS now to apply update?`,
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
          cancelId: 1
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall()
          }
        })
    }
  })

  // Check for updates on startup in production
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.log('[AutoUpdater] Initial check error:', err)
    })
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Aladeen POS',
    icon,
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    frame: process.platform === 'darwin' ? false : true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.aladeen.pos')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC window controls
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })
  ipcMain.on('window-toggle-fullscreen', () => {
    if (mainWindow) {
      const isFull = mainWindow.isFullScreen()
      mainWindow.setFullScreen(!isFull)
      mainWindow.setKiosk(!isFull)
    }
  })
  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  // IPC Direct Thermal Receipt Printer
  ipcMain.handle('print-thermal-receipt', async (_event, htmlContent: string) => {
    return new Promise((resolve) => {
      try {
        const printWin = new BrowserWindow({
          show: false,
          webPreferences: {
            sandbox: false
          }
        })

        printWin.webContents.on('did-finish-load', async () => {
          try {
            const printers = await printWin.webContents.getPrintersAsync()
            const defaultPrinter = printers.find((p: any) => p.isDefault || p.status === 0) || printers[0]
            const deviceName = defaultPrinter ? defaultPrinter.name : ''

            console.log('Printing directly to printer device:', deviceName || 'System Default')

            printWin.webContents.print(
              {
                silent: true,
                printBackground: true,
                deviceName: deviceName
              },
              (success, failureReason) => {
                try {
                  printWin.close()
                } catch (e) {}
                if (!success) {
                  console.warn('Silent print status:', failureReason)
                  resolve({ success: false, reason: failureReason })
                } else {
                  console.log('Printed successfully to device:', deviceName)
                  resolve({ success: true })
                }
              }
            )
          } catch (printErr: any) {
            console.error('Print execution error:', printErr)
            try {
              printWin.close()
            } catch (e) {}
            resolve({ success: false, error: printErr.message })
          }
        })

        printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)
      } catch (err: any) {
        console.error('Error printing receipt:', err)
        resolve({ success: false, error: err.message })
      }
    })
  })

  createWindow()
  setupAutoUpdater()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
