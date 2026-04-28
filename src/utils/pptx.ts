import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import type { LessonPhase } from '../firebase/types';

export type ExtractedSlide = {
  slideNumber: number;
  title: string;
  text: string;
  rawTexts: string[];
  detectedPhase: LessonPhase;
  phaseConfidence: number;
};

const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

const PHASE_KEYWORDS: Record<LessonPhase, string[]> = {
  intro: ['도입', '목표', '왜', '문제', '궁금', '해볼까요'],
  theory: ['원리', '개념', '구조', '설명', '특징', '문법', '알고리즘'],
  practice: ['실습', '따라하기', '조립', '코딩', '설정', '만들기', '미션', '활동'],
  ethics: ['윤리', '사례', '활용', '저작권', '개인정보', '안전', '책임', '오용', '한계'],
  wrapup: ['정리', '회고', '퀴즈', '발표', '오늘 배운 것', '다음 시간'],
};

const PHASE_FALLBACK: LessonPhase[] = ['intro', 'theory', 'practice', 'ethics', 'wrapup'];

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function collectTextValues(node: unknown, bucket: string[]) {
  if (typeof node === 'string') {
    const normalized = normalizeText(node);
    if (normalized) bucket.push(normalized);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectTextValues(item, bucket));
    return;
  }

  const record = asRecord(node);
  if (!record) return;

  if ('a:t' in record) {
    collectTextValues(record['a:t'], bucket);
  }

  Object.entries(record).forEach(([key, value]) => {
    if (key !== 'a:t') {
      collectTextValues(value, bucket);
    }
  });
}

function dedupeTexts(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function getSlideShapes(parsedXml: unknown): unknown[] {
  const slideRecord = asRecord(parsedXml);
  const slideRoot = asRecord(slideRecord?.['p:sld']);
  const commonSlide = asRecord(slideRoot?.['p:cSld']);
  const shapeTree = asRecord(commonSlide?.['p:spTree']);

  if (!shapeTree) return [];

  return [
    ...toArray(shapeTree['p:sp']),
    ...toArray(shapeTree['p:graphicFrame']),
    ...toArray(shapeTree['p:grpSp']),
  ];
}

function extractTextsFromShape(shape: unknown): string[] {
  const texts: string[] = [];
  collectTextValues(shape, texts);
  return dedupeTexts(texts);
}

function isTitleShape(shape: unknown): boolean {
  const shapeRecord = asRecord(shape);
  const nvSp = asRecord(shapeRecord?.['p:nvSpPr']);
  const nvPr = asRecord(nvSp?.['p:nvPr']);
  const placeholder = asRecord(nvPr?.['p:ph']);
  const placeholderType = placeholder?.['@_type'];

  if (placeholderType === 'title' || placeholderType === 'ctrTitle') {
    return true;
  }

  const cNvPr = asRecord(nvSp?.['p:cNvPr']);
  const name = typeof cNvPr?.['@_name'] === 'string' ? cNvPr['@_name'].toLowerCase() : '';
  return name.includes('title');
}

function detectPhase(text: string, slideNumber: number): {
  detectedPhase: LessonPhase;
  phaseConfidence: number;
} {
  const normalized = text.toLowerCase();
  let topPhase: LessonPhase = PHASE_FALLBACK[Math.min(Math.max(slideNumber - 1, 0), PHASE_FALLBACK.length - 1)];
  let topScore = 0;
  let totalScore = 0;

  PHASE_FALLBACK.forEach((phase) => {
    const keywords = PHASE_KEYWORDS[phase];
    const score = keywords.reduce((count, keyword) => {
      if (!normalized.includes(keyword.toLowerCase())) return count;
      return count + normalized.split(keyword.toLowerCase()).length - 1;
    }, 0);

    totalScore += score;

    if (score > topScore) {
      topPhase = phase;
      topScore = score;
    }
  });

  if (topScore === 0) {
    return {
      detectedPhase: topPhase,
      phaseConfidence: 0.18,
    };
  }

  const dominance = topScore / Math.max(totalScore, 1);
  const confidence = Math.min(0.97, 0.3 + dominance * 0.32 + Math.min(topScore, 4) * 0.1);

  return {
    detectedPhase: topPhase,
    phaseConfidence: Number(confidence.toFixed(2)),
  };
}

function parseSlideNumber(fileName: string): number {
  const match = fileName.match(/slide(\d+)\.xml$/i);
  return match ? Number(match[1]) : 0;
}

function buildSlideTitle(shapes: unknown[], fallbackTexts: string[], slideNumber: number): string {
  const titleShapeTexts = shapes
    .filter((shape) => isTitleShape(shape))
    .flatMap((shape) => extractTextsFromShape(shape));

  const title = titleShapeTexts[0] ?? fallbackTexts[0] ?? `슬라이드 ${slideNumber}`;
  return normalizeText(title);
}

export async function extractSlidesFromPptx(file: File): Promise<ExtractedSlide[]> {
  if (!file.name.toLowerCase().endsWith('.pptx')) {
    throw new Error('PPTX 파일만 업로드할 수 있습니다.');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error('PPTX 파일을 열지 못했습니다. 파일이 손상되었는지 확인해주세요.');
  }

  const slideFiles = Object.values(zip.files)
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.name))
    .sort((left, right) => parseSlideNumber(left.name) - parseSlideNumber(right.name));

  if (slideFiles.length === 0) {
    throw new Error('슬라이드 XML을 찾지 못했습니다. 암호화되었거나 지원되지 않는 PPTX일 수 있습니다.');
  }

  try {
    const slides = await Promise.all(
      slideFiles.map(async (entry) => {
        const slideNumber = parseSlideNumber(entry.name);
        const xml = await entry.async('text');
        const parsed = parser.parse(xml);
        const shapes = getSlideShapes(parsed);
        const rawTexts = dedupeTexts(extractTextsFromShape(parsed));
        const text = normalizeText(rawTexts.join(' '));
        const title = buildSlideTitle(shapes, rawTexts, slideNumber);
        const { detectedPhase, phaseConfidence } = detectPhase(text || title, slideNumber);

        return {
          slideNumber,
          title,
          text,
          rawTexts,
          detectedPhase,
          phaseConfidence,
        } satisfies ExtractedSlide;
      }),
    );

    if (slides.every((slide) => slide.rawTexts.length === 0 && !slide.title)) {
      throw new Error('슬라이드에서 텍스트를 읽지 못했습니다.');
    }

    return slides;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PPTX를 분석하지 못했습니다. ${error.message}`);
    }

    throw new Error('PPTX를 분석하지 못했습니다. 다른 파일로 다시 시도해주세요.');
  }
}
