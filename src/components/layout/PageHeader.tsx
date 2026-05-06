import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: '홈' },
  { to: '/custom-session', label: '직접 만들기' },
  { to: '/library', label: '템플릿' },
  { to: '/builder', label: '빌더' },
  { to: '/session-new', label: '세션 열기' },
  { to: '/student', label: 'Student' },
  { to: '/admin', label: 'Admin' },
  { to: '/display', label: 'Display' },
];

export function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header__inner">
        <NavLink className="brand-mark" to="/">
          <span className="brand-mark__tile">D</span>
          <span>
            <strong>DORO Live Survey</strong>
            <small>live participation system</small>
          </span>
        </NavLink>
        <nav className="page-nav" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => (isActive ? 'page-nav__link is-active' : 'page-nav__link')}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
