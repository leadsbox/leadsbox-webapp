import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { BookOpen, Award, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface PathCourse {
  course: Course;
}

interface LearningPath {
  id: string;
  title: string;
  roleTarget?: string;
  department?: string;
  courses?: PathCourse[];
}

interface CourseProgress {
  courseId: string;
  status: string;
}

export default function TrainingHub() {
  const { data: learningPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ['training-paths'],
    queryFn: async () => {
      const res = await client.get('/training/learning-paths');
      return res.data?.data?.paths || [];
    },
  });

  const { data: courseProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['training-progress'],
    queryFn: async () => {
      const res = await client.get('/training/progress');
      return res.data?.data?.progress || [];
    },
  });

  const getProgressForCourse = (courseId: string) => {
    return courseProgress?.find((p: CourseProgress) => p.courseId === courseId);
  };

  const handleStartCourse = async (courseId: string) => {
    try {
      await client.patch(`/training/courses/${courseId}/progress`, {
        status: 'IN_PROGRESS',
      });
      // In a real app, navigate to course viewer
    } catch (error) {
      console.error('Failed to start course', error);
    }
  };

  return (
    <div className='p-6 space-y-8 max-w-7xl mx-auto'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Training Hub</h1>
        <p className='text-muted-foreground'>Level up your skills with assigned learning paths.</p>
      </div>

      <div className='space-y-8'>
        {pathsLoading ? (
          <div className='py-8 text-center text-muted-foreground'>Loading learning paths...</div>
        ) : learningPaths?.length === 0 ? (
          <div className='py-12 flex flex-col items-center justify-center text-center border border-dashed rounded-lg'>
            <BookOpen className='h-10 w-10 text-muted-foreground mb-4 opacity-20' />
            <h3 className='font-semibold text-lg'>No Learning Paths Assigned</h3>
            <p className='text-muted-foreground'>Enjoy your free time!</p>
          </div>
        ) : (
          learningPaths.map((path: LearningPath) => (
            <div key={path.id} className='space-y-4'>
              <div className='flex items-center gap-2'>
                <h2 className='text-2xl font-semibold tracking-tight'>{path.title}</h2>
                {path.roleTarget && <Badge variant='outline'>Role: {path.roleTarget}</Badge>}
                {path.department && <Badge variant='outline'>Dept: {path.department}</Badge>}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {path.courses?.map((pathCourse: PathCourse) => {
                  const course = pathCourse.course;
                  const progress = getProgressForCourse(course.id);
                  const isCompleted = progress?.status === 'COMPLETED';
                  const inProgress = progress?.status === 'IN_PROGRESS';

                  return (
                    <Card key={course.id} className='flex flex-col h-full hover:shadow-md transition-shadow'>
                      <CardHeader>
                        <CardTitle className='line-clamp-1'>{course.title}</CardTitle>
                        <CardDescription className='line-clamp-2 min-h-[40px]'>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className='flex-1'>
                        {isCompleted ? (
                          <div className='flex items-center gap-2 text-primary font-medium'>
                            <Award className='h-5 w-5' /> Completed
                          </div>
                        ) : inProgress ? (
                          <div className='space-y-2'>
                            <div className='flex justify-between text-xs text-muted-foreground mb-1'>
                              <span>In Progress</span>
                              <span>50%</span>
                            </div>
                            <Progress value={50} className='h-2' />
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                            <BookOpen className='h-4 w-4' /> Not started
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        {isCompleted ? (
                          <Button variant='secondary' className='w-full'>
                            Review Course
                          </Button>
                        ) : (
                          <Button onClick={() => handleStartCourse(course.id)} className='w-full' variant={inProgress ? 'default' : 'outline'}>
                            {inProgress ? 'Continue Learning' : 'Start Course'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
