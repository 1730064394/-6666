
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, BookOpen, Trophy, LogOut, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import CourseCard from '../components/CourseCard';

export default function Profile() {
  const navigate = useNavigate();
  const { user, courses, progress, logout, isAuthenticated } = useAppStore();

  React.useEffect(() =&gt; {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  // Calculate statistics
  const totalLessons = courses.reduce((total, course) =&gt; 
    total + course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0), 0
  );
  const completedLessons = progress.filter(p =&gt; p.completed).length;
  const completedCourses = courses.filter(course =&gt; {
    const courseLessons = course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0);
    const completed = progress.filter(p =&gt; p.courseId === course.id &amp;&amp; p.completed).length;
    return courseLessons &gt; 0 &amp;&amp; completed === courseLessons;
  }).length;
  const inProgressCourses = courses.filter(course =&gt; {
    const completed = progress.filter(p =&gt; p.courseId === course.id &amp;&amp; p.completed).length;
    return completed &gt; 0 &amp;&amp; completed &lt; course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0);
  });

  const handleLogout = () =&gt; {
    logout();
    navigate('/');
  };

  return (
    &lt;div className="min-h-screen bg-zinc-950"&gt;
      {/* Profile Header */}
      &lt;div className="relative"&gt;
        &lt;div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-zinc-950 to-emerald-900/20" /&gt;
        &lt;div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"&gt;
          &lt;div className="flex items-start gap-6"&gt;
            &lt;div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"&gt;
              &lt;User className="h-12 w-12 text-white" /&gt;
            &lt;/div&gt;
            &lt;div className="flex-1 pt-2"&gt;
              &lt;h1 className="text-3xl font-bold text-white mb-2"&gt;{user?.name || '用户'}&lt;/h1&gt;
              &lt;p className="text-zinc-400"&gt;{user?.email}&lt;/p&gt;
            &lt;/div&gt;
            &lt;button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            &gt;
              &lt;LogOut className="h-5 w-5" /&gt;
              &lt;span className="hidden sm:inline"&gt;退出登录&lt;/span&gt;
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"&gt;
        {/* Statistics Cards */}
        &lt;div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"&gt;
          &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"&gt;
            &lt;div className="flex items-center gap-3 mb-2"&gt;
              &lt;div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center"&gt;
                &lt;BookOpen className="h-5 w-5 text-cyan-400" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="text-3xl font-bold text-white mb-1"&gt;{completedCourses}&lt;/div&gt;
            &lt;div className="text-sm text-zinc-400"&gt;已完成课程&lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"&gt;
            &lt;div className="flex items-center gap-3 mb-2"&gt;
              &lt;div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center"&gt;
                &lt;Trophy className="h-5 w-5 text-emerald-400" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="text-3xl font-bold text-white mb-1"&gt;{completedLessons}&lt;/div&gt;
            &lt;div className="text-sm text-zinc-400"&gt;已完成课时&lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"&gt;
            &lt;div className="flex items-center gap-3 mb-2"&gt;
              &lt;div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center"&gt;
                &lt;BookOpen className="h-5 w-5 text-amber-400" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="text-3xl font-bold text-white mb-1"&gt;{inProgressCourses.length}&lt;/div&gt;
            &lt;div className="text-sm text-zinc-400"&gt;进行中课程&lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"&gt;
            &lt;div className="flex items-center gap-3 mb-2"&gt;
              &lt;div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center"&gt;
                &lt;Trophy className="h-5 w-5 text-purple-400" /&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="text-3xl font-bold text-white mb-1"&gt;
              {totalLessons &gt; 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
            &lt;/div&gt;
            &lt;div className="text-sm text-zinc-400"&gt;总体完成度&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {/* In Progress Courses */}
        {inProgressCourses.length &gt; 0 &amp;&amp; (
          &lt;div className="mb-12"&gt;
            &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;进行中的课程&lt;/h2&gt;
            &lt;div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"&gt;
              {inProgressCourses.map((course) =&gt; (
                &lt;CourseCard key={course.id} course={course} /&gt;
              ))}
            &lt;/div&gt;
          &lt;/div&gt;
        )}

        {/* Quick Actions */}
        &lt;div&gt;
          &lt;h2 className="text-2xl font-bold text-white mb-6"&gt;快速操作&lt;/h2&gt;
          &lt;div className="space-y-3"&gt;
            &lt;Link
              to="/courses"
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-cyan-500/50 transition-colors group"
            &gt;
              &lt;div className="flex items-center gap-4"&gt;
                &lt;div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center"&gt;
                  &lt;BookOpen className="h-5 w-5 text-cyan-400" /&gt;
                &lt;/div&gt;
                &lt;span className="text-white font-medium"&gt;浏览所有课程&lt;/span&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" /&gt;
            &lt;/Link&gt;
            &lt;Link
              to="/path"
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors group"
            &gt;
              &lt;div className="flex items-center gap-4"&gt;
                &lt;div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center"&gt;
                  &lt;Trophy className="h-5 w-5 text-emerald-400" /&gt;
                &lt;/div&gt;
                &lt;span className="text-white font-medium"&gt;查看学习路径&lt;/span&gt;
              &lt;/div&gt;
              &lt;ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" /&gt;
            &lt;/Link&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
