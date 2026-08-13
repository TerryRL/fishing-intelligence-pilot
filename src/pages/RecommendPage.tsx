import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { buildLurePerformance, buildRecommendations } from '../utils/analytics'

export default function RecommendPage() {
  const navigate = useNavigate()
  const { trips, events, catches, lures, activeTrip } = useAppData()
  const completed = trips.filter((t) => t.status === 'completed')
  const recommendations = useMemo(
    () => buildRecommendations(buildLurePerformance(completed, events, catches, lures)),
    [completed, events, catches, lures],
  )

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">PERSONAL FISHING INTELLIGENCE</p><h1>What Should I Use?</h1></div>
      </header>

      <div className="context-card">
        <span><small>LOCATION</small><strong>{activeTrip?.water_body?.name ?? 'All logged waters'}</strong></span>
        <span><small>TARGET</small><strong>{activeTrip?.target_species?.common_name ?? 'All species'}</strong></span>
      </div>

      {recommendations.length === 0 ? (
        <div className="empty-card">
          <strong>I need more fishing history.</strong>
          <p>Log lure changes, fishing time, casts, and catches. Recommendations will improve as your personal dataset grows.</p>
          <button className="primary-button" onClick={() => navigate(activeTrip ? '/fish' : '/start')}>{activeTrip ? 'Keep Fishing' : 'Start Fishing'}</button>
        </div>
      ) : (
        <div className="recommend-list">
          {recommendations.slice(0, 5).map((row, index) => (
            <article className={`recommend-result ${index === 0 ? 'top' : ''}`} key={row.lureId}>
              <div className="recommend-head">
                <span className="recommend-rank">#{index + 1}</span>
                <span className="confidence">{row.confidence} CONFIDENCE</span>
              </div>
              <h2>{row.lureName}</h2>
              <p className="recommend-colour">{row.colour}</p>
              <div className="recommend-metrics">
                <span><strong>{row.fishPerHour}</strong><small>fish/hr</small></span>
                <span><strong>{row.fishPer100Casts ?? '—'}</strong><small>fish/100</small></span>
                <span><strong>{row.trips}</strong><small>trips</small></span>
                <span><strong>{row.casts}</strong><small>casts</small></span>
              </div>
              <p>{row.reason}</p>
              {index === 0 && activeTrip && (
                <button className="primary-button" onClick={() => navigate('/change-lure')}>Use This Lure</button>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="insight-note">Pilot algorithm: exposure-based performance + sample size. Weather, season, species-specific, and exact-location scoring are designed for the next iteration.</p>
    </div>
  )
}
