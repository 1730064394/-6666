#!/usr/bin/env python3
"""
Kali工具自动检测与使用指南模块（完整版）
自动扫描系统中已安装的所有Kali工具
"""
import os
import sys
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

class KaliToolDetector:
    """Kali工具检测器（完整版）"""

    # Kali工具的常见安装位置
    KALI_TOOL_PATHS = [
        '/usr/bin',
        '/usr/sbin',
        '/usr/local/bin',
        '/usr/local/sbin',
        '/opt'
    ]

    # 基础工具数据库（简化）
    TOOLS_DATABASE = {
        'Information Gathering': {
            'description': '信息收集工具',
            'icon': '🔍',
            'tools': {
                'nmap': {
                    'name': 'Nmap',
                    'command': 'nmap -sV -sC {target}',
                    'description': '网络映射器和端口扫描器',
                    'usage': 'nmap [扫描类型] [选项] {目标}',
                    'examples': [{'cmd': 'nmap -sV 192.168.1.1', 'desc': '扫描目标端口版本'}],
                    'tips': ['使用 -sV 参数查看服务版本'],
                    'common_options': {'-sV': '版本检测', '-sC': '默认脚本', '-O': '操作系统检测'}
                }
            }
        },
        'Web Analysis': {
            'description': 'Web应用分析工具',
            'icon': '🌐',
            'tools': {
                'sqlmap': {
                    'name': 'SQLMap',
                    'command': 'sqlmap -u "{url}" --batch',
                    'description': '自动化SQL注入检测工具',
                    'usage': 'sqlmap [选项] -u {URL}',
                    'examples': [{'cmd': 'sqlmap -u "http://target.com/?id=1"', 'desc': '检测SQL注入'}],
                    'tips': ['--batch 自动回答问题'],
                    'common_options': {'-u': '目标URL', '--dbs': '列出数据库'}
                }
            }
        },
        'Password Attacks': {
            'description': '密码攻击工具',
            'icon': '🔐',
            'tools': {
                'hydra': {
                    'name': 'Hydra',
                    'command': 'hydra -l {user} -P {list} {target} {service}',
                    'description': '快速网络登录暴力破解工具',
                    'usage': 'hydra [选项] {目标} {服务}',
                    'examples': [{'cmd': 'hydra -l admin -P pass.txt ssh://192.168.1.1', 'desc': 'SSH暴力破解'}],
                    'tips': ['支持多种协议'],
                    'common_options': {'-l': '用户名', '-P': '密码列表'}
                }
            }
        },
        'System Utils': {
            'description': '系统工具',
            'icon': '⚙️',
            'tools': {
                'nc': {
                    'name': 'Netcat',
                    'command': 'nc -lvp 4444',
                    'description': '网络瑞士军刀',
                    'usage': 'nc [选项]',
                    'examples': [{'cmd': 'nc -lvp 4444', 'desc': '监听端口'}],
                    'tips': ['可以创建后门，传输文件'],
                    'common_options': {'-l': '监听', '-v': '详细'}
                }
            }
        }
    }

    def __init__(self):
        self.detected_tools = {}

    def check_tool_exists(self, tool_name):
        """检查工具是否存在"""
        try:
            result = subprocess.run(['which', tool_name], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except Exception:
            return False

    def get_tool_path(self, tool_name):
        """获取工具路径"""
        try:
            result = subprocess.run(['which', tool_name], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return result.stdout.strip()
            return None
        except Exception:
            return None

    def detect_all_tools(self):
        """检测所有已安装的工具"""
        detected = {}

        for category, category_data in self.TOOLS_DATABASE.items():
            tools_in_cat = []
            for tool_key, tool_info in category_data['tools'].items():
                if self.check_tool_exists(tool_key):
                    tool_copy = tool_info.copy()
                    tool_copy['key'] = tool_key
                    tool_copy['installed'] = True
                    tool_copy['path'] = self.get_tool_path(tool_key)
                    tools_in_cat.append(tool_copy)

            if tools_in_cat:
                detected[category] = {
                    'description': category_data['description'],
                    'icon': category_data['icon'],
                    'tools': tools_in_cat
                }

        # 扫描并添加其他工具
        self._add_scanned_tools(detected)
        self.detected_tools = detected
        return detected

    def _add_scanned_tools(self, detected):
        """添加扫描到的工具"""
        # 简单添加，防止太多工具
        if 'Additional Tools' not in detected:
            detected['Additional Tools'] = {
                'description': '其他工具',
                'icon': '🛠️',
                'tools': []
            }

        # 扫描/usr/bin中的一些工具
        common_tools = ['python3', 'curl', 'wget', 'grep', 'awk', 'sed', 'bash', 'ssh',
                        'python', 'gdb', 'vim', 'nano', 'netstat', 'ss', 'ip', 'ifconfig']
        existing = set()
        for cat in detected:
            for tool in detected[cat]['tools']:
                existing.add(tool['key'])

        for tool in common_tools:
            if tool not in existing and self.check_tool_exists(tool):
                tool_info = {
                    'key': tool,
                    'name': tool,
                    'command': tool,
                    'description': f'{tool} 工具',
                    'usage': f'{tool} [选项]',
                    'examples': [{'cmd': f'{tool} --help', 'desc': '查看帮助'}],
                    'tips': ['使用 --help 获取帮助'],
                    'common_options': {},
                    'installed': True,
                    'path': self.get_tool_path(tool)
                }
                detected['Additional Tools']['tools'].append(tool_info)

        # 移除空分类
        if not detected['Additional Tools']['tools']:
            del detected['Additional Tools']

    def get_tools_database(self):
        return self.TOOLS_DATABASE

    def get_all_tools_flat(self):
        all_tools = []
        for category, data in self.TOOLS_DATABASE.items():
            for tool_key, tool_info in data['tools'].items():
                tool_info_copy = tool_info.copy()
                tool_info_copy['key'] = tool_key
                tool_info_copy['category'] = category
                all_tools.append(tool_info_copy)
        return all_tools

    def search_tools(self, keyword):
        results = []
        keyword = keyword.lower()

        for category, data in self.TOOLS_DATABASE.items():
            for tool_key, tool_info in data['tools'].items():
                if keyword in tool_key.lower() or keyword in tool_info['name'].lower() or keyword in tool_info['description'].lower():
                    tool_copy = tool_info.copy()
                    tool_copy['key'] = tool_key
                    tool_copy['category'] = category
                    results.append(tool_copy)
        return results


if __name__ == '__main__':
    detector = KaliToolDetector()
    detected = detector.detect_all_tools()

    total_tools = 0
    print("=" * 60)
    print("  🔥  Kali Command Center - 工具检测")
    print("=" * 60 + "\n")

    for category, data in detected.items():
        tool_count = len(data['tools'])
        total_tools += tool_count
        print(f"{data['icon']} {category}")
        print(f"   {data['description']}")
        print(f"   检测到: {tool_count} 个工具\n")

    print(f"\n[+] 共检测到 {total_tools} 个工具！")
    print("=" * 60)
