import { Configuration, OpenAIApi } from 'openai';

export class AIRecognition {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'gpt-4o';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.client = null;
    this.visionCache = new Map();
    this.lastAnalysis = null;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('警告: 未配置 OpenAI API Key，部分功能将不可用');
      return false;
    }

    try {
      const configuration = new Configuration({
        apiKey: this.apiKey,
        basePath: this.baseURL
      });
      
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL
      });
      
      console.log('AI 识别模块初始化成功');
      return true;
    } catch (error) {
      console.error('AI 初始化失败:', error);
      return false;
    }
  }

  async analyzeScreen(captureData, options = {}) {
    if (!this.client) {
      throw new Error('AI 客户端未初始化');
    }

    const { prompt, detail = 'high' } = options;
    
    const basePrompt = prompt || '详细描述这张截图的内容，包括：\n1. 桌面上有哪些窗口和应用程序\n2. 界面的主要布局和元素\n3. 用户正在进行的操作（如果可见）\n4. 任何值得注意的信息或警示';

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: basePrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: captureData.dataURL,
                  detail: detail
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const analysis = {
        description: response.choices[0].message.content,
        timestamp: Date.now(),
        tokens: response.usage?.total_tokens || 0,
        model: this.model
      };

      this.lastAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('屏幕分析失败:', error);
      throw error;
    }
  }

  async locateElement(captureData, description) {
    if (!this.client) {
      throw new Error('AI 客户端未初始化');
    }

    const prompt = `你是一个专业的UI元素定位助手。请分析这张截图，找到用户描述的元素或位置。

用户描述: "${description}"

请仔细观察截图，并返回JSON格式的定位结果：
{
  "found": true/false,
  "location": {
    "x": 元素中心点X坐标（百分比，0-100）,
    "y": 元素中心点Y坐标（百分比，0-100）,
    "width": 元素宽度（百分比，0-100）,
    "height": 元素高度（百分比，0-100）
  },
  "confidence": 置信度（0-1）,
  "description": "对该元素的详细描述",
  "elementType": "元素类型：button/window/icon/text/area等",
  "suggestedAction": "建议的动作：click/hover/input等"
}

请只返回JSON，不要有其他文字。`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: captureData.dataURL,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const resultText = response.choices[0].message.content.trim();
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return {
          found: false,
          error: '无法解析定位结果'
        };
      }

      const result = JSON.parse(jsonMatch[0]);
      
      const display = captureData.display?.size || { width: 1920, height: 1080 };
      
      if (result.found && result.location) {
        result.location = {
          x: Math.round((result.location.x / 100) * display.width),
          y: Math.round((result.location.y / 100) * display.height),
          width: Math.round((result.location.width / 100) * display.width),
          height: Math.round((result.location.height / 100) * display.height)
        };
      }

      return {
        ...result,
        rawResponse: resultText,
        displaySize: display
      };
    } catch (error) {
      console.error('元素定位失败:', error);
      throw error;
    }
  }

  async understandTask(captureData, userRequest) {
    if (!this.client) {
      throw new Error('AI 客户端未初始化');
    }

    const prompt = `你是一个智能桌面助手。请分析当前屏幕状态和用户的任务请求，帮助规划执行步骤。

用户请求: "${userRequest}"

当前屏幕: [已提供截图]

请分析并返回JSON格式的任务规划：
{
  "taskType": "任务类型：navigation/creation/editing/query/control等",
  "steps": [
    {
      "step": 1,
      "description": "步骤描述",
      "action": "动作类型：click/type/scroll/select等",
      "target": "目标描述",
      "confidence": 置信度（0-1）
    }
  ],
  "estimatedSteps": 预计总步骤数,
  "requiresConfirmation": 是否需要用户确认,
  "risks": ["潜在风险或注意事项"]
}

请只返回JSON，不要有其他文字。`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: captureData.dataURL,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const resultText = response.choices[0].message.content.trim();
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('无法解析任务规划结果');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('任务理解失败:', error);
      throw error;
    }
  }

  async verifyAction(captureData, expectedChange) {
    if (!this.client) {
      throw new Error('AI 客户端未初始化');
    }

    const prompt = `请验证以下操作是否成功执行：

预期变化: "${expectedChange}"

请分析截图，判断操作是否成功，并返回JSON：
{
  "success": true/false,
  "observed": "实际观察到的变化",
  "confidence": 置信度（0-1）,
  "suggestion": "如果失败，建议的下一步操作"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: captureData.dataURL,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.5
      });

      const resultText = response.choices[0].message.content.trim();
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return { success: false, error: '无法解析验证结果' };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('操作验证失败:', error);
      throw error;
    }
  }

  setAPIKey(apiKey) {
    this.apiKey = apiKey;
    return this.initialize();
  }

  getLastAnalysis() {
    return this.lastAnalysis;
  }
}
