import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { navItems } from '../../data/homeContent';
import { usePresenterAuth } from '../../auth/AuthProvider';
import { BrandLogo } from '../home/ui/BrandLogo';

/**
 * Single fixed header shared by every presenter route (rendered once in
 * PresenterLayout). Active tab is derived from the current route via NavLink,
 * so the header no longer changes shape per page.
 */
export function AppHeader() {
  const { logout } = usePresenterAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // 메뉴 바깥 클릭 / Esc 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="dh-header">
      <div className="dh-header-inner">
        <Link className="dh-brand" to="/" aria-label="DORO 실시간 설문 시스템 홈">
          <span className="dh-brand-logo">
            <BrandLogo size={40} />
          </span>
          <span>
            <span className="dh-brand-title">DORO 실시간 설문 시스템</span>
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
          <div className="dh-account-wrap" ref={accountRef}>
            <button
              className="dh-account"
              type="button"
              aria-label="내 계정"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <User size={20} />
            </button>
            {menuOpen && (
              <div className="dh-account-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="dh-account-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
