import { LevelCode, PathCode, SkillCode } from '@prisma/client';

export type TemplateItemDef = {
  title: string;
  description: string;
  skill: SkillCode;
  durationDays: number;
};

export type TemplatePhaseDef = {
  title: string;
  description: string;
  items: TemplateItemDef[];
};

export type RoadmapTemplateDef = {
  path: PathCode;
  level: LevelCode;
  name: string;
  description: string;
  phases: TemplatePhaseDef[];
};

const DURATION: Record<LevelCode, number> = {
  EXPLORER: 5,
  BEGINNER: 7,
  FOUNDATION: 9,
  INTERMEDIATE: 12,
  ADVANCED: 14,
};

const PHASES: Record<LevelCode, [string, string][]> = {
  EXPLORER: [
    ['Explore', 'Low-stakes trials that build confidence with a mentor nearby.'],
    ['Try', 'Repeat a small pattern until it feels familiar.'],
    ['Share', 'Show a tiny result and talk about what was hard.'],
  ],
  BEGINNER: [
    ['Foundations', 'Guided setup and first successful change.'],
    ['Practice', 'Short exercises with a visible outcome.'],
    ['Mini project', 'Finish one small artifact with support.'],
  ],
  FOUNDATION: [
    ['Core skills', 'Lock in the path vocabulary and basic workflow.'],
    ['Build', 'Assemble a small feature from a brief.'],
    ['Review', 'Debug, explain, and tidy the work.'],
  ],
  INTERMEDIATE: [
    ['Plan', 'Break a brief into tasks and estimate effort.'],
    ['Ship', 'Build and iterate with increasing independence.'],
    ['Reflect', 'Review quality, git history, and next gaps.'],
  ],
  ADVANCED: [
    ['Architecture', 'Choose structure and justify trade-offs.'],
    ['Independent build', 'Own a slice end to end.'],
    ['Critique', 'Review, document, and set the next milestone.'],
  ],
};

type PathCopy = {
  name: string;
  noun: string;
  tool: string;
  artifact: string;
  ship: string;
  skills: [SkillCode, SkillCode, SkillCode];
};

const PATHS: Record<PathCode, PathCopy> = {
  WEB: {
    name: 'Web',
    noun: 'web',
    tool: 'HTML, CSS, and the browser',
    artifact: 'page',
    ship: 'small website',
    skills: [
      SkillCode.TECHNICAL_KNOWLEDGE,
      SkillCode.PROGRAMMING_FUNDAMENTALS,
      SkillCode.GIT_GITHUB,
    ],
  },
  MOBILE: {
    name: 'Mobile',
    noun: 'mobile',
    tool: 'Flutter-style screens',
    artifact: 'screen',
    ship: 'simple app',
    skills: [
      SkillCode.PRACTICAL_SKILLS,
      SkillCode.PROGRAMMING_FUNDAMENTALS,
      SkillCode.INDEPENDENCE,
    ],
  },
  DATA: {
    name: 'Data',
    noun: 'data',
    tool: 'Python and a dataset',
    artifact: 'notebook',
    ship: 'charted analysis',
    skills: [
      SkillCode.PROBLEM_SOLVING,
      SkillCode.COMPUTER_SCIENCE_BASICS,
      SkillCode.PROGRAMMING_FUNDAMENTALS,
    ],
  },
  GAME: {
    name: 'Game',
    noun: 'game',
    tool: 'sprites and interaction',
    artifact: 'scene',
    ship: 'playable loop',
    skills: [SkillCode.PRACTICAL_SKILLS, SkillCode.PROBLEM_SOLVING, SkillCode.PROJECT_DEVELOPMENT],
  },
  GENERAL: {
    name: 'General',
    noun: 'making',
    tool: 'a visual or text editor',
    artifact: 'demo',
    ship: 'shared experiment',
    skills: [SkillCode.COMMUNICATION, SkillCode.PROGRAMMING_FUNDAMENTALS, SkillCode.INDEPENDENCE],
  },
};

const LEVEL_LABEL: Record<LevelCode, string> = {
  EXPLORER: 'Explorer',
  BEGINNER: 'Beginner',
  FOUNDATION: 'Foundation',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

export function buildRoadmapTemplateCatalog(): RoadmapTemplateDef[] {
  const templates: RoadmapTemplateDef[] = [];

  for (const path of Object.values(PathCode) as PathCode[]) {
    for (const level of Object.values(LevelCode) as LevelCode[]) {
      templates.push(buildTemplate(path, level));
    }
  }

  return templates;
}

function buildTemplate(path: PathCode, level: LevelCode): RoadmapTemplateDef {
  const copy = PATHS[path];
  const days = DURATION[level];
  const phases = PHASES[level].map(([title, description], index) => ({
    title,
    description,
    items: itemsFor(copy, level, days, index),
  }));

  return {
    path,
    level,
    name: `${copy.name} · ${LEVEL_LABEL[level]}`,
    description: `A ${LEVEL_LABEL[level].toLowerCase()} ${copy.noun} roadmap using ${copy.tool}.`,
    phases,
  };
}

function itemsFor(
  copy: PathCopy,
  level: LevelCode,
  days: number,
  phaseIndex: number,
): TemplateItemDef[] {
  const [skillA, skillB, skillC] = copy.skills;
  const brief = levelBrief(level);

  if (phaseIndex === 0) {
    return [
      {
        title: `Set up the ${copy.noun} workspace`,
        description: `${brief} Open ${copy.tool} and save a first ${copy.artifact}.`,
        skill: skillA,
        durationDays: days,
      },
      {
        title: `Learn the ${copy.noun} building blocks`,
        description: `${brief} Name the core pieces of a ${copy.artifact} and change one with intent.`,
        skill: skillB,
        durationDays: days,
      },
    ];
  }

  if (phaseIndex === 1) {
    const items: TemplateItemDef[] = [
      {
        title: `Practice a ${copy.noun} pattern`,
        description: `${brief} Repeat a small pattern until the ${copy.artifact} updates predictably.`,
        skill: skillB,
        durationDays: days,
      },
      {
        title: `Debug a broken ${copy.artifact}`,
        description: `${brief} Break something on purpose, then restore it and write what you checked.`,
        skill: SkillCode.DEBUGGING,
        durationDays: days,
      },
    ];

    if (level === LevelCode.INTERMEDIATE || level === LevelCode.ADVANCED) {
      items.push({
        title: `Save the ${copy.noun} work in Git`,
        description: `${brief} Commit with a clear message and share the history with a mentor.`,
        skill: SkillCode.GIT_GITHUB,
        durationDays: Math.max(5, days - 2),
      });
    }

    return items;
  }

  return [
    {
      title: `Ship a ${copy.ship}`,
      description: `${brief} Finish a ${copy.ship} that someone else can try without you present.`,
      skill: skillC,
      durationDays: days + 3,
    },
    {
      title: `Explain the ${copy.noun} result`,
      description: `${brief} Walk through what worked, what blocked you, and the next skill to grow.`,
      skill: SkillCode.COMMUNICATION,
      durationDays: Math.max(4, days - 3),
    },
  ];
}

function levelBrief(level: LevelCode): string {
  switch (level) {
    case LevelCode.EXPLORER:
      return 'Keep it playful and short.';
    case LevelCode.BEGINNER:
      return 'Work from a mentor example, then change one detail.';
    case LevelCode.FOUNDATION:
      return 'Follow a brief and ask before skipping a step.';
    case LevelCode.INTERMEDIATE:
      return 'Plan first, then build with less prompting.';
    case LevelCode.ADVANCED:
      return 'Own the slice, including trade-offs and review.';
  }
}
