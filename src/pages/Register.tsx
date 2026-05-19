
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAppStore } from '../store';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() =&gt; {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) =&gt; {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    &lt;div className="min-h-screen bg-zinc-950 flex items-center justify-center py-12 px-4"&gt;
      &lt;div className="max-w-md w-full"&gt;
        &lt;div className="text-center mb-8"&gt;
          &lt;Link to="/" className="inline-flex items-center gap-2 mb-6"&gt;
            &lt;Shield className="h-10 w-10 text-cyan-400" /&gt;
            &lt;span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"&gt;
              KaliLearn
            &lt;/span&gt;
          &lt;/Link&gt;
          &lt;h1 className="text-3xl font-bold text-white mb-2"&gt;创建账户&lt;/h1&gt;
          &lt;p className="text-zinc-400"&gt;开始您的网络安全学习之旅&lt;/p&gt;
        &lt;/div&gt;

        &lt;div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"&gt;
          &lt;form onSubmit={handleSubmit} className="space-y-6"&gt;
            &lt;div&gt;
              &lt;label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2"&gt;
                用户名
              &lt;/label&gt;
              &lt;div className="relative"&gt;
                &lt;User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" /&gt;
                &lt;input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =&gt; setName(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="您的用户名"
                /&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div&gt;
              &lt;label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2"&gt;
                邮箱地址
              &lt;/label&gt;
              &lt;div className="relative"&gt;
                &lt;Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" /&gt;
                &lt;input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =&gt; setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="you@example.com"
                /&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div&gt;
              &lt;label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2"&gt;
                密码
              &lt;/label&gt;
              &lt;div className="relative"&gt;
                &lt;Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" /&gt;
                &lt;input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) =&gt; setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="••••••••"
                /&gt;
                &lt;button
                  type="button"
                  onClick={() =&gt; setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                &gt;
                  {showPassword ? &lt;EyeOff className="h-5 w-5" /&gt; : &lt;Eye className="h-5 w-5" /&gt;}
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            &gt;
              {isLoading ? '注册中...' : '创建账户'}
            &lt;/button&gt;
          &lt;/form&gt;

          &lt;div className="mt-8 text-center"&gt;
            &lt;p className="text-zinc-400"&gt;
              已有账户？{' '}
              &lt;Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium"&gt;
                立即登录
              &lt;/Link&gt;
            &lt;/p&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
