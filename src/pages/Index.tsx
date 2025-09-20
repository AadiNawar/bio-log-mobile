import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentEnrollment } from '@/components/StudentEnrollment';
import { AttendanceScanner } from '@/components/AttendanceScanner';
import { StudentList } from '@/components/StudentList';
import { UserPlus, Scan, Users, GraduationCap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">FaceTrack</h1>
              <p className="text-muted-foreground">Smart Attendance System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-card shadow-soft">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="enroll" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Enroll</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Take Attendance</h2>
              <p className="text-muted-foreground">
                Use the camera to automatically detect and mark student attendance
              </p>
            </div>
            <AttendanceScanner />
          </TabsContent>

          <TabsContent value="enroll" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Student Enrollment</h2>
              <p className="text-muted-foreground">
                Register new students in the facial recognition system
              </p>
            </div>
            <StudentEnrollment />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Student Management</h2>
              <p className="text-muted-foreground">
                View enrolled students and manage attendance records
              </p>
            </div>
            <StudentList />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Powered by Face Recognition Technology
            </p>
            <p className="text-xs text-muted-foreground">
              All data is stored locally on your device for privacy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;