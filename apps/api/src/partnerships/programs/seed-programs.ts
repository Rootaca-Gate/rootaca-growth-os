import {
  PartnershipDeliveryFormat,
  PartnershipProgramLevel,
  PartnershipProgramRequirementKind,
  PartnershipProgramRequirementPriority,
  PartnershipProgramStatus,
  PartnershipProgramType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PROJECT_CATALOG } from '../../projects/catalog/project-catalog';

type SeedAssessment = {
  key: string;
  label: string;
  description: string;
  sortOrder: number;
};

type SeedProgram = {
  name: string;
  displayOrder: number;
  programType: PartnershipProgramType;
  shortDescription: string;
  targetAge: string | null;
  targetGrades: string | null;
  recommendedLevel: PartnershipProgramLevel;
  recommendedStudentProfile?: string;
  schoolValue: string;
  studentValue: string;
  objectives: { title: string; description: string }[];
  curriculumModules: { title: string; description: string; skillsDeveloped: string }[];
  activities: { name: string; description: string; skillsDeveloped: string }[];
  outcomes?: { title: string; description: string }[];
  sampleProjects: {
    name: string;
    description: string;
    skills: string;
    expectedOutput: string;
  }[];
  finalProject: {
    name: string;
    description: string;
    expectedOutput: string;
    evaluationMethod: string;
  };
  deliveryFormats: PartnershipDeliveryFormat[];
  equipment: { label: string; description: string }[];
  school: { label: string; description: string }[];
};

function catalogProject(name: string) {
  const item = PROJECT_CATALOG.find((entry) => entry.name === name);
  if (!item) {
    throw new Error(`Missing ROOTACA catalog project: ${name}`);
  }
  return item;
}

const DEFAULT_ASSESSMENTS: SeedAssessment[] = [
  {
    key: 'INITIAL',
    label: 'Initial assessment',
    description: 'Baseline check of prior exposure, comfort with tools, and learning habits.',
    sortOrder: 0,
  },
  {
    key: 'PRACTICAL',
    label: 'Practical labs',
    description: 'In-class exercises scored on completion, correctness, and mentor observation.',
    sortOrder: 1,
  },
  {
    key: 'ASSIGNMENTS',
    label: 'Assignments',
    description: 'Short take-home tasks reinforcing the current module.',
    sortOrder: 2,
  },
  {
    key: 'PROJECT',
    label: 'Studio projects',
    description: 'ROOTACA catalog studio projects with defined expected outputs.',
    sortOrder: 3,
  },
  {
    key: 'FINAL',
    label: 'Final capstone',
    description: 'End-of-program deliverable reviewed with a structured rubric.',
    sortOrder: 4,
  },
];

const DEFAULT_EQUIPMENT: { label: string; description: string }[] = [
  {
    label: 'Student laptops or lab PCs',
    description: 'One device per student with a modern browser and permission to install dev tools where needed.',
  },
  {
    label: 'Stable internet',
    description: 'Enough bandwidth for documentation, Git hosting, and live mentor demos.',
  },
];

const DEFAULT_SCHOOL: { label: string; description: string }[] = [
  {
    label: 'Dedicated weekly slot',
    description: 'Protected timetable block for instruction and supervised practice.',
  },
  {
    label: 'Faculty liaison',
    description: 'Named school contact for scheduling, attendance, and parent communication.',
  },
];

