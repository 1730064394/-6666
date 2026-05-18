import { EventEmitter } from 'events';

export class MultiAIPipeline extends EventEmitter {
  constructor(config = {}) {
    super();
    this.aiModules = config.aiModules || {};
    this.pipelineSteps = [];
    this.executionContext = {};
    this.maxIterations = config.maxIterations || 5;
    this.confidenceThreshold = config.confidenceThreshold || 0.7;
    this.results = {};
  }

  registerAIModule(name, module) {
    this.aiModules[name] = module;
    this.emit('module:registered', { name, module });
  }

  async execute(task, options = {}) {
    const {
      visionEnabled = true,
      planningEnabled = true,
      executionEnabled = true,
      verificationEnabled = true,
      maxRetries = 3
    } = options;

    this.executionContext = {
      task,
      startTime: Date.now(),
      attempts: 0,
      currentStep: 0,
      history: []
    };

    let success = false;
    let retryCount = 0;

    while (!success && retryCount < maxRetries) {
      try {
        this.executionContext.attempts++;
        
        if (planningEnabled) {
          await this.planningPhase();
        }

        if (visionEnabled) {
          await this.visionAnalysisPhase();
        }

        if (executionEnabled) {
          await this.executionPhase();
        }

        if (verificationEnabled) {
          success = await this.verificationPhase();
        } else {
          success = true;
        }

        if (!success && retryCount < maxRetries - 1) {
          await this.adaptiveRetry();
          retryCount++;
        }
      } catch (error) {
        this.executionContext.error = error;
        this.emit('pipeline:error', { error, context: this.executionContext });
        
        if (retryCount >= maxRetries - 1) {
          throw error;
        }
        retryCount++;
      }
    }

    this.executionContext.endTime = Date.now();
    this.executionContext.success = success;

    this.emit('pipeline:complete', {
      success,
      context: this.executionContext,
      results: this.results
    });

    return {
      success,
      context: this.executionContext,
      results: this.results
    };
  }

  async planningPhase() {
    this.emit('phase:start', { phase: 'planning' });

    const planner = this.aiModules.planner;
    if (!planner) {
      console.warn('未找到规划器模块');
      return;
    }

    const captureData = this.executionContext.captureData;
    const task = this.executionContext.task;

    const plan = await planner.createPlan(captureData, task);

    this.executionContext.plan = plan;
    this.executionContext.currentStep = 0;
    this.pipelineSteps.push({
      phase: 'planning',
      result: plan,
      timestamp: Date.now()
    });

    this.emit('phase:complete', { phase: 'planning', result: plan });
    return plan;
  }

  async visionAnalysisPhase() {
    this.emit('phase:start', { phase: 'vision' });

    const visionAI = this.aiModules.vision;
    if (!visionAI) {
      console.warn('未找到视觉AI模块');
      return;
    }

    const captureData = this.executionContext.captureData;
    const analysis = await visionAI.analyzeScreen(captureData);

    this.executionContext.screenAnalysis = analysis;
    this.results.visionAnalysis = analysis;
    this.pipelineSteps.push({
      phase: 'vision',
      result: analysis,
      timestamp: Date.now()
    });

    this.emit('phase:complete', { phase: 'vision', result: analysis });
    return analysis;
  }

  async executionPhase() {
    this.emit('phase:start', { phase: 'execution' });

    const plan = this.executionContext.plan;
    const executor = this.aiModules.executor;
    const visionAI = this.aiModules.vision;

    if (!plan || !executor) {
      console.warn('缺少执行计划或执行器');
      return;
    }

    const executionResults = [];

    for (let i = 0; i < plan.steps.length; i++) {
      this.executionContext.currentStep = i;
      const step = plan.steps[i];

      let stepResult = { step: i + 1, action: step.action, status: 'pending' };

      if (step.location) {
        const location = await visionAI.locateElement(
          this.executionContext.captureData,
          step.target
        );

        if (location.found) {
          step.location = { ...step.location, ...location };
        }
      }

      const executionResult = await executor.executeStep(step);

      stepResult = {
        ...stepResult,
        ...executionResult,
        status: executionResult.success ? 'completed' : 'failed'
      };

      executionResults.push(stepResult);
      this.executionContext.history.push(stepResult);

      if (!executionResult.success && step.critical) {
        this.emit('execution:critical_failure', { step: i, stepResult });
        break;
      }

      if (step.waitForNextCapture) {
        await this.waitForNewCapture();
      }
    }

    this.results.execution = {
      steps: executionResults,
      completedSteps: executionResults.filter(s => s.status === 'completed').length,
      failedSteps: executionResults.filter(s => s.status === 'failed').length
    };

    this.pipelineSteps.push({
      phase: 'execution',
      result: this.results.execution,
      timestamp: Date.now()
    });

    this.emit('phase:complete', { phase: 'execution', result: this.results.execution });
    return this.results.execution;
  }

