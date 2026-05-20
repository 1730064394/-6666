# Kali Command Center

🔥 **Kali Command Center** - 智能化Kali工具管理与远程执行平台

## 项目简介

Kali Command Center 是一个基于Web的Kali Linux工具管理界面，专为VMware环境设计。它能够自动检测系统中已安装的Kali工具，并提供详细的使用指南，让用户可以通过浏览器远程执行Kali工具，同时实时查看命令输出结果。

### 核心特性

✅ **自动工具检测** - 首次运行时自动扫描并识别系统中已安装的Kali工具  
✅ **详细使用指南** - 为每个工具提供完整的使用说明、示例和使用技巧  
✅ **实时命令执行** - 通过浏览器执行命令，实时显示输出结果  
✅ **傻瓜式操作** - 点击工具即可查看详细使用说明，一键执行  
✅ **命令历史记录** - 自动保存历史命令，方便重复使用  
✅ **分类工具管理** - 按功能分类组织工具，易于查找  

## 系统要求

- Kali Linux (推荐)
- Python 3.7+
- Flask Web框架
- VMware或虚拟机环境（可选）

## 快速开始

### 1. 安装依赖

```bash
cd /workspace/kali-command-center
pip3 install -r requirements.txt
```

### 2. 启动服务

```bash
# 方式一：使用启动脚本
./start.sh

# 方式二：直接运行
python3 app.py
```

### 3. 访问界面

服务启动后，在浏览器中访问：

- **Kali本机**: http://localhost:5000
- **VMware宿主机**: http://192.168.x.x:5000
- **其他设备**: http://<kali-ip>:5000

## 使用指南

### 界面布局

```
┌─────────────────────────────────────────────────────────┐
│  🐉 Kali Command Center                                │
├──────────────┬──────────────────────────────────────────┤
│ 🔍 搜索工具   │                                          │
├──────────────┤  🔥 Kali Command Center 已启动            │
│              │  ⚡ 正在检测已安装的工具...                 │
│ ⚡ 工具列表   │                                          │
│              │  $ nmap -sV 192.168.1.1                  │
│ 🔍 信息收集   │  Starting Nmap...                        │
│  ├ Nmap     │                                          │
│  └ NetDisc  │                                          │
│              │  $ _                                     │
│ 🌐 Web应用   │                                          │
│  ├ SQLMap   │  ┌─────────────────────────────────────┐  │
│  └ Gobuster │  │ 📝 Nmap 使用指南                    │  │
│              │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│ 🔐 密码攻击   │  │ 💻 基本用法                        │  │
│  ├ Hydra    │  │ nmap [扫描类型] [选项] {目标}        │  │
│  └ John     │  │                                     │  │
│              │  │ 📋 使用示例                        │  │
│ ...         │  │ ▶ nmap -sV 192.168.1.1            │  │
│              │  │ ▶ nmap -sC -sV -p- 192.168.1.1    │  │
│              │  └─────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────┘
```

### 主要功能

#### 1. 自动工具检测

系统启动时自动检测已安装的工具，包括：

- 🔍 **Information Gathering** - 信息收集 (Nmap, Netdiscover等)
- 🌐 **Web Application Analysis** - Web应用分析 (SQLMap, Gobuster等)
- 🔐 **Password Attacks** - 密码攻击 (Hydra, John等)
- ⚠️ **Vulnerability Analysis** - 漏洞分析 (Nikto等)
- 💀 **Exploitation Tools** - 漏洞利用 (Metasploit等)
- 👂 **Sniffing & Spoofing** - 嗅探与欺骗 (Wireshark等)
- 📶 **Wireless Attacks** - 无线攻击 (Aircrack-ng等)
- 🎯 **Post Exploitation** - 后渗透 (Mimikatz等)
- 🔬 **Forensics** - 数字取证 (Autopsy等)
- 🔧 **Reverse Engineering** - 逆向工程 (Radare2等)
- ⚙️ **System Utilities** - 系统工具 (Netcat, Curl等)

#### 2. 查看工具详情

点击任意工具，系统会显示：

- 📝 **工具简介** - 工具的功能描述
- 💻 **基本用法** - 标准命令格式
- 📋 **使用示例** - 实际使用命令和说明
- 💡 **使用技巧** - 专业用户的经验分享
- 🔧 **常用选项** - 命令行参数说明

#### 3. 执行命令

