import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';
import { HomeIcon, RadioIcon, MarketIcon, GarageIcon } from './icons';

const TABS = [
  { to: '/', label: 'HOME', Icon: HomeIcon, end: true },
  { to: '/team-radio', label: 'TEAM RADIO', Icon: RadioIcon },
  { to: '/race-market', label: 'RACE MARKET', Icon: MarketIcon },
  { to: '/my-garage', label: 'MY GARAGE', Icon: GarageIcon },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          <Icon />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}