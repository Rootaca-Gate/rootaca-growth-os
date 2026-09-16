import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StudentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginatedStudentsDto } from './dto/paginated-students.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { toStudentResponse } from './student.mapper';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto): Promise<StudentResponseDto> {
    const student = await this.prisma.student.create({
      data: this.toCreateData(dto),
    });

    return toStudentResponse(student);
  }

  async findAll(query: QueryStudentsDto): Promise<PaginatedStudentsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = this.buildWhere(query);

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      items: students.map(toStudentResponse),
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 0,
    };
  }

  async findOne(id: string): Promise<StudentResponseDto> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { currentLevel: { include: { rules: true } }, currentPath: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return toStudentResponse(student);
  }

  async update(id: string, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    await this.ensureExists(id);
    const student = await this.prisma.student.update({
      where: { id },
      data: this.toUpdateData(dto),
    });

    return toStudentResponse(student);
  }

  async updateStatus(id: string, status: StudentStatus): Promise<StudentResponseDto> {
    await this.ensureExists(id);
    const student = await this.prisma.student.update({
      where: { id },
      data: { status },
    });

    return toStudentResponse(student);
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Student not found');
    }
  }

  private buildWhere(query: QueryStudentsDto): Prisma.StudentWhereInput {
    const search = query.search?.trim();

    return {
      AND: [
        query.status ? { status: query.status } : {},
        query.level ? { level: query.level } : {},
        query.path ? { path: query.path } : {},
        search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { parentContact: { contains: search, mode: 'insensitive' } },
                { schoolGrade: { contains: search, mode: 'insensitive' } },
                { learningGoal: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };
  }

  private toCreateData(dto: CreateStudentDto): Prisma.StudentCreateInput {
    return {
      ...this.toProfileData(dto),
      status: dto.status ?? StudentStatus.INTAKE,
    };
  }

  private toUpdateData(dto: UpdateStudentDto): Prisma.StudentUpdateInput {
    return this.toProfileData(dto);
  }

  private toProfileData(dto: CreateStudentDto | UpdateStudentDto): Prisma.StudentCreateInput {
    return {
      fullName: dto.fullName.trim(),
      dateOfBirth: this.parseDateOfBirth(dto.dateOfBirth),
      schoolGrade: dto.schoolGrade.trim(),
      phone: dto.phone.trim(),
      parentContact: dto.parentContact.trim(),
      programmingExperience: dto.programmingExperience,
      programmingLanguages: dto.programmingLanguages.map((item) => item.trim()).filter(Boolean),
      interests: dto.interests.map((item) => item.trim()).filter(Boolean),
      learningGoal: dto.learningGoal.trim(),
      availableHoursPerWeek: dto.availableHoursPerWeek,
      englishLevel: dto.englishLevel,
      level: dto.level,
      path: dto.path,
    };
  }

  private parseDateOfBirth(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date of birth');
    }

    const now = new Date();
    const min = new Date(Date.UTC(now.getUTCFullYear() - 25, 0, 1));
    const max = new Date(Date.UTC(now.getUTCFullYear() - 6, now.getUTCMonth(), now.getUTCDate()));

    if (date > max || date < min) {
      throw new BadRequestException('Student age must be between 6 and 25 years');
    }

    return date;
  }
}
