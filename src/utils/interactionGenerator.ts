import type { LessonPhase, QuestionInputType, ResultVisibility } from '../firebase/types';
import type { InteractionSeed } from '../data/lessonTemplatePresets';

export type InteractionGeneratorSubjectType = 'ai' | 'robot' | 'making' | 'coding' | 'mixed';
export type InteractionGeneratorAudienceLevel = 'elementary' | 'middle' | 'high' | 'university';
export type InteractionGeneratorDensity = 'low' | 'medium' | 'high';

export type InteractionGeneratorOptions = {
  subjectType: InteractionGeneratorSubjectType;
  audienceLevel: InteractionGeneratorAudienceLevel;
  density: InteractionGeneratorDensity;
};

export type InteractionGeneratorSlide = {
  slideNumber: number;
  title: string;
  text: string;
  rawTexts?: string[];
  phase?: LessonPhase;
  detectedPhase?: LessonPhase;
};

export type GeneratedInteractionDraft = InteractionSeed & {
  generatedFrom: 'rules';
  sourceSlideNumbers: number[];
  generatorReason: string;
};

const PHASE_ORDER: LessonPhase[] = ['intro', 'theory', 'practice', 'ethics', 'wrapup'];
const STATUS_CHOICES = ['ready', 'doing', 'done', 'need_help'];
const SCALE_CHOICES = ['1', '2', '3', '4', '5'];

const SUBJECT_PROFILES: Record<
  InteractionGeneratorSubjectType,
  {
    label: string;
    toolLabel: string;
    conceptLabel: string;
    practiceLabel: string;
    outputLabel: string;
    ethicsRiskLabel: string;
  }
> = {
  ai: {
    label: 'AI',
    toolLabel: 'AI 도구',
    conceptLabel: '프롬프트와 결과의 관계',
    practiceLabel: '생성 결과 조정',
    outputLabel: '생성 결과물',
    ethicsRiskLabel: '저작권과 개인정보',
  },
  robot: {
    label: '로봇',
    toolLabel: '로봇 키트',
    conceptLabel: '센서 입력과 동작 제어',
    practiceLabel: '로봇 동작 구현',
    outputLabel: '로봇 동작',
    ethicsRiskLabel: '안전과 책임',
  },
  making: {
    label: '메이킹',
    toolLabel: '메이킹 도구',
    conceptLabel: '재료와 구조의 연결',
    practiceLabel: '제작과 조립',
    outputLabel: '제작 결과물',
    ethicsRiskLabel: '안전과 사용 책임',
  },
  coding: {
    label: '코딩',
    toolLabel: '코딩 도구',
    conceptLabel: '입력-처리-출력 흐름',
    practiceLabel: '코드 작성과 디버깅',
    outputLabel: '프로그램 결과',
    ethicsRiskLabel: '데이터와 책임 있는 사용',
  },
  mixed: {
    label: '기술',
    toolLabel: '기술 도구',
    conceptLabel: '핵심 원리와 사용 흐름',
    practiceLabel: '실습 과정',
    outputLabel: '실습 결과',
    ethicsRiskLabel: '활용과 책임',
  },
};

const AUDIENCE_COPY: Record<
  InteractionGeneratorAudienceLevel,
  {
    experienceChoices: string[];
    confidencePrompt: string;
    exitPromptSuffix: string;
    predictionInputType: QuestionInputType;
    ethicsInputType: QuestionInputType;
    exitInputType: QuestionInputType;
  }
