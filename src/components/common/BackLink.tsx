import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import '../../styles/back-link.css';

// 페이지 좌측 상단에 두는 '뒤로가기' 링크. 제목 위에 배치해 이전 목록으로 돌아간다.
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="pageBackLink">
      <ChevronLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
