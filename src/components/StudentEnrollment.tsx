import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CameraCapture } from './CameraCapture';
import { faceRecognition } from '@/lib/face-recognition';
import { db, Student } from '@/lib/database';
import { UserPlus, Loader2 } from 'lucide-react';

export const StudentEnrollment = () => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    toast({
      title: "Photo Captured",
      description: "Photo captured successfully. Please fill in the details and enroll.",
    });
  };

  const enrollStudent = async () => {
    if (!name || !studentId || !capturedImage) {
      toast({
        title: "Missing Information",
        description: "Please provide name, student ID, and capture a photo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize face recognition if not already done
      await faceRecognition.initialize();

      // Create image element from captured data
      const img = new Image();
      img.src = capturedImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Extract face descriptor
      const descriptor = await faceRecognition.extractFaceDescriptor(img);
      
      if (!descriptor) {
        toast({
          title: "Face Detection Failed",
          description: "No face detected in the captured image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Check if student ID already exists
      const existingStudents = await db.getAllStudents();
      const existingStudent = existingStudents.find(s => s.studentId === studentId);
      
      if (existingStudent) {
        toast({
          title: "Student ID Exists",
          description: "A student with this ID is already enrolled.",
          variant: "destructive",
        });
        return;
      }

      // Create student record
      const student: Student = {
        id: crypto.randomUUID(),
        name,
        studentId,
        faceDescriptor: descriptor,
        photo: capturedImage,
        enrolledAt: new Date(),
      };

      await db.addStudent(student);

      toast({
        title: "Student Enrolled",
        description: `${name} has been successfully enrolled.`,
      });

      // Reset form
      setName('');
      setStudentId('');
      setCapturedImage(null);

    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: "An error occurred during enrollment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-background border shadow-soft">
        <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
          Student Enrollment
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Capture Student Photo</Label>
            <CameraCapture 
              onCapture={handleImageCapture}
              isCapturing={isProcessing}
            />
            
            {capturedImage && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Captured Photo</Label>
                <div className="mt-2 border rounded-lg overflow-hidden bg-card">
                  <img 
                    src={capturedImage} 
                    alt="Captured student" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="studentName" className="text-base font-semibold">
                Student Name
              </Label>
              <Input
                id="studentName"
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="studentId" className="text-base font-semibold">
                Student ID
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-2"
                disabled={isProcessing}
              />
            </div>

            <Button
              onClick={enrollStudent}
              disabled={isProcessing || !name || !studentId || !capturedImage}
              className="w-full bg-gradient-primary hover:shadow-medium transition-all duration-300 mt-6"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll Student
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};