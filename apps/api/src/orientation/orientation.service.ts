import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrientationSessionStatus, Prisma, QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerInputDto } from './dto/submit-answers.dto';
import { SaveOrientationSessionDto } from './dto/save-session.dto';
import {
  AssessmentResultResponseDto,
  OrientationSessionResponseDto,
  OrientationSessionSummaryDto,
} from './dto/session-response.dto';
import {
  QuestionWithCategory,
  SessionRecord,
  currentElapsedMs,
  toJsonValue,
  toResultResponse,
  toSessionResponse,
  toSessionSummary,
} from './orientation.mapper';
import { PlacementService } from '../placement/placement.service';
import { computeAssessment } from './scoring/score-engine';

const sessionInclude = {
  student: true,
  answers: true,
  result: true,
} satisfies Prisma.OrientationSessionInclude;

@Injectable()
export class OrientationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly placementService: PlacementService,
  ) {}

  async create(studentId: string, createdById: string): Promise<OrientationSessionResponseDto> {
    await this.ensureStudent(studentId);

    const existing = await this.prisma.orientationSession.findFirst({
      where: {
        studentId,
        status: { not: OrientationSessionStatus.COMPLETED },
      },
      include: sessionInclude,
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.toResponse(existing);
    }

    const session = await this.prisma.orientationSession.create({
      data: { studentId, createdById },
    });

    return this.toResponse(await this.getSession(session.id));
  }

  async findAll(studentId?: string): Promise<OrientationSessionSummaryDto[]> {
    if (studentId) {
      await this.ensureStudent(studentId);
    }

    const sessions = await this.prisma.orientationSession.findMany({
      where: studentId ? { studentId } : undefined,
      include: { result: true },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => toSessionSummary(session));
  }

  async findOne(id: string): Promise<OrientationSessionResponseDto> {
    return this.toResponse(await this.getSession(id));
  }

  async start(id: string): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    this.assertNotCompleted(session);

    if (session.status === OrientationSessionStatus.IN_PROGRESS) {
      return this.toResponse(session);
    }

    if (session.status === OrientationSessionStatus.PAUSED) {
      throw new ConflictException('Paused sessions must be resumed, not started');
    }

    const now = new Date();
    await this.prisma.orientationSession.update({
      where: { id },
      data: {
        status: OrientationSessionStatus.IN_PROGRESS,
        startedAt: session.startedAt ?? now,
        lastResumedAt: now,
        pausedAt: null,
      },
    });

    return this.toResponse(await this.getSession(id), now);
  }

  async pause(id: string): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    this.assertNotCompleted(session);

    if (session.status !== OrientationSessionStatus.IN_PROGRESS) {
      throw new ConflictException('Only a running session can be paused');
    }

    const now = new Date();
    await this.prisma.orientationSession.update({
      where: { id },
      data: {
        status: OrientationSessionStatus.PAUSED,
        elapsedMs: currentElapsedMs(session, now),
        lastResumedAt: null,
        pausedAt: now,
      },
    });

    return this.toResponse(await this.getSession(id), now);
  }

  async resume(id: string): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    this.assertNotCompleted(session);

    if (session.status !== OrientationSessionStatus.PAUSED) {
      throw new ConflictException('Only a paused session can be resumed');
    }

    const now = new Date();
    await this.prisma.orientationSession.update({
      where: { id },
      data: {
        status: OrientationSessionStatus.IN_PROGRESS,
        lastResumedAt: now,
        pausedAt: null,
      },
    });

    return this.toResponse(await this.getSession(id), now);
  }

  async save(id: string, dto: SaveOrientationSessionDto): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    this.assertNotCompleted(session);

    if (dto.answers?.length) {
      await this.persistAnswers(session.id, dto.answers);
    }

    await this.prisma.orientationSession.update({
      where: { id },
      data: {
        notes: dto.notes ?? session.notes,
        currentStage: dto.currentStage ?? session.currentStage,
      },
    });

    return this.toResponse(await this.getSession(id));
  }

  async submitAnswers(
    id: string,
    answers: AnswerInputDto[],
  ): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    this.assertNotCompleted(session);
    await this.persistAnswers(session.id, answers);
    return this.toResponse(await this.getSession(id));
  }

  async complete(id: string): Promise<OrientationSessionResponseDto> {
    const session = await this.getSession(id);
    if (session.status === OrientationSessionStatus.COMPLETED && session.result) {
      return this.toResponse(session);
    }

    const questions = await this.loadQuestions();
    const now = new Date();
    const elapsedMs = currentElapsedMs(session, now);
    const computation = this.score(questions, session.answers, true);

    for (const answer of session.answers) {
      await this.prisma.assessmentAnswer.update({
        where: { id: answer.id },
        data: { score: computation.questionScores[answer.questionId] ?? null },
      });
    }

    await this.prisma.orientationSession.update({
      where: { id },
      data: {
        status: OrientationSessionStatus.COMPLETED,
        elapsedMs,
        lastResumedAt: null,
        pausedAt: session.status === OrientationSessionStatus.IN_PROGRESS ? now : session.pausedAt,
        completedAt: now,
        startedAt: session.startedAt ?? now,
      },
    });

    await this.prisma.assessmentResult.upsert({
      where: { sessionId: id },
      update: {
        overallScore: computation.overallScore,
        categoryScores: toJsonValue(computation.categoryScores),
        skillScores: toJsonValue(computation.skillScores),
        summary: computation.summary,
        completedAt: now,
      },
      create: {
        sessionId: id,
        overallScore: computation.overallScore,
        categoryScores: toJsonValue(computation.categoryScores),
        skillScores: toJsonValue(computation.skillScores),
        summary: computation.summary,
        completedAt: now,
      },
    });

    return this.toResponse(await this.getSession(id), now);
  }

  async getResult(id: string): Promise<AssessmentResultResponseDto> {
    const session = await this.getSession(id);
    if (!session.result) {
      throw new NotFoundException(
        'Assessment result is not available until the session is completed',
      );
    }

    const result = toResultResponse(session.result);
    result.placement = await this.placementService.applyFromAssessmentResult(session.result.id);
    return result;
  }

  private async persistAnswers(sessionId: string, inputs: AnswerInputDto[]): Promise<void> {
    const questions = await this.loadQuestions();
    const questionsById = new Map(questions.map((question) => [question.id, question]));

    for (const input of inputs) {
      const question = questionsById.get(input.questionId);
      if (!question) {
        throw new BadRequestException(`Unknown question ${input.questionId}`);
      }

      this.validateAnswer(question, input);

      await this.prisma.assessmentAnswer.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: question.id,
          },
        },
        update: {
          optionId: input.optionId ?? null,
          numericValue: input.numericValue ?? null,
          textValue: input.textValue ?? null,
          score: null,
        },
        create: {
          sessionId,
          questionId: question.id,
          optionId: input.optionId ?? null,
          numericValue: input.numericValue ?? null,
          textValue: input.textValue ?? null,
        },
      });
    }
  }

  private validateAnswer(question: QuestionWithCategory, input: AnswerInputDto): void {
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      if (!input.optionId) {
        throw new BadRequestException(`Question ${question.id} requires an option`);
      }
      if (!question.options.some((option) => option.id === input.optionId)) {
        throw new BadRequestException(`Option does not belong to question ${question.id}`);
      }
    }

    if (question.type === QuestionType.RATING && input.numericValue !== undefined) {
      if (input.numericValue > question.scaleMax) {
        throw new BadRequestException(`Rating must be between 0 and ${question.scaleMax}`);
      }
    }

    if (
      (question.type === QuestionType.MENTOR_EVALUATION ||
        question.type === QuestionType.PRACTICAL_EVALUATION ||
        (question.type === QuestionType.FREE_TEXT && question.scored)) &&
      input.numericValue !== undefined &&
      input.numericValue !== null &&
      (input.numericValue < 0 || input.numericValue > question.maxScore)
    ) {
      throw new BadRequestException(`Score must be between 0 and ${question.maxScore}`);
    }
  }

  private score(
    questions: QuestionWithCategory[],
    answers: SessionRecord['answers'],
    missingAsZero: boolean,
  ) {
    return computeAssessment({
      questions: questions.map((question) => ({
        id: question.id,
        categoryCode: question.category.code,
        type: question.type,
        skillKey: question.skillKey,
        scored: question.scored,
        maxScore: question.maxScore,
        scaleMax: question.scaleMax,
      })),
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        optionId: answer.optionId,
        numericValue: answer.numericValue,
        textValue: answer.textValue,
      })),
      options: questions.flatMap((question) =>
        question.options.map((option) => ({
          id: option.id,
          questionId: option.questionId,
          scoreValue: option.scoreValue,
        })),
      ),
      missingAsZero,
    });
  }

  private async toResponse(
    session: SessionRecord,
    now = new Date(),
  ): Promise<OrientationSessionResponseDto> {
    const questions = await this.loadQuestions();
    const response = toSessionResponse(session, questions, now);
    if (response.result) {
      response.result.placement =
        (await this.placementService.applyFromCompletedSession(session.id)) ?? null;
    }
    return response;
  }

  private async loadQuestions(): Promise<QuestionWithCategory[]> {
    return this.prisma.assessmentQuestion.findMany({
      include: { category: true, options: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private async getSession(id: string): Promise<SessionRecord> {
    const session = await this.prisma.orientationSession.findUnique({
      where: { id },
      include: sessionInclude,
    });

    if (!session) {
      throw new NotFoundException('Orientation session not found');
    }

    return session;
  }

  private async ensureStudent(studentId: string): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
  }

  private assertNotCompleted(session: SessionRecord): void {
    if (session.status === OrientationSessionStatus.COMPLETED) {
      throw new ConflictException('Completed sessions cannot be changed');
    }
  }
}
