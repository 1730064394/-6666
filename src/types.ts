
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content?: string;
  type: 'video' | 'text' | 'interactive';
  duration?: number;
  orderIndex: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  imageUrl?: string;
  orderIndex: number;
  modules: Module[];
}

export interface Progress {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  completed: boolean;
  completedAt?: Date;
  progressPercent: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: Course[];
  orderIndex: number;
}
