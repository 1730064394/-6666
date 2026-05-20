# Kali Command Center - 使用指南

## 概述

Kali Command Center 是一个强大的Web界面，允许你从任何系统远程访问和管理你的Kali Linux工具。它会自动检测已安装的Kali工具，提供详细的使用说明，并允许你实时执行命令。

---

## 快速开始

### 1. 在Kali Linux中启动服务

```bash
cd /workspace/kali-command-center
python3 app.py
```

或者使用启动脚本：
```bash
cd /workspace/kali-command-center
./start.sh
```

### 2. 从其他系统访问

服务启动后，你可以通过以下地址访问：

| 访问方式 | URL | 说明 |
|---------|-----|------|
| Kali本机 | http://127.0.0.1:5000 | 在Kali内部访问 |
| VMware宿主机 | http://<Kali_IP>:5000 | 替换为Kali的实际IP地址 |
| 局域网其他设备 | http://<Kali_IP>:5000 | 需要网络连通 |

启动时，终端会显示所有可用的访问地址。

---

## 网络配置（重要！）

### 1. 确认Kali Linux的IP地址

在Kali终端中执行：

```bash
ip addr show
# 或
ifconfig
```

找到你的网络接口（通常是 eth0 或 ens33），记录IP地址（例如：192.168.1.100）。

### 2. 配置VMware网络（如果需要）

如果你在VMware中运行Kali：

- **NAT模式**：宿主机可以访问Kali，但局域网其他设备可能无法访问
- **桥接模式**：局域网所有设备都可以访问Kali（推荐）

### 3. 配置防火墙（如果需要）

如果无法访问，可能需要开放5000端口：

```bash
# 开放5000端口
ufw allow 5000

# 或者使用iptables
iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
```

---

## 功能说明

### 1. 自动工具检测

系统会自动扫描Kali已安装的工具，包括：
- 信息收集工具（Nmap, Netdiscover等）
- Web应用分析工具（SQLMap, Gobuster等）
- 密码攻击工具（Hydra, John等）
- 无线攻击工具（Aircrack-ng等）
- 漏洞利用工具（Metasploit等）
- 系统工具

### 2. 详细使用指南

每个工具都包含：
- 📝 工具简介
- 💻 基本用法
- 📋 具体使用示例
- 💡 使用技巧
- 🔧 常用命令选项

### 3. 实时命令执行

- 在终端输入框直接输入命令
- 从工具列表选择工具并使用示例
- 实时显示命令执行结果
- 命令历史记录
- 支持搜索工具

---

## 界面说明

### 左侧工具栏
- 搜索框：快速搜索工具
- 工具分类：按功能分类显示
- 工具列表：点击查看详情

### 主终端区域
- 命令输出显示区
- 命令输入框
- 执行、清除按钮

### 右侧历史记录
- 查看历史命令
- 点击重复使用

### 底部工具详情
- 工具使用说明
- 示例命令
- 一键执行示例

---

## 使用示例

### 示例1: 使用Nmap扫描

1. 在左侧工具栏找到 `Information Gathering`
2. 点击 `Nmap`
3. 在工具详情中选择示例：`nmap -sV 192.168.1.1`
4. 点击执行
5. 查看实时扫描结果

### 示例2: 使用SQLMap测试注入

1. 在左侧工具栏找到 `Web Application Analysis`
2. 点击 `SQLMap`
3. 查看使用示例
4. 复制命令到输入框，修改目标URL
5. 执行并查看结果

### 示例3: 使用Hydra暴力破解

1. 在左侧工具栏找到 `Password Attacks`
2. 点击 `Hydra`
3. 选择合适的示例
4. 配置用户名、密码列表、目标
5. 执行攻击

---

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Enter | 执行命令 |
| ↑ | 上一条历史命令 |
| ↓ | 下一条历史命令 |
| Tab | 显示当前工具帮助 |
| Ctrl+L | 清空终端 |

---

## API接口

### 获取工具列表
```
GET /tools
```

### 获取工具详情
```
GET /tools/<tool_name>
```

### 搜索工具
```
GET /tools/search?q=<keyword>
```

### 执行命令
```
POST /execute
Content-Type: application/json
{
  "command": "nmap -sV 192.168.1.1"
}
```

### 获取命令历史
```
GET /history
```

---

## 安全警告

⚠️ **重要安全提醒**：

1. 仅在授权范围内使用！
2. 不要在生产环境中直接暴露服务！
3. 建议在安全隔离的网络中使用！
4. 使用后请及时关闭服务！
5. 遵守当地法律法规！

---

## 故障排除

### 问题1: 无法从其他系统访问

**可能原因**：防火墙阻止了连接

**解决方案**：
```bash
# 检查防火墙状态
ufw status

# 开放5000端口
ufw allow 5000
```

### 问题2: 工具检测不到

**可能原因**：工具未安装

**解决方案**：
```bash
# 安装缺失的工具
apt install nmap
apt install sqlmap
# ... 等等
```

### 问题3: 命令执行没有输出

**可能原因**：命令需要很长时间运行，或者需要交互输入

**解决方案**：检查命令是否正确，或者使用非交互式版本

---

## 扩展功能

### 添加自定义工具

编辑 `/workspace/kali-command-center/kali_tools_detector.py` 中的 `TOOLS_DATABASE` 字典，按照现有格式添加。

### 修改端口

在 `app.py` 中修改 `port = 5000` 为你想要的端口号。

---

## 支持的工具分类

- 🔍 信息收集（Information Gathering）
- 🌐 Web应用分析（Web Application Analysis）
- 🔐 密码攻击（Password Attacks）
- 📶 无线攻击（Wireless Attacks）
- 💀 漏洞利用（Exploitation Tools）
- 👂 嗅探与欺骗（Sniffing & Spoofing）
- 🎯 后渗透（Post Exploitation）
- 🔬 取证（Forensics）
- 🔧 逆向工程（Reverse Engineering）
- ⚙️ 系统工具（System Utilities）
- 🛠️ 其他工具（Additional Tools）

---

## 更新日志

### v1.1.0
- ✅ 自动工具检测
- ✅ 详细使用指南
- ✅ 外部网络访问支持
- ✅ 更多工具覆盖
- ✅ 搜索功能
- ✅ 历史记录

---

## 联系与支持

如有问题或建议，欢迎反馈！

---

**祝使用愉快！** 🚀
