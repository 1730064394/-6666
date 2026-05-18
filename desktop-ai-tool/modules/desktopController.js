import robot from 'robotjs';
import { screen } from 'electron';

export class DesktopController {
  constructor() {
    this.isActive = false;
    this.lastAction = null;
    this.actionHistory = [];
    this.speed = 1.0;
    this.safetyMode = true;
  }

  initialize() {
    this.isActive = true;
    console.log('桌面控制模块初始化成功');
    return true;
  }

  async moveMouse(x, y, smooth = true) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    if (smooth) {
      await this.smoothMove(x, y);
    } else {
      robot.moveMouse(x, y);
    }

    const action = {
      type: 'move',
      x,
      y,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async smoothMove(targetX, targetY, steps = 20) {
    const currentPos = robot.getMousePos();
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const easedProgress = this.easeInOutQuad(progress);
      
      const x = Math.round(currentPos.x + dx * easedProgress);
      const y = Math.round(currentPos.y + dy * easedProgress);
      
      robot.moveMouse(x, y);
      await this.delay(10);
    }
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  async click(x, y, button = 'left', clicks = 1) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    if (this.safetyMode) {
      const confirmed = await this.verifyClickSafe(x, y);
      if (!confirmed) {
        throw new Error('点击位置不安全，已被安全机制阻止');
      }
    }

    await this.moveMouse(x, y, true);
    await this.delay(100);

    for (let i = 0; i < clicks; i++) {
      robot.click(button);
      if (clicks > 1) {
        await this.delay(150);
      }
    }

    const action = {
      type: 'click',
      x,
      y,
      button,
      clicks,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async doubleClick(x, y, button = 'left') {
    return await this.click(x, y, button, 2);
  }

  async rightClick(x, y) {
    return await this.click(x, y, 'right', 1);
  }

  async drag(startX, startY, endX, endY, duration = 500) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    await this.moveMouse(startX, startY, true);
    await this.delay(100);
    
    robot.mouseToggle('down');
    await this.delay(50);

    const steps = Math.max(10, Math.floor(duration / 20));
    const dx = endX - startX;
    const dy = endY - startY;

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const x = Math.round(startX + dx * progress);
      const y = Math.round(startY + dy * progress);
      robot.moveMouse(x, y);
      await this.delay(20);
    }

    robot.mouseToggle('up');

    const action = {
      type: 'drag',
      startX,
      startY,
      endX,
      endY,
      duration,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async scroll(clicks, direction = 'down') {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    const scrollAmount = direction === 'up' ? clicks : -clicks;
    robot.scrollMouse(0, scrollAmount);

    const action = {
      type: 'scroll',
      clicks: Math.abs(clicks),
      direction,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async typeText(text, delay = 50) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    robot.typeStringDelayed(text, delay);

    const action = {
      type: 'type',
      text,
      delay,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async pressKey(key, modifiers = []) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    const keyCombo = [...modifiers, key];
    robot.keyTap(key.toLowerCase(), modifiers);

    const action = {
      type: 'keyPress',
      key,
      modifiers,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async hotkey(...keys) {
    if (!this.isActive) {
      throw new Error('控制器未激活');
    }

    robot.keyTap(keys[keys.length - 1].toLowerCase(), keys.slice(0, -1));

    const action = {
      type: 'hotkey',
      keys,
      timestamp: Date.now()
    };

    this.lastAction = action;
    this.actionHistory.push(action);
    return action;
  }

  async verifyClickSafe(x, y) {
    return true;
  }

  getMousePosition() {
    return robot.getMousePos();
  }

  getScreenSize() {
    return screen.getPrimaryDisplay().workAreaSize;
  }

  getLastAction() {
    return this.lastAction;
  }

  getActionHistory(limit = 100) {
    return this.actionHistory.slice(-limit);
  }

  clearHistory() {
    this.actionHistory = [];
  }

  setSafetyMode(enabled) {
    this.safetyMode = enabled;
    return this.safetyMode;
  }

  pause() {
    this.isActive = false;
    return true;
  }

  resume() {
    this.isActive = true;
    return true;
  }

  stop() {
    this.pause();
    robot.mouseToggle('up');
    return true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function setupDesktopControllerIPC(ipcMain) {
  const controller = new DesktopController();
  controller.initialize();

  ipcMain.handle('control:move', async (event, { x, y, smooth }) => {
    return await controller.moveMouse(x, y, smooth !== false);
  });

  ipcMain.handle('control:click', async (event, { x, y, button, clicks }) => {
    return await controller.click(x, y, button || 'left', clicks || 1);
  });

  ipcMain.handle('control:doubleClick', async (event, { x, y }) => {
    return await controller.doubleClick(x, y);
  });

  ipcMain.handle('control:rightClick', async (event, { x, y }) => {
    return await controller.rightClick(x, y);
  });

  ipcMain.handle('control:drag', async (event, { startX, startY, endX, endY, duration }) => {
    return await controller.drag(startX, startY, endX, endY, duration || 500);
  });

  ipcMain.handle('control:scroll', async (event, { clicks, direction }) => {
    return await controller.scroll(clicks || 3, direction || 'down');
  });

  ipcMain.handle('control:type', async (event, { text, delay }) => {
    return await controller.typeText(text, delay || 50);
  });

  ipcMain.handle('control:keyPress', async (event, { key, modifiers }) => {
    return await controller.pressKey(key, modifiers || []);
  });

  ipcMain.handle('control:hotkey', async (event, ...keys) => {
    return await controller.hotkey(...keys);
  });

  ipcMain.handle('control:position', () => {
    return controller.getMousePosition();
  });

  ipcMain.handle('control:screenSize', () => {
    return controller.getScreenSize();
  });

  ipcMain.handle('control:lastAction', () => {
    return controller.getLastAction();
  });

  ipcMain.handle('control:history', (event, limit) => {
    return controller.getActionHistory(limit);
  });

  ipcMain.handle('control:safetyMode', (event, enabled) => {
    return controller.setSafetyMode(enabled);
  });

  ipcMain.handle('control:pause', () => {
    return controller.pause();
  });

  ipcMain.handle('control:resume', () => {
    return controller.resume();
  });

  ipcMain.handle('control:stop', () => {
    return controller.stop();
  });

  return controller;
}
