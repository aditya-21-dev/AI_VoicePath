import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Helper component to center map when selected opportunity or location updates
function ChangeMapView({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

/**
 * Custom Leaflet divIcons for rich aesthetics and reliable Vite asset loading:
 * 1. User Location Pin (📍 with pulse ring)
 * 2. Opportunity / Employer Pin (🏢 with badge)
 */
function createUserIcon(label = 'You') {
  return L.divIcon({
    className: 'vp-leaflet-user-icon-wrapper',
    html: `
      <div class="vp-map-user-pin" title="${label}">
        <span class="vp-map-user-pulse"></span>
        <div class="vp-map-user-dot">
          <span>📍</span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function createOpportunityIcon(matchPct = 90, isSelected = false) {
  return L.divIcon({
    className: `vp-leaflet-opp-icon-wrapper ${isSelected ? 'selected' : ''}`,
    html: `
      <div class="vp-map-opp-pin ${isSelected ? 'active' : ''}">
        <div class="vp-map-opp-badge font-mono">${matchPct}%</div>
        <div class="vp-map-opp-body">
          <span class="vp-map-opp-symbol">🏢</span>
        </div>
        <div class="vp-map-opp-stem"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -46],
  })
}

/**
 * OpportunityMap — Interactive OpenStreetMap Leaflet component.
 * Visualizes User Location and Verified Employer Clusters in Tamil Nadu.
 *
 * @param {{
 *   opportunities?: Array<any>,
 *   userLocation?: { lat: number, lng: number, label: string, district?: string },
 *   selectedOppId?: string,
 *   onSelectOpportunity?: (opp: any) => void,
 * }} props
 */
export default function OpportunityMap({
  opportunities = [],
  userLocation = { lat: 13.0524, lng: 80.2508, label: 'Your Location (Priya Sharma · Demo)' },
  selectedOppId,
  onSelectOpportunity,
}) {
  const [currentUserLoc, setCurrentUserLoc] = useState(userLocation)
  const [geoStatus, setGeoStatus] = useState('idle') // idle | locating | granted | denied
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  // Track light/dark mode for map tile layer
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDarkTheme(theme === 'dark')
    }
    checkTheme()
    const obs = new MutationObserver(checkTheme)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // Frontend browser geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable')
      return
    }

    setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Your Current Live Location (GPS)',
          district: 'Detected via Browser',
        })
        setGeoStatus('granted')
      },
      () => {
        setGeoStatus('denied')
        // Retain default demo location safely
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Filter opportunities that have valid coordinates
  const validOpps = useMemo(() => {
    return opportunities.filter((o) => typeof o.lat === 'number' && typeof o.lng === 'number')
  }, [opportunities])

  // Center coordinate for the map
  const mapCenter = useMemo(() => {
    if (selectedOppId) {
      const found = validOpps.find((o) => o.id === selectedOppId)
      if (found) return [found.lat, found.lng]
    }
    return [currentUserLoc.lat || 13.0524, currentUserLoc.lng || 80.2508]
  }, [selectedOppId, validOpps, currentUserLoc])

  // OpenStreetMap tile URLs (standard OSM, clean and universal)
  const tileUrl = isDarkTheme
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  return (
    <div className="vp-opportunity-map-container glass-card" aria-label="Opportunity Geographical Map">
      {/* Map Card Header */}
      <div className="vp-map-header">
        <div className="vp-map-header-left">
          <div className="vp-map-title-row">
            <span className="vp-stage-step__num" style={{ width: 22, height: 22, fontSize: '0.7rem' }}>
              📍
            </span>
            <h3 className="vp-map-title text-primary">District Opportunity Map</h3>
            <span className="vp-badge vp-badge--cyan font-mono" style={{ fontSize: '0.68rem' }}>
              Tamil Nadu Cluster
            </span>
          </div>
          <p className="vp-map-sub text-muted">
            OpenStreetMap geospatial matching. Click any employer marker to inspect eligibility.
          </p>
        </div>

        {/* GPS Geolocation Button */}
        <div className="vp-map-actions">
          <button
            className={`vp-btn vp-btn--secondary vp-btn--sm ${geoStatus === 'locating' ? 'loading' : ''}`}
            onClick={handleRequestLocation}
            type="button"
            title="Use browser geolocation to center your position"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
            </svg>
            <span>
              {geoStatus === 'locating'
                ? 'Locating…'
                : geoStatus === 'granted'
                ? 'GPS Active'
                : geoStatus === 'denied'
                ? 'Demo Location (GPS Denied)'
                : 'Use My Location'}
            </span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Surface */}
      <div className="vp-map-canvas-wrapper" style={{ height: '380px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={9}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        >
          <ChangeMapView center={mapCenter} zoom={selectedOppId ? 11 : 9} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url={tileUrl}
          />

          {/* 📍 User Location Marker */}
          {currentUserLoc?.lat && (
            <Marker
              position={[currentUserLoc.lat, currentUserLoc.lng]}
              icon={createUserIcon(currentUserLoc.label)}
            >
              <Popup className="vp-map-popup">
                <div className="vp-popup-content user">
                  <div className="vp-popup-header">
                    <span className="vp-popup-badge user">Candidate Position</span>
                  </div>
                  <strong className="vp-popup-title">{currentUserLoc.label}</strong>
                  <p className="vp-popup-meta">{currentUserLoc.district || 'Chennai Region'}</p>
                  <p className="vp-popup-note">
                    Verified address cluster used for district commute calculation.
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 🏢 Opportunity Markers */}
          {validOpps.map((opp) => {
            const matchPct = Math.round((opp.match_score || 0.85) * 100)
            const isSelected = opp.id === selectedOppId

            return (
              <Marker
                key={opp.id}
                position={[opp.lat, opp.lng]}
                icon={createOpportunityIcon(matchPct, isSelected)}
                eventHandlers={{
                  click: () => onSelectOpportunity?.(opp),
                }}
              >
                <Popup className="vp-map-popup">
                  <div className="vp-popup-content opp">
                    <div className="vp-popup-header">
                      <span className="vp-popup-badge match font-mono">{matchPct}% VoicePath Match</span>
                      <span className="vp-popup-badge eligible">
                        {opp.eligibility || '✓ Eligible'}
                      </span>
                    </div>

                    <h4 className="vp-popup-title">{opp.title}</h4>
                    <p className="vp-popup-company">
                      <strong>{opp.company}</strong> · <span className="text-muted">{opp.district}</span>
                    </p>

                    <div className="vp-popup-salary font-mono">
                      💰 {opp.salary_range}
                    </div>

                    <div className="vp-popup-matched-skills">
                      <span className="vp-popup-skills-label">Matched Skills:</span>
                      <div className="vp-popup-chips">
                        {opp.matched_skills?.slice(0, 3).map((s) => (
                          <span key={s} className="vp-popup-chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {opp.source_label && (
                      <p className="vp-popup-source text-muted">
                        Source: {opp.source_label}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Floating Map Legend Overlay */}
        <div className="vp-map-floating-legend">
          <div className="vp-map-legend-row">
            <span className="vp-legend-dot user-pulse" />
            <span>Candidate (You)</span>
          </div>
          <div className="vp-map-legend-row">
            <span className="vp-legend-dot opp-marker" />
            <span>Verified Employer</span>
          </div>
          <div className="vp-map-legend-row">
            <span className="vp-badge vp-badge--neutral font-mono" style={{ fontSize: '0.62rem' }}>
              DEMO GIS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
