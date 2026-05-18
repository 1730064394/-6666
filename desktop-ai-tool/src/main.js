import { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage, ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let screenCapture = null;
let aiRecognition = null;
let desktopController = null;
let apiServer = null;
let isQuitting = false;

class DesktopAITool {
  constructor() {
    this.config = {
      apiPort: 3000,
      apiHost: 'localhost',
      captureInterval: 1000,
      safetyMode: true
    };
  }

  async initialize() {
    console.log('正在初始化桌面AI工具...');

    try {
      await this.setupCoreModules();
      await this.setupAPI();
      await this.setupIPC();
      
      console.log('所有模块初始化完成');
      return true;
    } catch (error) {
      console.error('初始化失败:', error);
      return false;
    }
  }

  async setupCoreModules() {
    console.log('初始化核心模块...');

    try {
      const { setupScreenCaptureIPC } = await import('./core/screenCapture.js');
      screenCapture = setupScreenCaptureIPC(ipcMain);
      console.log('✓ 屏幕捕获模块已加载');
    } catch (error) {
      console.error('屏幕捕获模块加载失败:', error);
    }

    try {
      const { AIRecognition } = await import('./modules/aiRecognition.js');
      aiRecognition = new AIRecognition();
      await aiRecognition.initialize();
      console.log('✓ AI识别模块已加载');
    } catch (error) {
      console.error('AI识别模块加载失败:', error);
    }

    try {
      const { setupDesktopControllerIPC } = await import('./modules/desktopController.js');
      desktopController = setupDesktopControllerIPC(ipcMain);
      console.log('✓ 桌面控制模块已加载');
    } catch (error) {
      console.error('桌面控制模块加载失败:', error);
    }

    try {
      const { MultiAIPipeline, VisionAnalyzer, PlannerAgent, ExecutionAgent, VerificationAgent } = 
        await import('./modules/multiAIPipeline.js');
      
      const pipeline = new MultiAIPipeline({
        maxIterations: 3,
        confidenceThreshold: 0.7
      });

      if (aiRecognition) {
        pipeline.registerAIModule('vision', new VisionAnalyzer(aiRecognition));
        pipeline.registerAIModule('planner', new PlannerAgent(aiRecognition));
        pipeline.registerAIModule('verifier', new VerificationAgent(aiRecognition));
      }

      if (desktopController) {
        pipeline.registerAIModule('executor', new ExecutionAgent(desktopController));
      }

      global.pipeline = pipeline;
      console.log('✓ 多AI协作管道已加载');
    } catch (error) {
      console.error('多AI协作管道加载失败:', error);
    }
  }

  async setupAPI() {
    console.log('初始化API服务器...');

    try {
      const { APIServer } = await import('./api/server.js');
      apiServer = new APIServer({
        port: this.config.apiPort,
        host: this.config.apiHost
      });

      await apiServer.initialize(
        screenCapture,
        aiRecognition,
        desktopController,
        global.pipeline
      );

      await apiServer.start();
      console.log(`✓ API服务器已启动 (http://${this.config.apiHost}:${this.config.apiPort})`);
    } catch (error) {
      console.error('API服务器启动失败:', error);
    }
  }

  setupIPC() {
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:getConfig', () => {
      return this.config;
    });

    ipcMain.handle('app:setConfig', (event, config) => {
      Object.assign(this.config, config);
      return this.config;
    });

    ipcMain.handle('app:getStatus', () => {
      return {
        modules: {
          screenCapture: !!screenCapture,
          aiRecognition: !!aiRecognition,
          desktopController: !!desktopController,
          pipeline: !!global.pipeline,
          apiServer: !!apiServer
        },
        config: this.config
      };
    });

    ipcMain.handle('app:quit', () => {
      isQuitting = true;
      app.quit();
    });

    ipcMain.handle('dialog:openFile', async (event, options) => {
      const result = await dialog.showOpenDialog(mainWindow, options);
      return result;
    });

    ipcMain.handle('dialog:saveFile', async (event, options) => {
      const result = await dialog.showSaveDialog(mainWindow, options);
      return result;
    });
  }

  createWindow() {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      title: '桌面AI工具',
      backgroundColor: '#667eea',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true
      },
      show: false
    });

    global.mainWindow = mainWindow;

    const indexPath = path.join(__dirname, 'web', 'index.html');
    mainWindow.loadFile(indexPath);

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      console.log('主窗口已显示');
    });

    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        console.log('窗口已最小化到托盘');
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  }

  createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    
    try {
      const icon = nativeImage.createFromPath(iconPath);
      tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
    } catch (error) {
      tray = new Tray(nativeImage.createEmpty());
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '捕获屏幕',
        click: async () => {
          if (screenCapture) {
            await screenCapture.captureFullScreen();
            if (mainWindow) {
              mainWindow.webContents.send('capture:update', screenCapture.getLastCapture());
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: 'API状态',
        enabled: false,
        click: () => {}
      },
      {
        label: `  服务器: ${apiServer ? '运行中' : '未启动'}`,
        enabled: false
      },
      {
        label: `  AI模块: ${aiRecognition ? '已连接' : '未连接'}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('桌面AI工具');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }

  createMenu() {
    const template = [
      {
        label: '文件',
        submenu: [
          {
            label: '捕获屏幕',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: async () => {
              if (screenCapture) {
                await screenCapture.captureFullScreen();
                if (mainWindow) {
                  mainWindow.webContents.send('capture:update', screenCapture.getLastCapture());
                }
              }
            }
          },
          {
            label: '保存截图',
            accelerator: 'CmdOrCtrl+S',
            click: async () => {
              if (screenCapture) {
                const result = await dialog.showSaveDialog(mainWindow, {
                  defaultPath: `screenshot_${Date.now()}.png`,
                  filters: [{ name: 'Images', extensions: ['png'] }]
                });
                
                if (!result.canceled && result.filePath) {
                  await screenCapture.saveCapture(result.filePath);
                }
              }
            }
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              isQuitting = true;
              app.quit();
            }
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: '控制',
        submenu: [
          {
            label: '暂停控制',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => {
              if (desktopController) {
                desktopController.pause();
                if (mainWindow) {
                  mainWindow.webContents.send('control:status', { paused: true });
                }
              }
            }
          },
          {
            label: '恢复控制',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              if (desktopController) {
                desktopController.resume();
                if (mainWindow) {
                  mainWindow.webContents.send('control:status', { paused: false });
                }
              }
            }
          },
          {
            label: '紧急停止',
            accelerator: 'CmdOrCtrl+Shift+X',
            click: () => {
              if (desktopController) {
                desktopController.stop();
                if (mainWindow) {
                  mainWindow.webContents.send('control:emergency_stop');
                }
              }
            }
          }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '关于桌面AI工具',
                message: '桌面AI工具 v1.0.0',
                detail: '一个实时桌面捕获和AI交互工具，支持屏幕识别、元素定位和自动化控制。'
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  registerShortcuts() {
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    globalShortcut.register('CommandOrControl+Shift+C', async () => {
      if (screenCapture) {
        await screenCapture.captureFullScreen();
        if (mainWindow) {
          mainWindow.webContents.send('capture:update', screenCapture.getLastCapture());
        }
      }
    });
  }

  async cleanup() {
    console.log('正在清理资源...');

    globalShortcut.unregisterAll();

    if (apiServer) {
      await apiServer.stop();
    }

    if (screenCapture) {
      screenCapture.stopContinuousCapture();
    }

    if (desktopController) {
      desktopController.stop();
    }

    console.log('清理完成');
  }
}

const desktopAITool = new DesktopAITool();

app.whenReady().then(async () => {
  await desktopAITool.initialize();
  desktopAITool.createWindow();
  desktopAITool.createTray();
  desktopAITool.createMenu();
  desktopAITool.registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      desktopAITool.createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', async () => {
  isQuitting = true;
  await desktopAITool.cleanup();
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
