import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';

export class APIServer {
  constructor(config = {}) {
    this.port = config.port || 3000;
    this.host = config.host || 'localhost';
    this.app = express();
    this.server = null;
    this.io = null;
    this.wss = null;
    this.routes = new Map();
    this.middleware = [];
    this.socketConnections = new Set();
  }

  async initialize(screenCapture, aiRecognition, desktopController, pipeline) {
    this.screenCapture = screenCapture;
    this.aiRecognition = aiRecognition;
    this.desktopController = desktopController;
    this.pipeline = pipeline;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupWebSocket();
    
    return this;
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });

    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        services: {
          screenCapture: !!this.screenCapture,
          aiRecognition: !!this.aiRecognition,
          desktopController: !!this.desktopController
        }
      });
    });

    this.app.get('/api/screens', async (req, res) => {
      try {
        const sources = await this.screenCapture.getDisplaySources();
        const displays = this.screenCapture.getDisplays();
        
        res.json({
          sources,
          displays
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/capture', async (req, res) => {
      try {
        const { sourceId, region } = req.body;
        
        let captureData;
        if (region) {
          captureData = await this.screenCapture.captureRegion(
            region.x,
            region.y,
            region.width,
            region.height
          );
        } else {
          captureData = await this.screenCapture.captureFullScreen(sourceId);
        }
        
        res.json(captureData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/capture/save', async (req, res) => {
      try {
        const { filename } = req.body;
        const saveResult = await this.screenCapture.saveCapture(filename);
        res.json(saveResult);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/analyze', async (req, res) => {
      try {
        const { prompt, detail } = req.body;
        
        const captureData = this.screenCapture.getLastCapture();
        if (!captureData) {
          return res.status(400).json({ error: '没有可用的截图，请先捕获屏幕' });
        }

        const analysis = await this.aiRecognition.analyzeScreen(captureData, {
          prompt,
          detail
        });

        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/locate', async (req, res) => {
      try {
        const { description } = req.body;
        
        const captureData = this.screenCapture.getLastCapture();
        if (!captureData) {
          return res.status(400).json({ error: '没有可用的截图，请先捕获屏幕' });
        }

        const location = await this.aiRecognition.locateElement(captureData, description);
        res.json(location);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/task', async (req, res) => {
      try {
        const { task } = req.body;
        
        const captureData = this.screenCapture.getLastCapture();
        if (!captureData) {
          return res.status(400).json({ error: '没有可用的截图，请先捕获屏幕' });
        }

        this.pipeline.setContext('captureData', captureData);
        
        const result = await this.pipeline.execute(task, {
          visionEnabled: true,
          planningEnabled: true,
          executionEnabled: false,
          verificationEnabled: true
        });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/execute', async (req, res) => {
      try {
        const { action, params } = req.body;
        
        let result;
        switch (action) {
          case 'click':
            result = await this.desktopController.click(
              params.x,
              params.y,
              params.button,
              params.clicks
            );
            break;
          case 'move':
            result = await this.desktopController.moveMouse(params.x, params.y, params.smooth);
            break;
          case 'type':
            result = await this.desktopController.typeText(params.text, params.delay);
            break;
          case 'scroll':
            result = await this.desktopController.scroll(params.clicks, params.direction);
            break;
          case 'drag':
            result = await this.desktopController.drag(
              params.startX,
              params.startY,
              params.endX,
              params.endY,
              params.duration
            );
            break;
          case 'keyPress':
            result = await this.desktopController.pressKey(params.key, params.modifiers);
            break;
          case 'hotkey':
            result = await this.desktopController.hotkey(...params.keys);
            break;
          default:
            return res.status(400).json({ error: `未知的动作: ${action}` });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/position', (req, res) => {
      try {
        const position = this.desktopController.getMousePosition();
        const screenSize = this.desktopController.getScreenSize();
        
        res.json({
          position,
          screenSize
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/history', (req, res) => {
      try {
        const { limit } = req.query;
        const history = this.desktopController.getActionHistory(parseInt(limit) || 100);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/config', (req, res) => {
      try {
        const { safetyMode, speed } = req.body;
        
        if (typeof safetyMode === 'boolean') {
          this.desktopController.setSafetyMode(safetyMode);
        }
        
        if (typeof speed === 'number') {
          this.desktopController.speed = speed;
        }

        res.json({
          safetyMode: this.desktopController.safetyMode,
          speed: this.desktopController.speed
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/capture/last', (req, res) => {
      try {
        const lastCapture = this.screenCapture.getLastCapture();
        if (!lastCapture) {
          return res.status(404).json({ error: '没有可用的截图' });
        }
        res.json(lastCapture);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketIO() {
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Socket.IO 客户端连接: ${socket.id}`);
      this.socketConnections.add(socket);

      socket.on('capture:subscribe', () => {
        console.log(`客户端订阅截图更新: ${socket.id}`);
        socket.join('capture-updates');
      });

      socket.on('capture:unsubscribe', () => {
        socket.leave('capture-updates');
      });

      socket.on('task:submit', async (data) => {
        try {
          const { task } = data;
          
          const captureData = this.screenCapture.getLastCapture();
          if (!captureData) {
            socket.emit('task:error', { error: '没有可用的截图' });
            return;
          }

          socket.emit('task:started', { task });

          this.pipeline.setContext('captureData', captureData);
          
          this.pipeline.on('phase:start', (data) => {
            socket.emit('task:phase', data);
          });

          this.pipeline.on('phase:complete', (data) => {
            socket.emit('task:phase-complete', data);
          });

          const result = await this.pipeline.execute(task);

          socket.emit('task:complete', result);
        } catch (error) {
          socket.emit('task:error', { error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket.IO 客户端断开: ${socket.id}`);
        this.socketConnections.delete(socket);
      });
    });

    if (this.screenCapture) {
      this.screenCapture.onCapture((captureData) => {
        this.io.to('capture-updates').emit('capture:update', {
          timestamp: captureData.timestamp,
          display: captureData.display
        });
      });
    }
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws) => {
      console.log('WebSocket 客户端连接');

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'capture':
              const captureData = await this.screenCapture.captureFullScreen();
              ws.send(JSON.stringify({
                type: 'capture',
                data: captureData
              }));
              break;

            case 'locate':
              const location = await this.aiRecognition.locateElement(
                this.screenCapture.getLastCapture(),
                data.description
              );
              ws.send(JSON.stringify({
                type: 'location',
                data: location
              }));
              break;

            case 'execute':
              const action = data.action;
              const result = await this.executeAction(action, data.params);
              ws.send(JSON.stringify({
                type: 'action-result',
                data: result
              }));
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket 客户端断开');
      });
    });
  }

  async executeAction(action, params) {
    switch (action) {
      case 'click':
        return await this.desktopController.click(
          params.x,
          params.y,
          params.button,
          params.clicks
        );
      case 'move':
        return await this.desktopController.moveMouse(params.x, params.y, params.smooth);
      case 'type':
        return await this.desktopController.typeText(params.text, params.delay);
      case 'scroll':
        return await this.desktopController.scroll(params.clicks, params.direction);
      default:
        throw new Error(`未知的动作: ${action}`);
    }
  }

  async start() {
    return new Promise((resolve) => {
      this.server = createServer(this.app);
      
      this.server.listen(this.port, this.host, () => {
        console.log(`API 服务器已启动: http://${this.host}:${this.port}`);
        console.log(`WebSocket 服务器已启动: ws://${this.host}:${this.port}/ws`);
        console.log(`Socket.IO 服务器已启动: http://${this.host}:${this.port}`);
        
        resolve({
          host: this.host,
          port: this.port,
          server: this.server
        });
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      
      if (this.io) {
        this.io.close();
      }
      
      if (this.server) {
        this.server.close(() => {
          console.log('API 服务器已停止');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getConnectionCount() {
    return {
      socketIO: this.socketConnections.size,
      websocket: this.wss ? this.wss.clients.size : 0
    };
  }
}