> = {
  elementary: {
    experienceChoices: ['처음이에요', '본 적 있어요', '조금 해봤어요', '잘 할 수 있어요'],
    confidencePrompt: '지금 이 내용을 얼마나 자신 있게 설명할 수 있나요?',
    exitPromptSuffix: '오늘 배운 것 중 친구에게 말해주고 싶은 한 가지를 적어보세요.',
    predictionInputType: 'choice',
    ethicsInputType: 'choice',
    exitInputType: 'text',
  },
  middle: {
    experienceChoices: ['처음 사용해요', '본 적은 있어요', '직접 해봤어요', '혼자서도 할 수 있어요'],
    confidencePrompt: '지금 단계에서 이 내용을 어느 정도 이해했다고 느끼나요?',
    exitPromptSuffix: '오늘 배운 것을 바탕으로 다음 시간 전까지 해볼 작은 실험을 적어보세요.',
    predictionInputType: 'choice',
    ethicsInputType: 'choice',
    exitInputType: 'text',
  },
  high: {
    experienceChoices: ['처음입니다', '기본만 압니다', '직접 적용해봤습니다', '다른 사람에게 설명할 수 있습니다'],
    confidencePrompt: '현재 개념과 절차를 스스로 재현할 수 있는 정도를 체크해보세요.',
    exitPromptSuffix: '오늘 배운 내용을 실제 과제나 프로젝트에 어떻게 적용할지 적어보세요.',
    predictionInputType: 'text',
    ethicsInputType: 'choice',
    exitInputType: 'scale',
  },
  university: {
    experienceChoices: ['경험 없음', '기초 경험 있음', '직접 응용해봄', '설계/지도 가능'],
    confidencePrompt: '핵심 개념과 절차를 독립적으로 적용할 수 있는 수준인지 체크해보세요.',
    exitPromptSuffix: '오늘 학습한 내용을 실제 문제 해결이나 프로젝트에 어떻게 전이할지 적어보세요.',
    predictionInputType: 'text',
    ethicsInputType: 'text',
    exitInputType: 'text',
  },
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function getSlidePhase(slide: InteractionGeneratorSlide): LessonPhase {
  return slide.phase ?? slide.detectedPhase ?? 'intro';
}

function sortSlides(slides: InteractionGeneratorSlide[]) {
  return [...slides].sort((left, right) => left.slideNumber - right.slideNumber);
}

function getSlidesByPhase(slides: InteractionGeneratorSlide[]) {
  return PHASE_ORDER.reduce<Record<LessonPhase, InteractionGeneratorSlide[]>>(
    (bucket, phase) => {
      bucket[phase] = sortSlides(slides.filter((slide) => getSlidePhase(slide) === phase));
      return bucket;
    },
    {
      intro: [],
      theory: [],
      practice: [],
      ethics: [],
      wrapup: [],
    },
  );
}

function buildTopic(slides: InteractionGeneratorSlide[], fallback: string) {
  const titledSlide = slides.find((slide) => {
    const normalizedTitle = normalizeText(slide.title);
    return normalizedTitle && !/^슬라이드\s*\d+$/i.test(normalizedTitle);
  });

  if (titledSlide) {
    return titledSlide.title;
  }

  const textSource = slides
    .map((slide) => normalizeText(slide.text))
    .find((text) => text.length >= 6);

  if (!textSource) {
    return fallback;
  }

  return textSource.slice(0, 26);
}

function buildPromptTopic(slides: InteractionGeneratorSlide[], subjectType: InteractionGeneratorSubjectType) {
  const subject = SUBJECT_PROFILES[subjectType];
  return buildTopic(slides, `${subject.label} 실습`);
}

function createDraft(input: {
  phase: LessonPhase;
  interactionType: GeneratedInteractionDraft['interactionType'];
  purpose: GeneratedInteractionDraft['purpose'];
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  title: string;
  prompt: string;
  choices?: string[];
  maxLength?: number;
  presenterNote: string;
  timingLabel: string;
  sourceSlideNumbers: number[];
  generatorReason: string;
}): GeneratedInteractionDraft {
  return {
    phase: input.phase,
    interactionType: input.interactionType,
    purpose: input.purpose,
    inputType: input.inputType,
    visibility: input.visibility,
    title: input.title,
    prompt: input.prompt,
    choices: input.choices ?? [],
    maxLength: input.maxLength ?? 300,
    presenterNote: input.presenterNote,
    timingLabel: input.timingLabel,
    generatedFrom: 'rules',
    sourceSlideNumbers: input.sourceSlideNumbers,
    generatorReason: input.generatorReason,
  };
}

function buildTheoryChoices(subjectType: InteractionGeneratorSubjectType, topic: string) {
  const profile = SUBJECT_PROFILES[subjectType];

  return [
    `${topic}에서 핵심 원리를 실제로 적용하는 것`,
    `${topic}을 예쁘게 꾸미는 것만 신경 쓰는 것`,
    `${profile.toolLabel}를 아무 순서로 눌러보는 것`,
    '정답 하나만 외우고 그대로 따라 하는 것',
  ];
}

function buildPredictionChoices(subjectType: InteractionGeneratorSubjectType, topic: string) {
  const profile = SUBJECT_PROFILES[subjectType];

  return [
    `${profile.outputLabel}이 더 분명해질 것 같아요`,
    '설정이나 순서를 더 정확히 맞춰야 할 것 같아요',
    '도구보다 아이디어 정리가 더 중요할 것 같아요',
    '아직 잘 모르겠지만 해보면 알 수 있을 것 같아요',
  ].map((choice, index) => (index === 0 ? `${topic}: ${choice}` : choice));
}

function buildTroubleshootChoices(subjectType: InteractionGeneratorSubjectType) {
  const profile = SUBJECT_PROFILES[subjectType];

  return [
    `${profile.toolLabel} 설정을 다시 확인하기`,
    '입력 문장이나 순서를 다시 정리하기',
    '예시 결과와 현재 상태를 비교하기',
    '도움 요청 후 막힌 지점을 정확히 설명하기',
  ];
}

function buildEthicsChoices(subjectType: InteractionGeneratorSubjectType) {
  const profile = SUBJECT_PROFILES[subjectType];

  return [
    `${profile.ethicsRiskLabel}를 먼저 확인한다`,
    '결과만 나오면 바로 공유한다',
    '출처나 사용 조건은 나중에 본다',
    '편리하면 그대로 사용해도 괜찮다',
  ];
}

function getLastSlides(slides: InteractionGeneratorSlide[], count: number) {
  return sortSlides(slides).slice(Math.max(0, slides.length - count));
}

export function generateInteractionsFromSlides(
  slides: InteractionGeneratorSlide[],
  options: InteractionGeneratorOptions,
): GeneratedInteractionDraft[] {
  const sortedSlides = sortSlides(slides);

  if (sortedSlides.length === 0) {
    return [];
  }

  const profile = SUBJECT_PROFILES[options.subjectType];
  const audience = AUDIENCE_COPY[options.audienceLevel];
  const slidesByPhase = getSlidesByPhase(sortedSlides);
  const drafts: GeneratedInteractionDraft[] = [];

  const introSlides = slidesByPhase.intro;
  if (introSlides.length > 0) {
    const topic = buildPromptTopic(introSlides, options.subjectType);
    drafts.push(
      createDraft({
        phase: 'intro',
        interactionType: 'prior-knowledge',
        purpose: 'learning',
        inputType: 'choice',
        visibility: 'public',
        title: `${topic} 써본 적 있나요?`,
        prompt: `${topic} 또는 비슷한 ${profile.toolLabel}를 이전에 써본 적이 있나요?`,
        choices: audience.experienceChoices,
        presenterNote: '학생들의 선경험 분포를 보고 설명 속도를 조정합니다.',
        timingLabel: '2분',
        sourceSlideNumbers: introSlides.slice(0, 2).map((slide) => slide.slideNumber),
        generatorReason: 'intro phase는 prior-knowledge 질문으로 학생의 출발점을 먼저 확인합니다.',
      }),
    );

    if (options.density !== 'low') {
      drafts.push(
        createDraft({
          phase: 'intro',
          interactionType: 'prediction',
          purpose: 'learning',
          inputType: audience.predictionInputType,
          visibility: 'public',
          title: `${topic} 어떻게 될까요?`,
          prompt:
            audience.predictionInputType === 'text'
              ? `${topic} 실습을 시작하면 어떤 결과나 변화가 나올지 한두 문장으로 예상해보세요.`
              : `${topic} 실습을 시작하면 가장 먼저 어떤 점이 중요할지 골라보세요.`,
          choices:
            audience.predictionInputType === 'choice'
              ? buildPredictionChoices(options.subjectType, topic)
              : [],
          presenterNote: '학생 예측을 수업 목표와 연결해 오답도 학습 재료로 사용합니다.',
          timingLabel: '2분',
          sourceSlideNumbers: introSlides.slice(0, 2).map((slide) => slide.slideNumber),
          generatorReason: 'intro phase는 prediction 질문으로 학습 몰입을 높입니다.',
        }),
      );
    }

    if (options.density === 'high') {
      drafts.push(
        createDraft({
          phase: 'intro',
          interactionType: 'confidence-check',
          purpose: 'learning',
          inputType: 'scale',
          visibility: 'public',
          title: `${profile.toolLabel} 자신감 체크`,
          prompt: audience.confidencePrompt,
          choices: SCALE_CHOICES,
          presenterNote: '도입 시점 자신감 수준을 저장해 마무리와 비교합니다.',
          timingLabel: '1분',
          sourceSlideNumbers: introSlides.slice(0, 1).map((slide) => slide.slideNumber),
          generatorReason: 'high density에서는 도입 자신감 체크까지 넣어 수업 전후 변화를 비교합니다.',
        }),
      );
    }
  }

  const theorySlides = slidesByPhase.theory;
  if (theorySlides.length > 0) {
    const topic = buildPromptTopic(theorySlides, options.subjectType);
    drafts.push(
      createDraft({
        phase: 'theory',
        interactionType: 'concept-check',
        purpose: 'learning',
        inputType: 'choice',
        visibility: 'public',
        title: `${topic} 핵심 개념 확인`,
        prompt: `오늘 설명한 ${topic}의 핵심 개념으로 가장 알맞은 설명을 골라보세요.`,
        choices: buildTheoryChoices(options.subjectType, topic),
        presenterNote: '이론 설명 직후 오개념이 있는지 빠르게 확인합니다.',
        timingLabel: '2분',
        sourceSlideNumbers: theorySlides.slice(0, 2).map((slide) => slide.slideNumber),
        generatorReason: 'theory phase는 concept-check로 핵심 개념 이해를 확인합니다.',
      }),
    );

    if (options.density !== 'low') {
      drafts.push(
        createDraft({
          phase: 'theory',
          interactionType: 'confidence-check',
          purpose: 'learning',
          inputType: 'scale',
          visibility: 'public',
          title: `${topic} 이해도 체크`,
          prompt: audience.confidencePrompt,
          choices: SCALE_CHOICES,
          presenterNote: '점수가 낮으면 실습 전에 개념 설명을 한 번 더 보강합니다.',
          timingLabel: '1분',
          sourceSlideNumbers: theorySlides.slice(0, 1).map((slide) => slide.slideNumber),
          generatorReason: 'theory phase는 confidence-check로 설명을 더 보강할지 판단합니다.',
        }),
      );
    }
  }

  const practiceSlides = slidesByPhase.practice;
  if (practiceSlides.length > 0) {
    const topic = buildPromptTopic(practiceSlides, options.subjectType);
    drafts.push(
      createDraft({
        phase: 'practice',
        interactionType: 'readiness-check',
        purpose: 'ops',
        inputType: 'status',
        visibility: 'teacher-only',
        title: `${topic} 실습 준비 체크`,
        prompt: `${profile.practiceLabel}을 시작하기 전에 현재 준비 상태를 체크해보세요.`,
        choices: STATUS_CHOICES,
        presenterNote: '실습 시작 전 장비, 계정, 재료 준비 여부를 확인합니다.',
        timingLabel: '1분',
        sourceSlideNumbers: practiceSlides.slice(0, 1).map((slide) => slide.slideNumber),
        generatorReason: 'practice phase 시작 전 readiness-check는 항상 1개 생성합니다.',
      }),
    );

    if (practiceSlides.length >= 3) {
      drafts.push(
        createDraft({
          phase: 'practice',
          interactionType: 'progress-check',
          purpose: 'ops',
          inputType: 'status',
          visibility: 'teacher-only',
          title: `${topic} 실습 중간 체크`,
          prompt: `${profile.practiceLabel}을 진행하는 현재 상태를 체크해보세요.`,
          choices: STATUS_CHOICES,
          presenterNote: '중간 점검에서 help 응답 비율이 높으면 예시를 다시 보여줍니다.',
          timingLabel: '1분',
          sourceSlideNumbers: practiceSlides.slice(1, 3).map((slide) => slide.slideNumber),
          generatorReason: 'practice slide가 3장 이상이면 progress-check를 자동 추가합니다.',
        }),
      );
    }

    if (options.density !== 'low' || practiceSlides.length >= 2) {
      drafts.push(
        createDraft({
          phase: 'practice',
          interactionType: 'troubleshoot',
          purpose: 'ops',
          inputType: options.density === 'high' ? 'multi' : 'choice',
          visibility: 'teacher-only',
          title: `${topic} 막힌 지점 확인`,
          prompt:
            options.density === 'high'
              ? `${profile.practiceLabel} 중 막힌 이유를 모두 골라보세요.`
              : `${profile.practiceLabel} 중 막히면 가장 먼저 점검할 항목을 골라보세요.`,
          choices: buildTroubleshootChoices(options.subjectType),
          presenterNote: '도움이 필요한 구간을 빠르게 파악해 순회 지도를 계획합니다.',
          timingLabel: '2분',
          sourceSlideNumbers: practiceSlides.slice(-2).map((slide) => slide.slideNumber),
          generatorReason: 'practice phase는 troubleshoot 질문으로 지원이 필요한 지점을 수집합니다.',
        }),
      );
    }
  }

  const ethicsSlides = slidesByPhase.ethics;
  if (ethicsSlides.length > 0) {
    const topic = buildPromptTopic(ethicsSlides, options.subjectType);
    drafts.push(
      createDraft({
        phase: 'ethics',
        interactionType: 'ethics-case',
        purpose: 'reflection',
        inputType: audience.ethicsInputType,
        visibility: 'public',
        title: `${topic} 사례 판단`,
        prompt:
          audience.ethicsInputType === 'text'
            ? `${topic}을 실제로 활용할 때 가장 먼저 점검해야 할 책임이나 주의점을 적어보세요.`
            : `${topic}을 활용할 때 가장 먼저 점검해야 할 항목을 골라보세요.`,
        choices: audience.ethicsInputType === 'choice' ? buildEthicsChoices(options.subjectType) : [],
        presenterNote: '활용 사례를 저작권, 개인정보, 안전, 책임 관점으로 정리합니다.',
        timingLabel: '3분',
        sourceSlideNumbers: ethicsSlides.slice(0, 2).map((slide) => slide.slideNumber),
        generatorReason: 'ethics slide가 있으면 사례 판단 질문을 자동 생성합니다.',
      }),
    );
  }

  const wrapupSourceSlides =
    slidesByPhase.wrapup.length > 0
      ? getLastSlides(slidesByPhase.wrapup, options.density === 'high' ? 3 : 2)
      : getLastSlides(sortedSlides, options.density === 'high' ? 3 : 2);

  if (wrapupSourceSlides.length > 0) {
    const topic = buildPromptTopic(wrapupSourceSlides, options.subjectType);
    drafts.push(
      createDraft({
        phase: 'wrapup',
        interactionType: 'exit-ticket',
        purpose: 'reflection',
        inputType: audience.exitInputType,
        visibility: 'hidden',
        title: `${topic} exit-ticket`,
        prompt: audience.exitPromptSuffix,
        choices: audience.exitInputType === 'scale' ? SCALE_CHOICES : [],
        presenterNote: '마지막 2~3장 내용을 기준으로 학습 전이와 다음 행동을 정리합니다.',
        timingLabel: '3분',
        sourceSlideNumbers: wrapupSourceSlides.map((slide) => slide.slideNumber),
        generatorReason: '마지막 2~3장의 내용을 기준으로 exit-ticket을 자동 생성합니다.',
      }),
    );
  }

  return drafts;
}
