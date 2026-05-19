
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap } from 'lucide-react';
import { Course } from '../types';
import { useAppStore } from '../store';

interface Props {
  course: Course;
}

const levelColors = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-400',
  advanced: 'bg-rose-500/10 text-rose-400',
};

const levelLabels = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
};

export default function CourseCard({ course }: Props) {
  const { progress, isAuthenticated } = useAppStore();
  const completedLessons = progress.filter(
    p =&gt; p.courseId === course.id &amp;&amp; p.completed
  ).length;
  const totalLessons = course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0);
  const progressPercent = totalLessons &gt; 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    &lt;Link
      to={`/courses/${course.id}`}
      className="group bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
    &gt;
      &lt;div className="relative h-48 overflow-hidden"&gt;
        {course.imageUrl ? (
          &lt;img
            src={course.imageUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          /&gt;
        ) : (
          &lt;div className="w-full h-full bg-gradient-to-br from-cyan-900/30 to-emerald-900/30 flex items-center justify-center"&gt;
            &lt;Zap className="h-12 w-12 text-cyan-500" /&gt;
          &lt;/div&gt;
        )}
        &lt;div className="absolute top-3 left-3"&gt;
          &lt;span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[course.level]}`}&gt;
            {levelLabels[course.level]}
          &lt;/span&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="p-5"&gt;
        &lt;h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors"&gt;
          {course.title}
        &lt;/h3&gt;
        &lt;p className="text-zinc-400 text-sm mb-4 line-clamp-2"&gt;{course.description}&lt;/p&gt;

        &lt;div className="flex items-center justify-between text-sm text-zinc-500 mb-3"&gt;
          &lt;div className="flex items-center gap-1"&gt;
            &lt;Clock className="h-4 w-4" /&gt;
            &lt;span&gt;{course.duration}分钟&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        {isAuthenticated &amp;&amp; totalLessons &gt; 0 &amp;&amp; (
          &lt;div className="space-y-2"&gt;
            &lt;div className="flex justify-between text-xs text-zinc-400"&gt;
              &lt;span&gt;学习进度&lt;/span&gt;
              &lt;span&gt;{progressPercent}%&lt;/span&gt;
            &lt;/div&gt;
            &lt;div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden"&gt;
              &lt;div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              /&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/Link&gt;
  );
}
