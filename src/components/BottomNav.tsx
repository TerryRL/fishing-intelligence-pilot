import { NavLink } from 'react-router-dom'

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  background: isActive ? 'linear-gradient(180deg, rgba(44,141,231,.28), rgba(44,141,231,.08))' : 'rgba(255,255,255,.025)',
  border: isActive ? '1px solid rgba(83,174,247,.55)' : '1px solid rgba(255,255,255,.05)',
  boxShadow: isActive ? '0 5px 16px rgba(21,107,181,.22)' : 'none',
  transform: isActive ? 'translateY(-2px)' : 'none',
  fontWeight: isActive ? 900 : 700,
})

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/" end style={navStyle}><span className="nav-icon">⌂</span><span>Home</span></NavLink>
      <NavLink to="/trips" style={navStyle}><span className="nav-icon">▤</span><span>Trips</span></NavLink>
      <NavLink to="/fish" className="fish-nav" style={({ isActive }) => ({
        boxShadow: isActive ? '0 0 0 4px rgba(95,189,67,.22), 0 8px 22px rgba(0,0,0,.42)' : '0 7px 20px rgba(0,0,0,.38)',
        transform: isActive ? 'scale(1.08)' : 'scale(1)',
      })}><span>FISH</span></NavLink>
      <NavLink to="/map" style={navStyle}><span className="nav-icon">⌖</span><span>Map</span></NavLink>
      <NavLink to="/tackle" style={navStyle}><span className="nav-icon">◈</span><span>Tackle</span></NavLink>
    </nav>
  )
}
