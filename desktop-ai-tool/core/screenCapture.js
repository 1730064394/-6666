import { screen, desktopCapturer, ipcMain } from 'electron';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ScreenCapture {
  constructor() {
    this.captureInterval = null;
    this.lastCapture = null;
    this.captureCallbacks = [];
    this.captureDir = path.join(__dirname, '../../captures');
    this.init();
  }

  async init() {
    if (!existsSync(this.captureDir)) {
      await mkdir(this.captureDir, { recursive: true });
    }
  }

  async getDisplaySources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('获取屏幕源失败:', error);
      return [];
    }
  }

  async captureFullScreen(sourceId = null) {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: screen.getPrimaryDisplay().workAreaSize
      });

      const source = sourceId 
        ? sources.find(s => s.id === sourceId) 
        : sources[0];

      if (!source) {
        throw new Error('未找到屏幕源');
      }

      const imageBuffer = source.thumbnail.toPNG();
      this.lastCapture = {
        data: imageBuffer,
        dataURL: `data:image/png;base64,${imageBuffer.toString('base64')}`,
        timestamp: Date.now(),
        display: {
          id: source.id,
          name: source.name,
          size: screen.getPrimaryDisplay().workAreaSize
        }
      };

      return this.lastCapture;
    } catch (error) {
      console.error('截图失败:', error);
      throw error;
    }
  }

  async captureRegion(x, y, width, height) {
    try {
      const fullCapture = await this.captureFullScreen();
      const Jimp = (await import('jimp')).default;
      
      const image = await Jimp.read(fullCapture.data);
      image.crop(x, y, width, height);
      
      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      
      return {
        data: buffer,
        dataURL: `data:image/png;base64,${buffer.toString('base64')}`,
        timestamp: Date.now(),
        region: { x, y, width, height }
      };
    } catch (error) {
      console.error('区域截图失败:', error);
      throw error;
    }
  }

  async saveCapture(filename = null) {
    if (!this.lastCapture) {
      throw new Error('没有可保存的截图');
    }

    const name = filename || `capture_${Date.now()}.png`;
    const filepath = path.join(this.captureDir, name);
    
    await writeFile(filepath, this.lastCapture.data);
    
    return {
      path: filepath,
      name: name,
      timestamp: this.lastCapture.timestamp
    };
  }

  startContinuousCapture(intervalMs = 1000) {
    if (this.captureInterval) {
      this.stopContinuousCapture();
    }

    this.captureInterval = setInterval(async () => {
      try {
        await this.captureFullScreen();
        this.captureCallbacks.forEach(callback => callback(this.lastCapture));
      } catch (error) {
        console.error('连续截图失败:', error);
      }
    }, intervalMs);

    return true;
  }

  stopContinuousCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    return true;
  }

  onCapture(callback) {
    this.captureCallbacks.push(callback);
    return () => {
      this.captureCallbacks = this.captureCallbacks.filter(cb => cb !== callback);
    };
  }

  getLastCapture() {
    return this.lastCapture;
  }

  getDisplays() {
    return screen.getAllDisplays().map((display, index) => ({
      id: index,
      name: `显示器 ${index + 1}`,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      isPrimary: display.id === screen.getPrimaryDisplay().id
    }));
  }
}

export function setupScreenCaptureIPC(ipcMain) {
  const capture = new ScreenCapture();

  ipcMain.handle('capture:full', async (event, sourceId) => {
    return await capture.captureFullScreen(sourceId);
  });

  ipcMain.handle('capture:region', async (event, { x, y, width, height }) => {
    return await capture.captureRegion(x, y, width, height);
  });

  ipcMain.handle('capture:save', async (event, filename) => {
    return await capture.saveCapture(filename);
  });

  ipcMain.handle('capture:sources', async () => {
    return await capture.getDisplaySources();
  });

  ipcMain.handle('capture:displays', () => {
    return capture.getDisplays();
  });

  ipcMain.handle('capture:startContinuous', (event, intervalMs) => {
    return capture.startContinuousCapture(intervalMs);
  });

  ipcMain.handle('capture:stopContinuous', () => {
    return capture.stopContinuousCapture();
  });

  ipcMain.handle('capture:last', () => {
    return capture.getLastCapture();
  });

  capture.onCapture((captureData) => {
    global.mainWindow?.webContents.send('capture:update', captureData);
  });

  return capture;
}
