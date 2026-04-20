type TextQuestionProps = {
  value: string;
  maxLength: number;
  onChange(value: string): void;
};

export function TextQuestion({ value, maxLength, onChange }: TextQuestionProps) {
  return (
    <label className="field">
      <span className="field__label">답변 작성</span>
      <textarea
        className="textarea"
        maxLength={maxLength}
        placeholder="생각나는 답을 짧고 분명하게 적어보세요."
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="field__hint">{value.length}/{maxLength}</span>
    </label>
  );
}
