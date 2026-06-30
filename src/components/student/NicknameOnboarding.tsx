import { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { normalizeNickname } from '../../utils/sanitize';

// First step: ask for nickname before showing any question
export function NicknameOnboarding({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [value, setValue] = useState('');
  const isValid = normalizeNickname(value).length > 0;

  return (
    <div className="student-onboarding">
      <h1 className="student-onboarding__heading">
        수업에서 사용할<br />닉네임을 입력해주세요
      </h1>
      <p className="student-onboarding__hint">
        닉네임은 이 브라우저에 저장되며, 답변과 함께 표시됩니다.
      </p>
      <form
        className="student-onboarding__form"
        onSubmit={(e) => {
          e.preventDefault();
          const normalized = normalizeNickname(value);
          if (normalized) onConfirm(normalized);
        }}
      >
        <Input
          autoComplete="nickname"
          label="닉네임"
          name="nickname"
          placeholder="예: 민준"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" fullWidth size="lg" disabled={!isValid}>
          입장하기
        </Button>
      </form>
    </div>
  );
}
