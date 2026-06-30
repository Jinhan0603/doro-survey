// Shown after a successful submission
export function SubmitSuccess({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="submit-success">
      <div className="submit-success__icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M7 18L15 26L29 10"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="submit-success__heading">답변이 제출되었습니다</h2>
      <p className="submit-success__desc">
        강사님이 결과를 공개하면<br />함께 확인할 수 있어요.
      </p>
      <button className="submit-success__edit" type="button" onClick={onEdit}>
        답변 수정하기
      </button>
    </div>
  );
}
