
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import CourseCard from '../components/CourseCard';

export default function Path() {
  const { learningPaths, courses, progress, isAuthenticated } = useAppStore();

  return (
    &lt;div className="min-h-screen bg-zinc-950 py-12"&gt;
      &lt;div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"&gt;
        &lt;div className="text-center mb-16"&gt;
          &lt;h1 className="text-4xl font-bold text-white mb-4"&gt;学习路径&lt;/h1&gt;
          &lt;p className="text-zinc-400 max-w-2xl mx-auto"&gt;
            根据您的水平和目标，选择合适的学习路径，系统提升网络安全技能
          &lt;/p&gt;
        &lt;/div&gt;

        &lt;div className="space-y-12"&gt;
          {learningPaths.map((path, pathIndex) =&gt; {
            // Calculate path progress
            const pathLessons = path.courses.reduce((total, course) =&gt; 
              total + course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0), 0
            );
            const completedLessons = path.courses.reduce((total, course) =&gt; 
              total + progress.filter(p =&gt; p.courseId === course.id &amp;&amp; p.completed).length, 0
            );
            const progressPercent = pathLessons &gt; 0 ? Math.round((completedLessons / pathLessons) * 100) : 0;

            return (
              &lt;div key={path.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"&gt;
                &lt;div className="p-8"&gt;
                  &lt;div className="flex items-start justify-between mb-6"&gt;
                    &lt;div&gt;
                      &lt;div className="flex items-center gap-2 mb-2"&gt;
                        &lt;span className="text-emerald-400 font-mono text-sm"&gt;0{pathIndex + 1}&lt;/span&gt;
                        &lt;h2 className="text-2xl font-bold text-white"&gt;{path.name}&lt;/h2&gt;
                      &lt;/div&gt;
                      &lt;p className="text-zinc-400 mb-4"&gt;{path.description}&lt;/p&gt;
                      
                      {isAuthenticated &amp;&amp; (
                        &lt;div className="space-y-2 mb-6"&gt;
                          &lt;div className="flex justify-between text-sm"&gt;
                            &lt;span className="text-zinc-400"&gt;完成度&lt;/span&gt;
                            &lt;span className="text-cyan-400"&gt;{progressPercent}%&lt;/span&gt;
                          &lt;/div&gt;
                          &lt;div className="h-2 bg-zinc-800 rounded-full overflow-hidden"&gt;
                            &lt;div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            /&gt;
                          &lt;/div&gt;
                        &lt;/div&gt;
                      )}
                    &lt;/div&gt;
                  &lt;/div&gt;

                  {/* Course Timeline */}
                  &lt;div className="relative"&gt;
                    {path.courses.length &gt; 1 &amp;&amp; (
                      &lt;div className="absolute left-6 top-12 bottom-0 w-0.5 bg-zinc-800" /&gt;
                    )}
                    
                    &lt;div className="space-y-8"&gt;
                      {path.courses.map((course, courseIndex) =&gt; {
                        const courseProgress = progress.filter(
                          p =&gt; p.courseId === course.id &amp;&amp; p.completed
                        ).length;
                        const totalCourseLessons = course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0);
                        const isComplete = courseProgress === totalCourseLessons;

                        return (
                          &lt;div key={course.id} className="relative pl-16"&gt;
                            &lt;div className="absolute left-0 top-4 w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center z-10"&gt;
                              {isComplete ? (
                                &lt;CheckCircle2 className="h-6 w-6 text-emerald-400" /&gt;
                              ) : (
                                &lt;Circle className="h-6 w-6 text-zinc-600" /&gt;
                              )}
                            &lt;/div&gt;
                            
                            &lt;div className="grid lg:grid-cols-3 gap-4 items-start"&gt;
                              &lt;div className="lg:col-span-2"&gt;
                                &lt;CourseCard course={course} /&gt;
                              &lt;/div&gt;
                              &lt;div className="lg:col-span-1"&gt;
                                {isComplete ? (
                                  &lt;div className="bg-emerald-500/10 text-emerald-400 px-4 py-3 rounded-lg text-sm"&gt;
                                    ✓ 已完成
                                  &lt;/div&gt;
                                ) : (
                                  &lt;div className="text-zinc-500 text-sm"&gt;
                                    {courseProgress}/{totalCourseLessons} 节课
                                  &lt;/div&gt;
                                )}
                              &lt;/div&gt;
                            &lt;/div&gt;
                          &lt;/div&gt;
                        );
                      })}
                    &lt;/div&gt;
                  &lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
            );
          })}
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