**方式一：直接输入**
- 在底部命令输入框中输入命令
- 按 `Enter` 或点击 "执行" 按钮

**方式二：使用工具**
- 点击左侧工具
- 查看使用说明
- 点击 "使用此命令" 或 "执行" 按钮

#### 4. 键盘快捷键

- `Enter` - 执行命令
- `↑ / ↓` - 浏览历史命令
- `Tab` - 显示当前工具帮助
- `Ctrl + L` - 清空终端

### API接口

#### 获取已安装的工具列表

```bash
GET /tools
```

#### 获取工具详细信息

```bash
GET /tools/<tool_key>
```

#### 搜索工具

```bash
GET /tools/search?q=<关键词>
```

#### 执行命令

```bash
POST /execute
Content-Type: application/json

{
  "command": "nmap -sV 192.168.1.1"
}
```

#### 获取命令历史

```bash
GET /history
```

### 工具使用示例

#### Nmap - 网络扫描

```bash
# 基本端口扫描
nmap 192.168.1.1

# 版本检测
nmap -sV 192.168.1.1

# 完整扫描
nmap -sC -sV -p- 192.168.1.1

# 操作系统检测
nmap -O 192.168.1.1

# 漏洞扫描
nmap --script vuln 192.168.1.1
```

#### SQLMap - SQL注入

```bash
# 检测SQL注入
sqlmap -u "http://target.com/?id=1"

# 获取数据库
sqlmap -u "http://target.com/?id=1" --dbs

# 获取表
sqlmap -u "http://target.com/?id=1" -D dbname --tables

# 获取Shell
sqlmap -u "http://target.com/?id=1" --os-shell
```

#### Hydra - 暴力破解

```bash
# SSH暴力破解
hydra -l admin -P passwords.txt ssh://192.168.1.1

# Web表单破解
hydra -L users.txt -P passwords.txt http-post-form://target.com/login

# FTP破解
hydra -l root -P passwords.txt ftp://192.168.1.1
```

#### Gobuster - 目录扫描

```bash
# 目录扫描
gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt

# DNS子域名枚举
gobuster dns -d target.com -w /usr/share/wordlists/subdomains.txt

# VHost扫描
gobuster vhost -u http://target.com -w subdomains.txt
```

## 项目结构

```
kali-command-center/
├── app.py                      # Flask后端主程序
├── kali_tools_detector.py       # 工具检测模块
├── requirements.txt             # Python依赖
├── start.sh                    # 启动脚本
├── README.md                   # 说明文档
└── templates/
    └── index.html              # Web前端界面
```

## 扩展工具库

### 添加新工具

编辑 `kali_tools_detector.py` 中的 `TOOLS_DATABASE` 字典：

```python
'Your Category': {
    'description': '分类描述',
    'icon': '🔧',
    'tools': {
        'tool_name': {
            'name': '工具显示名称',
            'command': '基本命令',
            'description': '工具描述',
            'usage': '使用方法',
            'examples': [
                {'cmd': '示例命令', 'desc': '说明'},
            ],
            'tips': ['使用技巧'],
            'common_options': {
                '-flag': '选项说明',
            }
        }
    }
}
```

### 自定义工具检测

工具检测会自动检查 `which` 命令是否成功，只需确保工具已安装并位于PATH中即可。

## 注意事项

⚠️ **安全警告**

- 仅在合法授权的情况下使用
- 遵守当地法律法规
- 禁止未授权的网络扫描和渗透测试

## 故障排除

### 服务无法启动

```bash
# 检查端口占用
netstat -tulnp | grep 5000

# 杀死占用进程
kill -9 <PID>
```

### 工具检测失败

```bash
# 手动检测工具
which nmap
which sqlmap
which hydra

# 安装缺失工具
apt-get update
apt-get install nmap sqlmap hydra
```

### Web界面无法访问

```bash
# 检查防火墙
iptables -L

# 开放端口（如果需要）
iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
```

## 技术栈

- **后端**: Python 3, Flask
- **前端**: HTML5, CSS3, JavaScript
- **通信**: Server-Sent Events (SSE), JSON
- **命令执行**: subprocess, bash

## 版本历史

### v1.0.0 (2024)
- ✅ 自动工具检测
- ✅ 详细使用指南
- ✅ 实时命令执行
- ✅ 命令历史记录
- ✅ 工具搜索功能
- ✅ 响应式界面设计

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请通过GitHub Issues联系我们。

---

**Made with ❤️ for Kali Linux users**
