import { LearningPath, Level, Student } from '@prisma/client';
import { toLearningPathResponse, toLevelResponse } from '../placement/placement.mapper';
import { StudentResponseDto } from './dto/student-response.dto';

export type StudentRecord = Student & {
  currentLevel?: Level | null;
  currentPath?: LearningPath | null;
};

export function toStudentResponse(student: StudentRecord): StudentResponseDto {
  return {
    id: student.id,
    fullName: student.fullName,
    dateOfBirth: student.dateOfBirth.toISOString().slice(0, 10),
    schoolGrade: student.schoolGrade,
    phone: student.phone,
    parentContact: student.parentContact,
    programmingExperience: student.programmingExperience,
    programmingLanguages: student.programmingLanguages,
    interests: student.interests,
    learningGoal: student.learningGoal,
    availableHoursPerWeek: student.availableHoursPerWeek,
    englishLevel: student.englishLevel,
    status: student.status,
    level: student.level,
    path: student.path,
    currentLevel: student.currentLevel ? toLevelResponse(student.currentLevel) : null,
    currentPath: student.currentPath ? toLearningPathResponse(student.currentPath) : null,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}
