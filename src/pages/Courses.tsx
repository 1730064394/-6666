
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { useAppStore } from '../store';
import CourseCard from '../components/CourseCard';
import { Course } from '../types';

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function Courses() {
  const { courses } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState&lt;LevelFilter&gt;('all');

  const filteredCourses = courses.filter((course) =&gt; {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    return matchesSearch &amp;&amp; matchesLevel;
  });

  return (
    &lt;div className="min-h-screen bg-zinc-950 py-12"&gt;
      &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"&gt;
        &lt;div className="mb-12"&gt;
          &lt;h1 className="text-4xl font-bold text-white mb-4"&gt;课程列表&lt;/h1&gt;
          &lt;p className="text-zinc-400"&gt;探索我们的Kali Linux学习课程&lt;/p&gt;
        &lt;/div&gt;

        {/* Filters */}
        &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10"&gt;
          &lt;div className="flex flex-col lg:flex-row gap-6"&gt;
            {/* Search */}
            &lt;div className="flex-1 relative"&gt;
              &lt;Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" /&gt;
              &lt;input
                type="text"
                placeholder="搜索课程..."
                value={searchQuery}
                onChange={(e) =&gt; setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
              /&gt;
            &lt;/div&gt;

            {/* Level Filter */}
            &lt;div className="flex items-center gap-3"&gt;
              &lt;Filter className="h-5 w-5 text-zinc-500" /&gt;
              &lt;select
                value={levelFilter}
                onChange={(e) =&gt; setLevelFilter(e.target.value as LevelFilter)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              &gt;
                &lt;option value="all"&gt;所有难度&lt;/option&gt;
                &lt;option value="beginner"&gt;入门&lt;/option&gt;
                &lt;option value="intermediate"&gt;中级&lt;/option&gt;
                &lt;option value="advanced"&gt;高级&lt;/option&gt;
              &lt;/select&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {/* Course Grid */}
        {filteredCourses.length &gt; 0 ? (
          &lt;div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"&gt;
            {filteredCourses.map((course) =&gt; (
              &lt;CourseCard key={course.id} course={course} /&gt;
            ))}
          &lt;/div&gt;
        ) : (
          &lt;div className="text-center py-20"&gt;
            &lt;p className="text-zinc-500 text-lg"&gt;没有找到匹配的课程&lt;/p&gt;
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
