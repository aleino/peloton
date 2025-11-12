import { useState, useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  const [stations, setStations] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStations()
    fetchStats()
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchStations()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations')
      if (!response.ok) throw new Error('Failed to fetch stations')
      const data = await response.json()
      setStations(data)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading HSL Citybike Dashboard...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error: {error}</h2>
        <p>Please make sure the backend server is running.</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚴 HSL Citybike Dashboard</h1>
        {stats && (
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">Stations:</span>
              <span className="stat-value">{stats.total_stations}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Available Bikes:</span>
              <span className="stat-value">{stats.total_bikes}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Available Docks:</span>
              <span className="stat-value">{stats.total_docks}</span>
            </div>
          </div>
        )}
      </header>
      <div className="app-content">
        <Sidebar
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
        />
        <Map
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
        />
      </div>
    </div>
  )
}

export default App
