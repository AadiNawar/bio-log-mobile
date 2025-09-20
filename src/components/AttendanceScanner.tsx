import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CameraCapture } from './CameraCapture';
import { faceRecognition } from '@/lib/face-recognition';
import { db, Student, AttendanceRecord } from '@/lib/database';
import { Scan, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const AttendanceScanner = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    student: Student;
    confidence: number;
    timestamp: Date;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, attendanceData] = await Promise.all([
        db.getAllStudents(),
        db.getTodayAttendance()
      ]);
      setStudents(studentsData);
      setTodayAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleScan = async (imageData: string) => {
    if (students.length === 0) {
      toast({
        title: "No Students Enrolled",
        description: "Please enroll students before scanning for attendance.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    try {
      await faceRecognition.initialize();

      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const descriptor = await faceRecognition.extractFaceDescriptor(img);
      
      if (!descriptor) {
        toast({
          title: "No Face Detected",
          description: "No face detected in the image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Compare with enrolled students
      const knownDescriptors = students.map(student => ({
        id: student.id,
        descriptor: student.faceDescriptor
      }));

      const match = faceRecognition.findBestMatch(descriptor, knownDescriptors, 0.5);

      if (match) {
        const student = students.find(s => s.id === match.id)!;
        
        // Check if already marked attendance today
        const alreadyPresent = todayAttendance.find(record => record.studentId === student.id);
        
        if (alreadyPresent) {
          toast({
            title: "Already Present",
            description: `${student.name} has already marked attendance today.`,
            variant: "destructive",
          });
          setLastScanResult({
            student,
            confidence: match.confidence,
            timestamp: alreadyPresent.timestamp
          });
          return;
        }

        // Mark attendance
        const attendanceRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          studentId: student.id,
          timestamp: new Date(),
          method: 'face-recognition',
          confidence: match.confidence
        };

        await db.addAttendanceRecord(attendanceRecord);

        // Update student's last attendance
        await db.updateStudent({
          ...student,
          lastAttendance: new Date()
        });

        setLastScanResult({
          student,
          confidence: match.confidence,
          timestamp: attendanceRecord.timestamp
        });

        toast({
          title: "Attendance Marked",
          description: `${student.name} - Present (${Math.round(match.confidence * 100)}% confidence)`,
        });

        // Reload attendance data
        await loadData();

      } else {
        toast({
          title: "Student Not Recognized",
          description: "Face not recognized. Please use manual attendance or re-enroll.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Scanning error:', error);
      toast({
        title: "Scan Failed",
        description: "An error occurred during scanning. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const presentStudentIds = todayAttendance.map(record => record.studentId);
  const presentStudents = students.filter(student => presentStudentIds.includes(student.id));
  const absentStudents = students.filter(student => !presentStudentIds.includes(student.id));

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-background border shadow-soft">
        <h2 className="text-2xl font-bold mb-6 text-center text-foreground flex items-center justify-center gap-2">
          <Scan className="w-6 h-6" />
          Attendance Scanner
        </h2>

        <CameraCapture 
          onCapture={handleScan}
          isCapturing={isScanning}
          className="mb-6"
        />

        {lastScanResult && (
          <Card className="p-4 bg-success/5 border-success/20 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={lastScanResult.student.photo}
                alt={lastScanResult.student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-success"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-success-foreground">
                  {lastScanResult.student.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ID: {lastScanResult.student.studentId}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">
                    {Math.round(lastScanResult.confidence * 100)}% match
                  </span>
                  <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                  <span className="text-sm text-muted-foreground">
                    {format(lastScanResult.timestamp, 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Today's Attendance Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-background border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Present Today</h3>
            <Badge variant="default" className="bg-success text-success-foreground">
              {presentStudents.length}
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {presentStudents.map((student) => {
              const record = todayAttendance.find(r => r.studentId === student.id);
              return (
                <div key={student.id} className="flex items-center gap-3 p-2 bg-success/5 rounded-lg">
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record && format(record.timestamp, 'HH:mm')}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                </div>
              );
            })}
            
            {presentStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No students present yet today
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-background border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Absent Today</h3>
            <Badge variant="outline" className="border-warning text-warning">
              {absentStudents.length}
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {absentStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-2 bg-warning/5 rounded-lg">
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-8 h-8 rounded-full object-cover opacity-60"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.studentId}</p>
                </div>
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              </div>
            ))}
            
            {absentStudents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All students are present!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};