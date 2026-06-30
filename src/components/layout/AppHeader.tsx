import { useEffect, useRef, useState } from 'react';
import { FileText, LayoutTemplate, LogOut, Menu, User } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { navItems } from '../../data/homeContent';
import { usePresenterAuth } from '../../auth/AuthProvider';
import { BrandLogo } from '../home/ui/BrandLogo';

/**
 * Single fixed header shared by every presenter route (rendered once in
 * PresenterLayout). Active tab is derived from the current route via NavLink,
 * so the header no longer changes shape per page.
 */
export function AppHeader() {
  const navigate = useNavigate();
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
                    navigate('/sessions');
                  }}
                >
                  <FileText size={16} />
                  내 설문
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dh-account-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/library');
                  }}
                >
                  <LayoutTemplate size={16} />
                  내 템플릿
                </button>
                <div className="dh-account-menu-divider" role="separator" />
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
