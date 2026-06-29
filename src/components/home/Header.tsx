import { Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navItems } from '../../data/homeContent';
import { BrandLogo } from './ui/BrandLogo';

export function Header() {
  return (
    <header className="dh-header">
      <div className="dh-header-inner">
        <Link className="dh-brand" to="/" aria-label="도로 설문 홈">
          <span className="dh-brand-logo">
            <BrandLogo size={24} />
          </span>
          <span>
            <span className="dh-brand-title">도로 설문</span>
            <span className="dh-brand-sub">실시간 수업 참여 도구</span>
          </span>
        </Link>

        <nav className="dh-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={item.active ? 'dh-nav--active' : ''}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="dh-nav-toggle" type="button" aria-label="메뉴 열기">
            <Menu size={20} />
          </button>
          <button className="dh-account" type="button" aria-label="내 계정">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
