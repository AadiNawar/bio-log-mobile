import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  faceDescriptor: number[];
  photo: string; // base64 image
  enrolledAt: Date;
  lastAttendance?: Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: Date;
  method: 'face-recognition' | 'manual';
  confidence?: number;
}

interface AttendanceDB extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: { 'by-student-id': string };
  };
  attendance: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-student': string; 'by-date': Date };
  };
}

class DatabaseManager {
  private db: IDBPDatabase<AttendanceDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<AttendanceDB>('attendance-system', 1, {
      upgrade(db) {
        // Students store
        const studentStore = db.createObjectStore('students', {
          keyPath: 'id',
        });
        studentStore.createIndex('by-student-id', 'studentId', { unique: true });

        // Attendance store
        const attendanceStore = db.createObjectStore('attendance', {
          keyPath: 'id',
        });
        attendanceStore.createIndex('by-student', 'studentId');
        attendanceStore.createIndex('by-date', 'timestamp');
      },
    });
  }

  async addStudent(student: Student): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.add('students', student);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('students', id);
  }

  async getAllStudents(): Promise<Student[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('students');
  }

  async updateStudent(student: Student): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('students', student);
  }

  async deleteStudent(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('students', id);
  }

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.add('attendance', record);
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    if (!this.db) await this.init();
    return await this.db!.getAllFromIndex('attendance', 'by-student', studentId);
  }

  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    if (!this.db) await this.init();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const allRecords = await this.db!.getAll('attendance');
    return allRecords.filter(record => 
      record.timestamp >= today && record.timestamp < tomorrow
    );
  }
}

export const db = new DatabaseManager();