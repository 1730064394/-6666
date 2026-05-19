
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, CheckCircle2, Circle, PlayCircle, BookOpen, Code } from 'lucide-react';
import { useAppStore } from '../store';

const levelLabels = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
};

const lessonTypeIcons = {
  video: PlayCircle,
  text: BookOpen,
  interactive: Code,
};

export default function CourseDetail() {
  const { id } = useParams&lt;{ id: string }&gt;();
  const navigate = useNavigate();
  const { courses, progress, isAuthenticated, updateLessonProgress } = useAppStore();
  
  const course = courses.find(c =&gt; c.id === id);

  if (!course) {
    return (
      &lt;div className="min-h-screen bg-zinc-950 flex items-center justify-center"&gt;
        &lt;div className="text-center"&gt;
          &lt;p className="text-zinc-400 mb-4"&gt;课程未找到&lt;/p&gt;
          &lt;Link to="/courses" className="text-cyan-400 hover:text-cyan-300"&gt;返回课程列表&lt;/Link&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    );
  }

  const totalLessons = course.modules.reduce((sum, m) =&gt; sum + m.lessons.length, 0);
  const completedLessons = progress.filter(
    p =&gt; p.courseId === course.id &amp;&amp; p.completed
  ).length;
  const progressPercent = totalLessons &gt; 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleToggleLesson = (lessonId: string) =&gt; {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const lessonProgress = progress.find(
      p =&gt; p.courseId === course.id &amp;&amp; p.lessonId === lessonId
    );
    updateLessonProgress(course.id, lessonId, !lessonProgress?.completed);
  };

  return (
    &lt;div className="min-h-screen bg-zinc-950"&gt;
      {/* Course Header */}
      &lt;div className="relative"&gt;
        &lt;div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" /&gt;
        {course.imageUrl &amp;&amp; (
          &lt;div className="absolute inset-0 opacity-20"&gt;
            &lt;img src={course.imageUrl} alt="" className="w-full h-full object-cover" /&gt;
          &lt;/div&gt;
        )}
        
        &lt;div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"&gt;
          &lt;Link
            to="/courses"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          &gt;
            &lt;ChevronLeft className="h-5 w-5" /&gt;
            返回课程列表
          &lt;/Link&gt;

          &lt;div className="grid lg:grid-cols-3 gap-10"&gt;
            &lt;div className="lg:col-span-2"&gt;
              &lt;span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-sm font-medium mb-4"&gt;
                {levelLabels[course.level]}
              &lt;/span&gt;
              &lt;h1 className="text-4xl font-bold text-white mb-4"&gt;{course.title}&lt;/h1&gt;
              &lt;p className="text-zinc-300 text-lg mb-6"&gt;{course.description}&lt;/p&gt;
              
              &lt;div className="flex items-center gap-6 text-sm text-zinc-400"&gt;
                &lt;div className="flex items-center gap-2"&gt;
                  &lt;Clock className="h-5 w-5" /&gt;
                  &lt;span&gt;{course.duration}分钟&lt;/span&gt;
                &lt;/div&gt;
                &lt;div&gt;{course.modules.length}个模块&lt;/div&gt;
                &lt;div&gt;{totalLessons}节课程&lt;/div&gt;
              &lt;/div&gt;

              {isAuthenticated &amp;&amp; (
                &lt;div className="mt-6 space-y-2"&gt;
                  &lt;div className="flex justify-between text-sm text-zinc-300"&gt;
                    &lt;span&gt;学习进度&lt;/span&gt;
                    &lt;span&gt;{progressPercent}% ({completedLessons}/{totalLessons})&lt;/span&gt;
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

            &lt;div className="lg:col-span-1"&gt;
              &lt;div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24"&gt;
                {course.imageUrl &amp;&amp; (
                  &lt;img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-6"
                  /&gt;
                )}
                &lt;button
                  onClick={() =&gt; {}}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                &gt;
                  开始学习
                &lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      {/* Course Content */}
      &lt;div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"&gt;
        &lt;h2 className="text-2xl font-bold text-white mb-8"&gt;课程内容&lt;/h2&gt;
        
        &lt;div className="space-y-4"&gt;
          {course.modules.map((module, moduleIndex) =&gt; (
            &lt;div key={module.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"&gt;
              &lt;div className="p-6"&gt;
                &lt;h3 className="text-lg font-semibold text-white mb-2"&gt;
                  {moduleIndex + 1}. {module.title}
                &lt;/h3&gt;
                {module.description &amp;&amp; (
                  &lt;p className="text-zinc-400 text-sm"&gt;{module.description}&lt;/p&gt;
                )}
              &lt;/div&gt;
              
              &lt;div className="border-t border-zinc-800"&gt;
                {module.lessons.map((lesson, lessonIndex) =&gt; {
                  const isCompleted = progress.some(
                    p =&gt; p.courseId === course.id &amp;&amp; p.lessonId === lesson.id &amp;&amp; p.completed
                  );
                  const Icon = lessonTypeIcons[lesson.type];
                  
                  return (
                    &lt;div
                      key={lesson.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 last:border-0"
                    &gt;
                      &lt;button
                        onClick={() =&gt; handleToggleLesson(lesson.id)}
                        className="flex-shrink-0"
                      &gt;
                        {isCompleted ? (
                          &lt;CheckCircle2 className="h-6 w-6 text-emerald-400" /&gt;
                        ) : (
                          &lt;Circle className="h-6 w-6 text-zinc-600 hover:text-zinc-400 transition-colors" /&gt;
                        )}
                      &lt;/button&gt;
                      
                      &lt;div className="flex-shrink-0"&gt;
                        &lt;Icon className={`h-5 w-5 ${isCompleted ? 'text-emerald-400' : 'text-zinc-500'}`} /&gt;
                      &lt;/div&gt;
                      
                      &lt;div className="flex-1"&gt;
                        &lt;h4 className={`font-medium ${isCompleted ? 'text-zinc-400' : 'text-white'}`}&gt;
                          {lesson.title}
                        &lt;/h4&gt;
                      &lt;/div&gt;
                      
                      {lesson.duration &amp;&amp; (
                        &lt;span className="text-sm text-zinc-500"&gt;{lesson.duration}分钟&lt;/span&gt;
                      )}
                    &lt;/div&gt;
                  );
                })}
              &lt;/div&gt;
            &lt;/div&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