const PROGRAMS: SeedProgram[] = [
  {
    name: 'Programming Fundamentals',
    displayOrder: 10,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription:
      'Foundational computational thinking, variables, control flow, and debugging for first-time coders.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.BEGINNER,
    recommendedStudentProfile: '',
    schoolValue:
      'Adds a structured coding pathway without requiring specialist faculty—ROOTACA mentors lead delivery while the school keeps students on campus.',
    studentValue:
      'Students learn to break problems into steps, read error messages, and ship small programs they can explain to peers.',
    objectives: [
      {
        title: 'Computational thinking',
        description: 'Decompose problems, recognize patterns, and express solutions as clear sequences.',
      },
      {
        title: 'Core syntax literacy',
        description: 'Variables, conditionals, loops, and functions in a beginner-friendly language.',
      },
      {
        title: 'Debugging habits',
        description: 'Use print/logging, hypothesis testing, and mentor checkpoints to fix code.',
      },
    ],
    curriculumModules: [
      {
        title: 'Algorithms & Logical Thinking',
        description: 'Break problems into ordered steps, spot patterns, and express solutions clearly.',
        skillsDeveloped: 'Decomposition, Sequencing, Pattern recognition',
      },
      {
        title: 'Variables & Data',
        description: 'Store, update, and validate information the program needs to run correctly.',
        skillsDeveloped: 'Data modeling, Naming, Input validation',
      },
      {
        title: 'Control Flow',
        description: 'Branch on conditions and repeat actions with loops in guided challenges.',
        skillsDeveloped: 'Conditionals, Loops, Logic',
      },
      {
        title: 'Functions',
        description: 'Extract reusable blocks and call them with clear inputs and outputs.',
        skillsDeveloped: 'Abstraction, Reuse, Parameters',
      },
      {
        title: 'Debugging',
        description: 'Read errors, test hypotheses, and fix code with mentor checkpoints.',
        skillsDeveloped: 'Debugging, Error reading, Persistence',
      },
      {
        title: 'Practical Project',
        description: 'Plan, build, and demo a small capstone program tying prior modules together.',
        skillsDeveloped: 'Planning, Integration, Presentation',
      },
    ],
    activities: [
      {
        name: 'Trace the robot',
        description: 'Students act out or simulate instructions to see where ambiguity breaks programs.',
        skillsDeveloped: 'Sequencing, precision, communication',
      },
      {
        name: 'Bug Hunt Lab',
        description: 'Fix intentionally broken snippets using mentor-guided debugging checklists.',
        skillsDeveloped: 'Debugging, Problem Solving, Persistence',
      },
    ],
    outcomes: [
      {
        title: 'Problem Solving',
        description: 'Decompose tasks and apply step-by-step reasoning to coding challenges.',
      },
      {
        title: 'Programming Foundations',
        description: 'Use variables, control flow, functions, and debugging in beginner-friendly code.',
      },
      {
        title: 'Practical Project Experience',
        description: 'Ship a small capstone program with a mentor-reviewed demo.',
      },
      {
        title: 'Communication',
        description: 'Explain code choices, bugs, and program behavior to peers and mentors.',
      },
      {
        title: 'Technology Confidence',
        description: 'Build comfort with dev tools, error messages, and iterative practice.',
      },
    ],
    sampleProjects: [],
    finalProject: {
      name: 'Personal quiz game',
      description: 'A capstone program the student designs: questions, scoring, and a replay loop.',
      expectedOutput: 'Runnable quiz with at least three questions and visible score feedback.',
      evaluationMethod: 'Rubric on correctness, clarity of rules, and student explanation during demo.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.AFTER_SCHOOL,
      PartnershipDeliveryFormat.CODING_CLUB,
      PartnershipDeliveryFormat.SEMESTER,
    ],
    equipment: DEFAULT_EQUIPMENT,
    school: DEFAULT_SCHOOL,
  },
  {
    name: 'Software Development',
    displayOrder: 20,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription:
      'Broader software craft: Git workflows, clean code basics, testing mindset, and small multi-file apps.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.BEGINNER_INTERMEDIATE,
    schoolValue:
      'Prepares students for secondary CS pathways and showcases measurable engineering habits on report cards and open days.',
    studentValue:
      'Students collaborate with Git, review peer work, and maintain a project they can extend term over term.',
    objectives: [
      {
        title: 'Version control basics',
        description: 'Commit, branch, and merge with mentor-reviewed pull requests.',
      },
      {
        title: 'Structured projects',
        description: 'Organize code across files and document setup for classmates.',
      },
      {
        title: 'Quality signals',
        description: 'Introduce tests, linting, and readable naming as professional habits.',
      },
    ],
    curriculumModules: [
      {
        title: 'Git & collaboration',
        description: 'Repositories, commits, and constructive code review.',
        skillsDeveloped: 'Version control, Collaboration, Code review',
      },
      {
        title: 'Application structure',
        description: 'Modules, configuration, and separation of concerns.',
        skillsDeveloped: 'Project structure, Modularity, Documentation',
      },
      {
        title: 'Testing & reliability',
        description: 'Happy-path tests and manual QA checklists.',
        skillsDeveloped: 'Testing, QA, Reliability',
      },
      {
        title: 'Delivery & demo',
        description: 'Packaging a release classmates can run locally.',
        skillsDeveloped: 'Release readiness, README craft, Demo skills',
      },
    ],
    outcomes: [
      {
        title: 'Version control fluency',
        description: 'Commit, branch, and merge with mentor-reviewed collaboration habits.',
      },
      {
        title: 'Structured engineering',
        description: 'Organize multi-file projects others can run and extend.',
      },
      {
        title: 'Quality mindset',
        description: 'Apply tests, linting, and readable naming as professional defaults.',
      },
      {
        title: 'Team delivery',
        description: 'Ship a shared utility with clear roles and documented setup.',
      },
    ],
    activities: [
      {
        name: 'Pair programming rotation',
        description: 'Driver/navigator swaps on a shared feature with timed retros.',
        skillsDeveloped: 'Collaboration, communication, Git',
      },
      {
        name: 'Code review clinic',
        description: 'Students critique anonymized snippets for naming, structure, and edge cases.',
        skillsDeveloped: 'Critical reading, empathy, quality bar',
      },
    ],
    sampleProjects: [],
    finalProject: {
      name: 'Team utility app',
      description: 'Small groups ship a tool for their class (attendance helper, study timer, or similar).',
      expectedOutput: 'Multi-file repo with README, demo script, and one automated check.',
      evaluationMethod: 'Team demo plus individual reflection on contributions and Git history.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.SEMESTER,
      PartnershipDeliveryFormat.ANNUAL,
      PartnershipDeliveryFormat.CUSTOMIZED,
    ],
    equipment: [
      ...DEFAULT_EQUIPMENT,
      {
        label: 'Git hosting access',
        description: 'School-approved GitHub/GitLab organization or classroom accounts.',
      },
    ],
    school: DEFAULT_SCHOOL,
  },
  {
    name: 'Web Development',
    displayOrder: 30,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription: 'HTML, CSS, and interactive web pages culminating in publishable student sites.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.BEGINNER_INTERMEDIATE,
    schoolValue:
      'Visible student portfolios for admissions events—every learner ships pages the school can link from its site.',
    studentValue:
      'Students author pages they own, practice accessibility basics, and explain layout choices aloud.',
    objectives: [
      {
        title: 'Semantic HTML',
        description: 'Structure content for humans and assistive technologies.',
      },
      {
        title: 'Layout & styling',
        description: 'Flexbox/grid fundamentals and responsive tweaks.',
      },
      {
        title: 'Light interactivity',
        description: 'DOM events and small scripts that enhance learning pages.',
      },
    ],
    curriculumModules: [
      {
        title: 'Page structure',
        description: 'Headings, landmarks, links, and media.',
        skillsDeveloped: 'HTML, Semantics, Accessibility basics',
      },
      {
        title: 'Visual design with CSS',
        description: 'Typography, spacing, color, and components.',
        skillsDeveloped: 'CSS, Typography, Visual hierarchy',
      },
      {
        title: 'Responsive layouts',
        description: 'Breakpoints and mobile-first adjustments.',
        skillsDeveloped: 'Responsive design, Flexbox, Layout',
      },
      {
        title: 'Publishing',
        description: 'Static hosting workflow and performance basics.',
        skillsDeveloped: 'Deployment, Performance awareness, Hosting',
      },
    ],
    outcomes: [
      {
        title: 'Semantic web pages',
        description: 'Structure content for readers and assistive technologies.',
      },
      {
        title: 'Layout & styling craft',
        description: 'Apply CSS for readable, responsive student-owned pages.',
      },
      {
        title: 'Interactive enhancements',
        description: 'Add light scripts and events that support learning goals.',
      },
      {
        title: 'Publishable portfolio',
        description: 'Ship a site the school can showcase with mentor-reviewed accessibility notes.',
      },
    ],
    activities: [
      {
        name: 'Accessibility audit',
        description: 'Teams review classmates’ pages with WCAG-inspired checklists.',
        skillsDeveloped: 'Empathy, detail orientation, HTML semantics',
      },
      {
        name: 'Layout challenge',
        description: 'Recreate a mentor wireframe using flexbox within a time box.',
        skillsDeveloped: 'CSS layout, iteration under constraints',
      },
    ],
    sampleProjects: (() => {
      const firstWeb = catalogProject('First Web Page Studio');
      const learningLog = catalogProject('Learning Log Site');
      return [
        {
          name: firstWeb.name,
          description: firstWeb.description,
          skills: 'HTML, CSS, basic interactivity',
          expectedOutput: firstWeb.learningGoal,
        },
        {
          name: learningLog.name,
          description: learningLog.description,
          skills: 'Content structure, dated entries, media embeds',
          expectedOutput: learningLog.learningGoal,
        },
      ];
    })(),
    finalProject: {
      name: 'Personal learning site',
      description: 'Student-owned site combining portfolio, learning log, and one interactive feature.',
      expectedOutput: 'Published static site with navigation, three sections, and mentor-reviewed accessibility notes.',
      evaluationMethod: 'Live demo covering structure, styling choices, and one scripted user flow.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.WORKSHOP,
      PartnershipDeliveryFormat.AFTER_SCHOOL,
      PartnershipDeliveryFormat.SEMESTER,
    ],
    equipment: DEFAULT_EQUIPMENT,
    school: DEFAULT_SCHOOL,
  },
  {
    name: 'Mobile Development',
    displayOrder: 40,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription: 'Mobile UI patterns, state, and one-screen interactions using classroom-safe tooling.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.INTERMEDIATE,
    schoolValue:
      'Differentiates STEM offerings with tangible apps students demo on their own devices during showcases.',
    studentValue:
      'Learners connect layout, taps, and feedback loops while explaining design trade-offs.',
    objectives: [
      {
        title: 'Mobile UX basics',
        description: 'Touch targets, navigation patterns, and platform conventions.',
      },
      {
        title: 'State & events',
        description: 'Respond to taps and keep UI consistent with underlying data.',
      },
      {
        title: 'Testing on devices',
        description: 'Emulators plus at least one physical device check per milestone.',
      },
    ],
    curriculumModules: [
      {
        title: 'Screens & components',
        description: 'Compose reusable UI pieces.',
        skillsDeveloped: 'UI composition, Components, Layout',
      },
      {
        title: 'Navigation',
        description: 'Stack/tabs and passing data between views.',
        skillsDeveloped: 'Navigation patterns, Data passing, UX flow',
      },
      {
        title: 'State management intro',
        description: 'Lift state and predict UI updates.',
        skillsDeveloped: 'State, Events, UI consistency',
      },
      {
        title: 'Polish & performance',
        description: 'Loading states, errors, and simple profiling.',
        skillsDeveloped: 'Error states, Loading UX, Performance basics',
      },
    ],
    outcomes: [
      {
        title: 'Mobile UX literacy',
        description: 'Apply touch-friendly patterns and explain design trade-offs.',
      },
      {
        title: 'Interactive screens',
        description: 'Respond to taps and keep UI aligned with underlying data.',
      },
      {
        title: 'Device-ready builds',
        description: 'Test on emulators and physical devices with reproducible bug notes.',
      },
      {
        title: 'Showcase-ready demo',
        description: 'Present a one-screen app with clear state flow and a short demo script.',
      },
    ],
    activities: [
      {
        name: 'Gesture lab',
        description: 'Implement tap, long-press, and swipe handlers on a practice screen.',
        skillsDeveloped: 'Event handling, UX empathy',
      },
      {
        name: 'Device test hour',
        description: 'Rotate through classmates’ builds on real phones with a shared bug board.',
        skillsDeveloped: 'QA, communication, reproducibility',
      },
    ],
    sampleProjects: (() => {
      const mobile = catalogProject('Mobile Practice Screen');
      return [
        {
          name: mobile.name,
          description: mobile.description,
          skills: 'Layout, taps, state updates',
          expectedOutput: mobile.learningGoal,
        },
      ];
    })(),
    finalProject: {
      name: 'Classroom companion screen',
      description: 'One-screen app supporting a daily classroom routine chosen with the mentor.',
      expectedOutput: 'Runnable build with loading/error states and a two-minute demo script.',
      evaluationMethod: 'Device demo plus written explanation of state flow.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.AFTER_SCHOOL,
      PartnershipDeliveryFormat.SEMESTER,
      PartnershipDeliveryFormat.CODING_CLUB,
    ],
    equipment: [
      ...DEFAULT_EQUIPMENT,
      {
        label: 'Device lab or BYOD policy',
        description: 'At least one test device per pair; emulators for students without phones.',
      },
    ],
    school: DEFAULT_SCHOOL,
  },
  {
    name: 'Game Development',
    displayOrder: 50,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription: 'Game loops, scoring, and playful iteration anchored in classroom-safe arcade practice.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.BEGINNER,
    schoolValue:
      'High-energy STEM hook that still maps to computing standards through loops, events, and testing.',
    studentValue:
      'Students experience immediate feedback, iterate on fun, and present playable builds to peers.',
    objectives: [
      {
        title: 'Game loop literacy',
        description: 'Update, render, repeat—connect timing to player experience.',
      },
      {
        title: 'Rules & scoring',
        description: 'Encode win/lose states and fair scoring students can explain.',
      },
      {
        title: 'Playtesting',
        description: 'Gather feedback and tune difficulty with mentor facilitation.',
      },
    ],
    curriculumModules: [
      {
        title: 'Sprites & motion',
        description: 'Movement, boundaries, and simple physics.',
        skillsDeveloped: 'Animation, Motion, Game loops',
      },
      {
        title: 'Input & events',
        description: 'Keyboard/touch controls and responsive feedback.',
        skillsDeveloped: 'Input handling, Events, Feedback',
      },
      {
        title: 'Collision & scoring',
        description: 'Detect interactions and surface score to players.',
        skillsDeveloped: 'Collision logic, Scoring, Game rules',
      },
      {
        title: 'Juice & polish',
        description: 'Sound, particles, and tutorial prompts sparingly applied.',
        skillsDeveloped: 'Game feel, Iteration, Playtesting',
      },
    ],
    outcomes: [
      {
        title: 'Game loop understanding',
        description: 'Connect update-render cycles to what players experience.',
      },
      {
        title: 'Rules & scoring',
        description: 'Encode win/lose states and scoring students can explain aloud.',
      },
      {
        title: 'Playtest-driven iteration',
        description: 'Gather peer feedback and tune difficulty with mentor support.',
      },
      {
        title: 'Playable showcase build',
        description: 'Deliver an arcade-style game peers can finish in a short session.',
      },
    ],
    activities: [
      {
        name: 'Arcade playtest round',
        description: 'Rotate stations where classmates play builds and file structured feedback.',
        skillsDeveloped: 'Playtesting, iteration, communication',
      },
      {
        name: 'Balance tuning',
        description: 'Adjust speeds and spawn rates using data from three play sessions.',
        skillsDeveloped: 'Data-informed design, loops',
      },
    ],
    sampleProjects: (() => {
      const scratch = catalogProject('Scratch Arcade Lab');
      return [
        {
          name: scratch.name,
          description: scratch.description,
          skills: 'Loops, events, scoring',
          expectedOutput: scratch.learningGoal,
        },
      ];
    })(),
    finalProject: {
      name: 'Showcase arcade game',
      description: 'Original arcade-style game with start screen, core loop, and score display.',
      expectedOutput: 'Playable loop peers can finish in under three minutes with readable rules on-screen.',
      evaluationMethod: 'Playtest rubric covering fun, clarity, and technical stability.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.WORKSHOP,
      PartnershipDeliveryFormat.CODING_CLUB,
      PartnershipDeliveryFormat.SEMESTER,
    ],
    equipment: DEFAULT_EQUIPMENT,
    school: DEFAULT_SCHOOL,
  },
  {
    name: 'AI & Data',
    displayOrder: 60,
    programType: PartnershipProgramType.TECHNICAL,
    shortDescription: 'Data literacy, visualization, and responsible AI introductions using public datasets.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.INTERMEDIATE,
    schoolValue:
      'Modern STEM narrative aligned with AI curiosity—grounded in ethics, charts, and reproducible notebooks.',
    studentValue:
      'Students tell stories with data, critique sources, and articulate limits of automated tools.',
    objectives: [
      {
        title: 'Data questioning',
        description: 'Form hypotheses and choose metrics before touching tools.',
      },
      {
        title: 'Visualization craft',
        description: 'Pick chart types that match the story and annotate responsibly.',
      },
      {
        title: 'Responsible AI awareness',
        description: 'Discuss bias, privacy, and when automation is inappropriate.',
      },
    ],
    curriculumModules: [
      {
        title: 'Data sources & hygiene',
        description: 'CSV basics, missing values, and citations.',
        skillsDeveloped: 'Data literacy, Cleaning, Citations',
      },
      {
        title: 'Exploration & charts',
        description: 'Summaries, filters, and honest axes.',
        skillsDeveloped: 'Visualization, Analysis, Chart selection',
      },
      {
        title: 'Notebook workflow',
        description: 'Reproducible cells and mentor checkpoints.',
        skillsDeveloped: 'Reproducibility, Documentation, Workflow',
      },
      {
        title: 'AI in context',
        description: 'Prompt patterns, verification, and classroom policies.',
        skillsDeveloped: 'AI literacy, Ethics, Verification',
      },
    ],
    outcomes: [
      {
        title: 'Data questioning',
        description: 'Form hypotheses and choose metrics before analysis.',
      },
      {
        title: 'Honest visualization',
        description: 'Select chart types and annotations that match the story.',
      },
      {
        title: 'Reproducible analysis',
        description: 'Work in notebooks with cited sources and mentor checkpoints.',
      },
      {
        title: 'Responsible AI awareness',
        description: 'Discuss bias, privacy, and limits of automation in classroom work.',
      },
    ],
    activities: [
      {
        name: 'Chart critique',
        description: 'Compare good and misleading charts; rewrite titles and axes.',
        skillsDeveloped: 'Critical thinking, communication',
      },
      {
        name: 'Dataset scavenger hunt',
        description: 'Teams locate public datasets and document licensing constraints.',
        skillsDeveloped: 'Research, ethics, documentation',
      },
    ],
    sampleProjects: (() => {
      const notebook = catalogProject('Data Story Notebook');
      return [
        {
          name: notebook.name,
          description: notebook.description,
          skills: 'Data loading, charting, narrative writing',
          expectedOutput: notebook.learningGoal,
        },
      ];
    })(),
    finalProject: {
      name: 'Data story presentation',
      description: 'Notebook-driven story about a school-approved public dataset.',
      expectedOutput: 'One chart, three insight sentences, and a cited data source in the notebook.',
      evaluationMethod: 'Presentation rubric for accuracy, clarity, and ethical sourcing.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.SEMESTER,
      PartnershipDeliveryFormat.ANNUAL,
      PartnershipDeliveryFormat.WORKSHOP,
    ],
    equipment: [
      ...DEFAULT_EQUIPMENT,
      {
        label: 'Notebook runtime',
        description: 'Python or classroom-approved notebook environment with export to PDF.',
      },
    ],
    school: [
      ...DEFAULT_SCHOOL,
      {
        label: 'Data use policy',
        description: 'School approval for datasets involving students or sensitive topics.',
      },
    ],
  },
  {
    name: 'Baccalaureate Program',
    displayOrder: 70,
    programType: PartnershipProgramType.EDUCATIONAL,
    shortDescription:
      'Long-horizon ROOTACA partnership track aligning studio projects with baccalaureate-style rigor and documentation.',
    targetAge: null,
    targetGrades: null,
    recommendedLevel: PartnershipProgramLevel.INTERMEDIATE_ADVANCED,
    schoolValue:
      'Bundles mentor-led studios, assessment templates, and evidence packs suitable for college-facing portfolios.',
    studentValue:
      'Students maintain a multi-year artifact trail—projects, reflections, and assessed milestones.',
    objectives: [
      {
        title: 'Extended inquiry',
        description: 'Sustain a question across modules with documented iterations.',
      },
      {
        title: 'Evidence-rich portfolio',
        description: 'Collect artifacts mapped to rubrics and external exam expectations where applicable.',
      },
      {
        title: 'Academic integrity',
        description: 'Citation, collaboration norms, and mentor attestation of student work.',
      },
    ],
    curriculumModules: [
      {
        title: 'Inquiry framing',
        description: 'Research questions, success criteria, and ethics review.',
        skillsDeveloped: 'Research, Ethics, Planning',
      },
      {
        title: 'Studio cycles',
        description: 'Plan, build, review, and reflect on ROOTACA-aligned projects.',
        skillsDeveloped: 'Project cycles, Iteration, Reflection',
      },
      {
        title: 'Documentation standards',
        description: 'Logs, appendices, and viva-style presentations.',
        skillsDeveloped: 'Documentation, Presentation, Academic writing',
      },
      {
        title: 'Summative alignment',
        description: 'Map deliverables to school reporting periods.',
        skillsDeveloped: 'Milestone planning, Reporting, Alignment',
      },
    ],
    outcomes: [
      {
        title: 'Extended inquiry',
        description: 'Sustain a question across modules with documented iterations.',
      },
      {
        title: 'Evidence-rich portfolio',
        description: 'Collect artifacts mapped to rubrics and reporting expectations.',
      },
      {
        title: 'Academic integrity',
        description: 'Apply citation, collaboration norms, and mentor attestation of work.',
      },
      {
        title: 'Capstone defense readiness',
        description: 'Present curated artifacts with structured Q&A and reflection.',
      },
    ],
    activities: [
      {
        name: 'Portfolio defense rehearsal',
        description: 'Timed presentation with mentor Q&A using real artifacts.',
        skillsDeveloped: 'Communication, reflection, confidence',
      },
      {
        name: 'Cross-disciplinary sprint',
        description: 'Connect a CS artifact to another subject with teacher liaison input.',
        skillsDeveloped: 'Integration, planning, collaboration',
      },
    ],
    sampleProjects: (() => {
      const learningLog = catalogProject('Learning Log Site');
      return [
        {
          name: learningLog.name,
          description: learningLog.description,
          skills: 'Documentation, reflection, publishing',
          expectedOutput: learningLog.learningGoal,
        },
      ];
    })(),
    finalProject: {
      name: 'Capstone portfolio & defense',
      description: 'Curated portfolio spanning the partnership with a final oral defense.',
      expectedOutput: 'Indexed artifacts, rubric scores, and recorded defense summary approved by mentor and liaison.',
      evaluationMethod: 'Joint rubric: technical depth, documentation quality, and reflective narrative.',
    },
    deliveryFormats: [
      PartnershipDeliveryFormat.ANNUAL,
      PartnershipDeliveryFormat.SEMESTER,
      PartnershipDeliveryFormat.CUSTOMIZED,
    ],
    equipment: DEFAULT_EQUIPMENT,
    school: [
      ...DEFAULT_SCHOOL,
      {
        label: 'Exam officer coordination',
        description: 'Alignment touchpoints with school leadership on reporting timelines.',
      },
    ],
  },
];

