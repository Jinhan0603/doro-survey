import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Overview' },
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
            <small>robot-startup-2026</small>
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
