import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db, Student, AttendanceRecord } from '@/lib/database';
import { Users, Trash2, UserCheck, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const StudentList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, todayAttendance] = await Promise.all([
        db.getAllStudents(),
        db.getTodayAttendance()
      ]);
      setStudents(studentsData);
      setAttendanceRecords(todayAttendance);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load student data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await db.deleteStudent(student.id);
      await loadData();
      toast({
        title: "Student Deleted",
        description: `${student.name} has been removed from the system.`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markManualAttendance = async (student: Student) => {
    try {
      // Check if already marked
      const alreadyPresent = attendanceRecords.find(record => record.studentId === student.id);
      
      if (alreadyPresent) {
        toast({
          title: "Already Present",
          description: `${student.name} has already marked attendance today.`,
          variant: "destructive",
        });
        return;
      }

      const attendanceRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        studentId: student.id,
        timestamp: new Date(),
        method: 'manual',
      };

      await db.addAttendanceRecord(attendanceRecord);
      
      // Update student's last attendance
      await db.updateStudent({
        ...student,
        lastAttendance: new Date()
      });

      await loadData();

      toast({
        title: "Manual Attendance",
        description: `Attendance marked for ${student.name}.`,
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Attendance Failed",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const presentStudentIds = attendanceRecords.map(record => record.studentId);

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-background border shadow-soft">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-background border shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" />
            Enrolled Students
          </h2>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {students.length} Total
          </Badge>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Students Enrolled</h3>
            <p className="text-muted-foreground">Start by enrolling your first student to use the attendance system.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {students.map((student) => {
              const isPresent = presentStudentIds.includes(student.id);
              const attendanceRecord = attendanceRecords.find(r => r.studentId === student.id);

              return (
                <Card key={student.id} className={`p-4 border transition-all duration-200 hover:shadow-medium ${
                  isPresent ? 'bg-success/5 border-success/20' : 'bg-card'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                      {isPresent && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                          <UserCheck className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {student.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {student.studentId}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Enrolled: {format(student.enrolledAt, 'MMM dd, yyyy')}</span>
                        </div>
                        {student.lastAttendance && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Last: {format(student.lastAttendance, 'MMM dd, HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isPresent ? (
                        <Badge className="bg-success text-success-foreground">
                          Present
                          {attendanceRecord?.method === 'manual' && ' (Manual)'}
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => markManualAttendance(student)}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Mark Present
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => handleDeleteStudent(student)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isPresent && attendanceRecord && (
                    <div className="mt-3 pt-3 border-t border-success/20">
                      <div className="flex items-center gap-2 text-sm text-success">
                        <UserCheck className="w-4 h-4" />
                        <span>
                          Marked at {format(attendanceRecord.timestamp, 'HH:mm:ss')}
                          {attendanceRecord.method === 'face-recognition' && attendanceRecord.confidence && 
                            ` (${Math.round(attendanceRecord.confidence * 100)}% confidence)`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};