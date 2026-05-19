
import { create } from 'zustand';
import { Course, User, Progress, LearningPath } from './types';

interface AppState {
  user: User | null;
  courses: Course[];
  progress: Progress[];
  learningPaths: LearningPath[];
  isAuthenticated: boolean;
  setUser: (user: User | null) =&gt; void;
  setCourses: (courses: Course[]) =&gt; void;
  setProgress: (progress: Progress[]) =&gt; void;
  setLearningPaths: (paths: LearningPath[]) =&gt; void;
  login: (email: string, password: string) =&gt; Promise&lt;void&gt;;
  logout: () =&gt; void;
  register: (email: string, password: string, name: string) =&gt; Promise&lt;void&gt;;
  updateLessonProgress: (courseId: string, lessonId: string, completed: boolean) =&gt; void;
}

// Mock data
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Kali Linux 基础入门',
    description: '从零开始学习Kali Linux操作系统，掌握基本命令和工具使用。',
    level: 'beginner',
    duration: 120,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kali%20Linux%20terminal%20with%20cyberpunk%20style%20dark%20theme&image_size=square_hd',
    orderIndex: 1,
    modules: [
      {
        id: 'm1',
        courseId: '1',
        title: '第一章：系统安装与配置',
        description: '学习如何安装和配置Kali Linux系统',
        orderIndex: 1,
        lessons: [
          { id: 'l1', moduleId: 'm1', title: '1.1 下载与安装', content: '学习如何下载和安装Kali Linux', type: 'video', duration: 15, orderIndex: 1 },
          { id: 'l2', moduleId: 'm1', title: '1.2 系统配置', content: '配置Kali Linux基本设置', type: 'text', duration: 10, orderIndex: 2 },
        ],
      },
      {
        id: 'm2',
        courseId: '1',
        title: '第二章：常用命令',
        description: '掌握Kali Linux常用命令',
        orderIndex: 2,
        lessons: [
          { id: 'l3', moduleId: 'm2', title: '2.1 文件操作命令', content: '学习文件和目录操作命令', type: 'interactive', duration: 20, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '网络扫描与侦察',
    description: '学习使用Nmap、Wireshark等工具进行网络扫描和信息收集。',
    level: 'intermediate',
    duration: 180,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Network%20scan%20visualization%20cybersecurity%20dark%20theme&image_size=square_hd',
    orderIndex: 2,
    modules: [
      {
        id: 'm3',
        courseId: '2',
        title: '第三章：Nmap 基础',
        description: '学习Nmap的基本使用',
        orderIndex: 1,
        lessons: [
          { id: 'l4', moduleId: 'm3', title: '3.1 Nmap简介', content: '了解Nmap功能和用途', type: 'video', duration: 20, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    id: '3',
    title: 'Web渗透测试',
    description: '深入学习Web应用安全漏洞检测和利用技术。',
    level: 'advanced',
    duration: 240,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Web%20security%20hacking%20dashboard%20dark%20theme&image_size=square_hd',
    orderIndex: 3,
    modules: [
      {
        id: 'm4',
        courseId: '3',
        title: '第五章：SQL注入',
        description: '学习SQL注入漏洞检测与利用',
        orderIndex: 1,
        lessons: [
          { id: 'l5', moduleId: 'm4', title: '5.1 什么是SQL注入', content: '了解SQL注入原理', type: 'text', duration: 25, orderIndex: 1 },
        ],
      },
    ],
  },
  {
    id: '4',
    title: '密码破解与哈希分析',
    description: '学习密码学基础和常见密码破解技术。',
    level: 'intermediate',
    duration: 150,
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cryptography%20binary%20code%20dark%20cyberpunk&image_size=square_hd',
    orderIndex: 4,
    modules: [
      { id: 'm5', courseId: '4', title: '密码学基础', description: '了解基本的密码学概念', orderIndex: 1, lessons: [
        { id: 'l6', moduleId: 'm5', title: '哈希算法', content: '学习MD5、SHA等哈希算法', type: 'video', duration: 18, orderIndex: 1 },
      ]},
    ],
  },
];

const mockPaths: LearningPath[] = [
  {
    id: 'p1',
    name: '从零基础到入门',
    description: '适合完全没有网络安全基础的学习者，从Kali Linux基础开始。',
    orderIndex: 1,
    courses: [mockCourses[0]],
  },
  {
    id: 'p2',
    name: '网络安全工程师路径',
    description: '系统学习网络安全基础知识和技能，成为合格的安全工程师。',
    orderIndex: 2,
    courses: [mockCourses[0], mockCourses[1], mockCourses[3]],
  },
  {
    id: 'p3',
    name: 'Web安全专家路径',
    description: '专注于Web应用安全，学习渗透测试和漏洞利用。',
    orderIndex: 3,
    courses: [mockCourses[0], mockCourses[1], mockCourses[2]],
  },
];

export const useAppStore = create&lt;AppState&gt;((set, get) =&gt; ({
  user: null,
  courses: mockCourses,
  progress: [],
  learningPaths: mockPaths,
  isAuthenticated: false,

  setUser: (user) =&gt; set({ user, isAuthenticated: !!user }),
  setCourses: (courses) =&gt; set({ courses }),
  setProgress: (progress) =&gt; set({ progress }),
  setLearningPaths: (paths) =&gt; set({ learningPaths: paths }),

  login: async (email, password) =&gt; {
    await new Promise(r =&gt; setTimeout(r, 800));
    set({
      user: {
        id: 'u1',
        email,
        name: email.split('@')[0],
      },
      isAuthenticated: true,
    });
  },

  register: async (email, password, name) =&gt; {
    await new Promise(r =&gt; setTimeout(r, 800));
    set({
      user: {
        id: 'u1',
        email,
        name,
      },
      isAuthenticated: true,
    });
  },

  logout: () =&gt; {
    set({ user: null, isAuthenticated: false, progress: [] });
  },

  updateLessonProgress: (courseId, lessonId, completed) =&gt; {
    const { progress, user, courses } = get();
    if (!user) return;

    const existingProgress = progress.find(
      p =&gt; p.userId === user.id &amp;&amp; p.courseId === courseId &amp;&amp; p.lessonId === lessonId
    );

    let updatedProgress;
    if (existingProgress) {
      updatedProgress = progress.map(p =&gt;
        p.id === existingProgress.id ? { ...p, completed, completedAt: completed ? new Date() : undefined } : p
      );
    } else {
      const newProgress: Progress = {
        id: `p-${Date.now()}`,
        userId: user.id,
        courseId,
        lessonId,
        completed,
        progressPercent: completed ? 100 : 0,
        completedAt: completed ? new Date() : undefined,
      };
      updatedProgress = [...progress, newProgress];
    }

    set({ progress: updatedProgress });
  },
}));
