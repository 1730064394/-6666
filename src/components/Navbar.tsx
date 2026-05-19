
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Map, User, LogOut, Shield } from 'lucide-react';
import { useAppStore } from '../store';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAppStore();

  const handleLogout = () =&gt; {
    logout();
    navigate('/');
  };

  return (
    &lt;nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50"&gt;
      &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"&gt;
        &lt;div className="flex items-center justify-between h-16"&gt;
          &lt;Link to="/" className="flex items-center gap-2"&gt;
            &lt;Shield className="h-8 w-8 text-cyan-400" /&gt;
            &lt;span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"&gt;
              KaliLearn
            &lt;/span&gt;
          &lt;/Link&gt;

          &lt;div className="flex items-center gap-6"&gt;
            &lt;Link to="/" className="flex items-center gap-2 text-zinc-300 hover:text-cyan-400 transition-colors"&gt;
              &lt;Home className="h-5 w-5" /&gt;
              &lt;span className="hidden sm:inline"&gt;首页&lt;/span&gt;
            &lt;/Link&gt;
            &lt;Link to="/courses" className="flex items-center gap-2 text-zinc-300 hover:text-cyan-400 transition-colors"&gt;
              &lt;BookOpen className="h-5 w-5" /&gt;
              &lt;span className="hidden sm:inline"&gt;课程&lt;/span&gt;
            &lt;/Link&gt;
            &lt;Link to="/path" className="flex items-center gap-2 text-zinc-300 hover:text-cyan-400 transition-colors"&gt;
              &lt;Map className="h-5 w-5" /&gt;
              &lt;span className="hidden sm:inline"&gt;学习路径&lt;/span&gt;
            &lt;/Link&gt;
          &lt;/div&gt;

          &lt;div className="flex items-center gap-4"&gt;
            {isAuthenticated ? (
              &lt;&gt;
                &lt;Link to="/profile" className="flex items-center gap-2 text-zinc-300 hover:text-cyan-400 transition-colors"&gt;
                  &lt;User className="h-5 w-5" /&gt;
                  &lt;span className="hidden sm:inline"&gt;{user?.name || '个人中心'}&lt;/span&gt;
                &lt;/Link&gt;
                &lt;button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-zinc-300 hover:text-rose-400 transition-colors"
                &gt;
                  &lt;LogOut className="h-5 w-5" /&gt;
                  &lt;span className="hidden sm:inline"&gt;退出&lt;/span&gt;
                &lt;/button&gt;
              &lt;/&gt;
            ) : (
              &lt;Link
                to="/login"
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              &gt;
                登录
              &lt;/Link&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/nav&gt;
  );
}