function buildNestedCreate(
  program: SeedProgram,
): Omit<Prisma.PartnershipProgramCreateInput, 'name'> {
  return {
    shortDescription: program.shortDescription,
    programType: program.programType,
    targetAge: program.targetAge,
    targetGrades: program.targetGrades,
    recommendedLevel: program.recommendedLevel,
    recommendedStudentProfile: program.recommendedStudentProfile ?? '',
    status: PartnershipProgramStatus.ACTIVE,
    displayOrder: program.displayOrder,
    internalNotes: '',
    schoolValue: program.schoolValue,
    studentValue: program.studentValue,
    finalProjectName: program.finalProject.name,
    finalProjectDescription: program.finalProject.description,
    finalProjectExpectedOutput: program.finalProject.expectedOutput,
    finalProjectEvaluationMethod: program.finalProject.evaluationMethod,
    objectives: {
      create: program.objectives.map((item, index) => ({
        title: item.title,
        description: item.description,
        sortOrder: index,
      })),
    },
    curriculumModules: {
      create: program.curriculumModules.map((item, index) => ({
        title: item.title,
        description: item.description,
        skillsDeveloped: item.skillsDeveloped,
        sortOrder: index,
      })),
    },
    outcomes: {
      create: (program.outcomes ?? []).map((item, index) => ({
        title: item.title,
        description: item.description,
        sortOrder: index,
      })),
    },
    activities: {
      create: program.activities.map((item, index) => ({
        name: item.name,
        description: item.description,
        skillsDeveloped: item.skillsDeveloped,
        sortOrder: index,
      })),
    },
    sampleProjects: {
      create: program.sampleProjects.map((item, index) => ({
        name: item.name,
        description: item.description,
        skills: item.skills,
        expectedOutput: item.expectedOutput,
        sortOrder: index,
      })),
    },
    assessmentMethods: {
      create: DEFAULT_ASSESSMENTS.map((item) => ({
        key: item.key,
        label: item.label,
        description: item.description,
        enabled: true,
        sortOrder: item.sortOrder,
      })),
    },
    deliveryFormats: {
      create: program.deliveryFormats.map((format) => ({ format })),
    },
    requirements: {
      create: [
        ...program.equipment.map((item, index) => ({
          kind: PartnershipProgramRequirementKind.EQUIPMENT,
          priority: PartnershipProgramRequirementPriority.REQUIRED,
          label: item.label,
          description: item.description,
          sortOrder: index,
        })),
        ...program.school.map((item, index) => ({
          kind: PartnershipProgramRequirementKind.SCHOOL,
          priority: PartnershipProgramRequirementPriority.REQUIRED,
          label: item.label,
          description: item.description,
          sortOrder: index,
        })),
      ],
    },
    documents: { create: [] },
  };
}