  async verificationPhase() {
    this.emit('phase:start', { phase: 'verification' });

    const verifier = this.aiModules.verifier;
    const visionAI = this.aiModules.vision;

    if (!verifier) {
      console.warn('未找到验证器模块');
      return true;
    }

    const captureData = this.executionContext.captureData;
    const expectedOutcome = this.executionContext.plan?.expectedOutcome;

    const verification = await verifier.verify(captureData, expectedOutcome);

    this.results.verification = verification;
    this.pipelineSteps.push({
      phase: 'verification',
      result: verification,
      timestamp: Date.now()
    });

    this.emit('phase:complete', { phase: 'verification', result: verification });

    const success = verification.confidence >= this.confidenceThreshold;
    return success;
  }

  async adaptiveRetry() {
    this.emit('retry:start', { attempt: this.executionContext.attempts });

    const verifier = this.aiModules.verifier;
    const planner = this.aiModules.planner;

    if (verifier && planner) {
      const lastCapture = this.executionContext.captureData;
      const failureReason = this.results.verification?.observed || '未知原因';

      const adaptation = await planner.suggestAdaptation(
        lastCapture,
        failureReason,
        this.executionContext.history
      );

      this.executionContext.adaptation = adaptation;

      if (adaptation.newPlan) {
        this.executionContext.plan = adaptation.newPlan;
      }
    }

    await this.delay(1000);
  }

  async waitForNewCapture() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.removeListener('capture:update', handler);
        resolve(null);
      }, 5000);

      const handler = (captureData) => {
        clearTimeout(timeout);
        this.executionContext.captureData = captureData;
        resolve(captureData);
      };

      this.once('capture:update', handler);
    });
  }

  setContext(key, value) {
    this.executionContext[key] = value;
  }

  getContext() {
    return { ...this.executionContext };
  }

  getResults() {
    return { ...this.results };
  }

  getPipelineSteps() {
    return [...this.pipelineSteps];
  }

  reset() {
    this.executionContext = {};
    this.results = {};
    this.pipelineSteps = [];
    this.removeAllListeners();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class VisionAnalyzer {
  constructor(aiRecognition) {
    this.ai = aiRecognition;
  }

  async analyzeScreen(captureData, options = {}) {
    return await this.ai.analyzeScreen(captureData, options);
  }

  async locateElement(captureData, description) {
    return await this.ai.locateElement(captureData, description);
  }
}

export class PlannerAgent {
  constructor(aiRecognition) {
    this.ai = aiRecognition;
  }

  async createPlan(captureData, task) {
    return await this.ai.understandTask(captureData, task);
  }

  async suggestAdaptation(captureData, failureReason, history) {
    const prompt = `分析以下执行失败的情况，并提出改进建议：

失败原因: "${failureReason}"

执行历史:
${JSON.stringify(history, null, 2)}

请返回JSON格式的适应建议：
{
  "newPlan": { /* 新的执行计划，如果有的话 */ },
  "alternativeApproach": "替代方案描述",
  "shouldRetry": true/false
}`;

    try {
      const response = await this.ai.client.chat.completions.create({
        model: this.ai.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      });

      const resultText = response.choices[0].message.content.trim();
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('适应建议生成失败:', error);
    }

    return { shouldRetry: true };
  }
}

export class ExecutionAgent {
  constructor(controller) {
    this.controller = controller;
  }

  async executeStep(step) {
    try {
      switch (step.action) {
        case 'click':
          return await this.executeClick(step);
        
        case 'type':
          return await this.executeType(step);
        
        case 'scroll':
          return await this.executeScroll(step);
        
        case 'drag':
          return await this.executeDrag(step);
        
        case 'wait':
          return await this.executeWait(step);
        
        default:
          return { success: false, error: `未知的动作类型: ${step.action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeClick(step) {
    const { x, y, button = 'left', double = false } = step.location || step;
    
    if (double) {
      await this.controller.doubleClick(x, y, button);
    } else {
      await this.controller.click(x, y, button);
    }

    return { success: true, action: 'click', location: { x, y } };
  }

  async executeType(step) {
    const { text, delay = 50 } = step;
    await this.controller.typeText(text, delay);
    return { success: true, action: 'type', text };
  }

  async executeScroll(step) {
    const { clicks = 3, direction = 'down' } = step;
    await this.controller.scroll(clicks, direction);
    return { success: true, action: 'scroll', clicks, direction };
  }

  async executeDrag(step) {
    const { startX, startY, endX, endY, duration = 500 } = step;
    await this.controller.drag(startX, startY, endX, endY, duration);
    return { success: true, action: 'drag', from: { startX, startY }, to: { endX, endY } };
  }

  async executeWait(step) {
    const { duration = 1000 } = step;
    await this.controller.delay(duration);
    return { success: true, action: 'wait', duration };
  }
}

export class VerificationAgent {
  constructor(aiRecognition) {
    this.ai = aiRecognition;
  }

  async verify(captureData, expectedOutcome) {
    return await this.ai.verifyAction(captureData, expectedOutcome);
  }
}
