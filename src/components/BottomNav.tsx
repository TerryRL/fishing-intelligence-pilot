import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/" end><span className="nav-icon">⌂</span><span>Home</span></NavLink>
      <NavLink to="/trips"><span className="nav-icon">▤</span><span>Trips</span></NavLink>
      <NavLink to="/fish" className="fish-nav"><span>FISH</span></NavLink>
      <NavLink to="/map"><span className="nav-icon">⌖</span><span>Map</span></NavLink>
      <NavLink to="/tackle"><span className="nav-icon">◈</span><span>Tackle</span></NavLink>
    </nav>
  )
}
