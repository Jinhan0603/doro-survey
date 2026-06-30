import { Menu, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { navItems } from '../../data/homeContent';
import { BrandLogo } from '../home/ui/BrandLogo';

/**
 * Single fixed header shared by every presenter route (rendered once in
 * PresenterLayout). Active tab is derived from the current route via NavLink,
 * so the header no longer changes shape per page.
 */
export function AppHeader() {
  return (
    <header className="dh-header">
      <div className="dh-header-inner">
        <Link className="dh-brand" to="/" aria-label="도로 설문 홈">
          <span className="dh-brand-logo">
            <BrandLogo size={40} />
          </span>
          <span>
            <span className="dh-brand-title">도로 설문</span>
            <span className="dh-brand-sub">실시간 수업 참여 도구</span>
          </span>
        </Link>

        <nav className="dh-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'dh-nav--active' : undefined)}
            >
              {item.label}
            </NavLink>
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