export async function seedPartnershipPrograms(client: PrismaClient): Promise<void> {
  for (const program of PROGRAMS) {
    const nested = buildNestedCreate(program);
    const existing = await client.partnershipProgram.findFirst({
      where: { name: program.name },
      select: { id: true },
    });

    if (existing) {
      await client.$transaction(async (tx) => {
        const programId = existing.id;
        await tx.partnershipProgramObjective.deleteMany({ where: { programId } });
        await tx.partnershipProgramCurriculumModule.deleteMany({ where: { programId } });
        await tx.partnershipProgramActivity.deleteMany({ where: { programId } });
        await tx.partnershipProgramSampleProject.deleteMany({ where: { programId } });
        await tx.partnershipProgramAssessmentMethod.deleteMany({ where: { programId } });
        await tx.partnershipProgramDeliverySupport.deleteMany({ where: { programId } });
        await tx.partnershipProgramRequirement.deleteMany({ where: { programId } });
        await tx.partnershipProgramOutcome.deleteMany({ where: { programId } });
        await tx.partnershipProgramDocument.deleteMany({ where: { programId } });

        await tx.partnershipProgram.update({
          where: { id: programId },
          data: {
            name: program.name,
            ...nested,
          },
        });
      });
    } else {
      await client.partnershipProgram.create({
        data: {
          name: program.name,
          ...nested,
        },
      });
    }
  }
}
