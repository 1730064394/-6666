
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, BookOpen, Code, Terminal, Users, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';
import CourseCard from '../components/CourseCard';

export default function Home() {
  const { courses, isAuthenticated } = useAppStore();

  const features = [
    { icon: Shield, title: '安全学习', description: '在安全的环境中学习网络安全知识' },
    { icon: Terminal, title: '实践操作', description: '丰富的实践课程和互动练习' },
    { icon: Zap, title: '实时更新', description: '紧跟最新的安全技术和工具' },
    { icon: Users, title: '社区支持', description: '与志同道合的学习者共同进步' },
  ];

  return (
    &lt;div className="min-h-screen bg-zinc-950"&gt;
      {/* Hero Section */}
      &lt;section className="relative py-24 overflow-hidden"&gt;
        &lt;div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-zinc-950 to-emerald-900/10" /&gt;
        &lt;div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" /&gt;
        &lt;div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" /&gt;

        &lt;div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"&gt;
          &lt;div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full mb-8"&gt;
            &lt;span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /&gt;
            &lt;span className="text-sm text-zinc-300"&gt;开始您的网络安全学习之旅&lt;/span&gt;
          &lt;/div&gt;

          &lt;h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"&gt;
            学习
            &lt;span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent"&gt;
              Kali Linux
            &lt;/span&gt;
            &lt;br /&gt;
            黑客攻防技术
          &lt;/h1&gt;

          &lt;p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10"&gt;
            从零基础到专业级，系统学习网络安全知识，掌握Kali Linux工具使用，成为合格的安全专家。
          &lt;/p&gt;

          &lt;div className="flex flex-col sm:flex-row items-center justify-center gap-4"&gt;
            &lt;Link
              to="/courses"
              className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all"
            &gt;
              开始学习
              &lt;ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /&gt;
            &lt;/Link&gt;
            {!isAuthenticated &amp;&amp; (
              &lt;Link
                to="/register"
                className="px-8 py-4 rounded-xl font-semibold text-zinc-300 border border-zinc-700 hover:border-cyan-500 hover:text-cyan-400 transition-all"
              &gt;
                免费注册
              &lt;/Link&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

      {/* Features Section */}
      &lt;section className="py-20 bg-zinc-900/50"&gt;
        &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"&gt;
          &lt;h2 className="text-3xl font-bold text-white text-center mb-12"&gt;为什么选择我们&lt;/h2&gt;
          &lt;div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"&gt;
            {features.map((feature, i) =&gt; (
              &lt;div
                key={i}
                className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              &gt;
                &lt;div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mb-4"&gt;
                  &lt;feature.icon className="h-6 w-6 text-cyan-400" /&gt;
                &lt;/div&gt;
                &lt;h3 className="text-lg font-semibold text-white mb-2"&gt;{feature.title}&lt;/h3&gt;
                &lt;p className="text-zinc-400 text-sm"&gt;{feature.description}&lt;/p&gt;
              &lt;/div&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

      {/* Courses Section */}
      &lt;section className="py-20"&gt;
        &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"&gt;
          &lt;div className="flex items-center justify-between mb-12"&gt;
            &lt;h2 className="text-3xl font-bold text-white"&gt;热门课程&lt;/h2&gt;
            &lt;Link
              to="/courses"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            &gt;
              查看全部
              &lt;ArrowRight className="h-4 w-4" /&gt;
            &lt;/Link&gt;
          &lt;/div&gt;
          &lt;div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"&gt;
            {courses.slice(0, 4).map((course) =&gt; (
              &lt;CourseCard key={course.id} course={course} /&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;
    &lt;/div&gt;
  );
}
