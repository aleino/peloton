import { useState } from 'react'
import './Sidebar.css'

function Sidebar({ stations, selectedStation, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const filteredStations = stations
    .filter(station => 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.address && station.address.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'bikes':
          return b.available_bikes - a.available_bikes
        case 'docks':
          return b.available_docks - a.available_docks
        default:
          return 0
      }
    })

  const getAvailabilityClass = (station) => {
    const availability = station.available_bikes / station.capacity
    if (availability === 0) return 'empty'
    if (availability < 0.2) return 'low'
    if (availability < 0.5) return 'medium'
    return 'high'
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <input
          type="text"
          placeholder="Search stations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="bikes">Sort by Bikes</option>
          <option value="docks">Sort by Docks</option>
        </select>
      </div>

      <div className="stations-list">
        {filteredStations.length === 0 ? (
          <div className="no-results">
            <p>No stations found</p>
          </div>
        ) : (
          filteredStations.map(station => (
            <div
              key={station.id}
              className={`station-card ${selectedStation?.id === station.id ? 'selected' : ''}`}
              onClick={() => onSelectStation(station)}
            >
              <div className="station-header">
                <h3 className="station-name">{station.name}</h3>
                <div className={`availability-indicator ${getAvailabilityClass(station)}`} />
              </div>
              <p className="station-address">{station.address}</p>
              <div className="station-info">
                <div className="info-item">
                  <span className="info-icon">🚴</span>
                  <span className="info-label">Bikes:</span>
                  <span className="info-value">{station.available_bikes}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🅿️</span>
                  <span className="info-label">Docks:</span>
                  <span className="info-value">{station.available_docks}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📊</span>
                  <span className="info-label">Capacity:</span>
                  <span className="info-value">{station.capacity}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Sidebar
