import type { SeedQuestion } from '../firebase/types';
import { robotStartupSeedQuestions } from './robotStartupSeedQuestions';
import { seedQuestions } from './seedQuestions';

export type SeedQuestionSetId = 'current-tech' | 'robot-startup-v1';

type SeedQuestionSet = {
  id: SeedQuestionSetId;
  label: string;
  sessionTitle: string;
  description: string;
  questions: SeedQuestion[];
};

export const defaultSeedQuestionSetId: SeedQuestionSetId = 'current-tech';

export const seedQuestionSets: SeedQuestionSet[] = [
  {
    id: 'current-tech',
    label: '현재 기술 수업 질문',
    sessionTitle: 'DORO 기술 실습 수업',
    description: 'DOROSSAEM 기술/툴/실습형 수업에 공통으로 쓰는 V2 기본 질문입니다.',
    questions: seedQuestions,
  },
  {
    id: 'robot-startup-v1',
    label: '과거 로봇 창업 강의 질문',
    sessionTitle: '로봇생각과 표현 강의',
    description: 'Notion 로봇생각과 표현 강의 페이지와 V1 운영 흐름에서 복구한 질문입니다.',
    questions: robotStartupSeedQuestions,
  },
];

export function getSeedQuestionSet(id: string | null | undefined) {
  return seedQuestionSets.find((set) => set.id === id) ?? seedQuestionSets[0];
}
