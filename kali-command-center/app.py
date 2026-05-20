#!/usr/bin/env python3
"""
Kali Command Center - Web界面远程执行Kali工具
集成自动工具检测和详细使用指南
"""
import os
import sys
import json
import uuid
import subprocess
import threading
from datetime import datetime
from flask import Flask, render_template_string, request, Response, stream_with_context
from pathlib import Path

from kali_tools_detector import KaliToolDetector

app = Flask(__name__)

COMMANDS_HISTORY = []
TASKS = {}
TOOL_DETECTOR = KaliToolDetector()

class CommandTask:
    def __init__(self, task_id, command, shell=True):
        self.task_id = task_id
        self.command = command
        self.output = []
        self.status = 'running'
        self.start_time = datetime.now()
        self.process = None
        
    def run(self):
        try:
            self.process = subprocess.Popen(
                self.command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                executable='/bin/bash',
                cwd='/root'
            )
            
            for line in iter(self.process.stdout.readline, b''):
                if line:
                    decoded_line = line.decode('utf-8', errors='ignore')
                    self.output.append(decoded_line)
                    yield f"data: {json.dumps({'type': 'output', 'data': decoded_line})}\n\n"
            
            self.process.wait()
            self.status = 'completed'
            exit_code = self.process.returncode
            yield f"data: {json.dumps({'type': 'status', 'status': 'completed', 'exit_code': exit_code})}\n\n"
            
        except Exception as e:
            self.status = 'error'
            self.output.append(f"Error: {str(e)}\n")
            yield f"data: {json.dumps({'type': 'status', 'status': 'error', 'error': str(e)})}\n\n"

@app.route('/')
def index():
    """主界面"""
    with open('/workspace/kali-command-center/templates/index.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/execute', methods=['POST'])
def execute_command():
    """执行命令接口"""
    data = request.get_json()
    command = data.get('command', '').strip()
    
    if not command:
        return Response(json.dumps({'error': 'No command provided'}), 
                       mimetype='application/json', status=400)
    
    task_id = str(uuid.uuid4())
    task = CommandTask(task_id, command)
    TASKS[task_id] = task
    
    COMMANDS_HISTORY.append({
        'id': task_id,
        'command': command,
        'timestamp': datetime.now().isoformat(),
        'status': 'running'
    })
    
    def generate():
        for data in task.run():
            yield data
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

@app.route('/history', methods=['GET'])
def get_history():
    """获取命令历史"""
    return Response(
        json.dumps(COMMANDS_HISTORY[-50:]),
        mimetype='application/json'
    )

@app.route('/tools', methods=['GET'])
def get_tools():
    """获取已安装的工具列表（按分类）"""
    detected = TOOL_DETECTOR.detect_all_tools()
    return Response(json.dumps(detected), mimetype='application/json')

@app.route('/tools/database', methods=['GET'])
def get_tools_database():
    """获取完整工具数据库（所有工具，包括未安装的）"""
    database = TOOL_DETECTOR.get_tools_database()
    return Response(json.dumps(database), mimetype='application/json')

@app.route('/tools/detect', methods=['POST'])
def detect_tools():
    """手动触发工具检测"""
    detected = TOOL_DETECTOR.detect_all_tools()
    return Response(json.dumps({
        'status': 'success',
        'detected': detected
    }), mimetype='application/json')

@app.route('/tools/<tool_key>', methods=['GET'])
def get_tool_details(tool_key):
    """获取特定工具的详细信息"""
    all_tools = TOOL_DETECTOR.get_all_tools_flat()
    for tool in all_tools:
        if tool['key'] == tool_key:
            return Response(json.dumps(tool), mimetype='application/json')
    return Response(json.dumps({'error': 'Tool not found'}), 
                   mimetype='application/json', status=404)

@app.route('/tools/search', methods=['GET'])
def search_tools():
    """搜索工具"""
    keyword = request.args.get('q', '')
    if not keyword:
        return Response(json.dumps([]), mimetype='application/json')
    
    results = TOOL_DETECTOR.search_tools(keyword)
    return Response(json.dumps(results), mimetype='application/json')

@app.route('/task/<task_id>', methods=['GET'])
def get_task(task_id):
    """获取特定任务状态和输出"""
    task = TASKS.get(task_id)
    if not task:
        return Response(json.dumps({'error': 'Task not found'}), 
                       mimetype='application/json', status=404)
    
    return Response(
        json.dumps({
            'task_id': task.task_id,
            'status': task.status,
            'output': task.output,
            'start_time': task.start_time.isoformat()
        }),
        mimetype='application/json'
    )

@app.route('/stop/<task_id>', methods=['POST'])
def stop_task(task_id):
    """停止正在运行的任务"""
    task = TASKS.get(task_id)
    if not task:
        return Response(json.dumps({'error': 'Task not found'}), 
                       mimetype='application/json', status=404)
    
    if task.process:
        task.process.terminate()
        task.status = 'stopped'
        return Response(json.dumps({'status': 'stopped'}), 
                       mimetype='application/json')
    
    return Response(json.dumps({'error': 'No process to stop'}), 
                   mimetype='application/json', status=400)

def print_banner():
    """打印启动信息和检测到的工具"""
    print("\n" + "="*60)
    print("  🔥 Kali Command Center - Web管理界面")
    print("="*60)
    print("  ⚡ 实时命令执行 | 远程工具管理")
    print("="*60)
    
    print("\n[🔍] 正在检测已安装的Kali工具...")
    detected = TOOL_DETECTOR.detect_all_tools()
    
    total_tools = 0
    for category, data in detected.items():
        tool_count = len(data['tools'])
        total_tools += tool_count
        print(f"  {data['icon']} {category}: {tool_count} 个工具")
    
    print(f"\n  ✅ 共检测到 {total_tools} 个工具")

if __name__ == '__main__':
    print_banner()
    
    host = '0.0.0.0'
    port = 5000
    
    print(f"\n[📡] 服务启动中...")
    print(f"[🌐] 访问地址: http://<kali-ip>:{port}")
    print(f"[💻] 本机访问: http://localhost:{port}")
    print(f"\n[⏹]  按 Ctrl+C 停止服务\n")
    
    templates_dir = Path('/workspace/kali-command-center/templates')
    templates_dir.mkdir(exist_ok=True)
    
    app.run(
        host=host, 
        port=port, 
        debug=False,
        threaded=True,
        use_reloader=False
    )
