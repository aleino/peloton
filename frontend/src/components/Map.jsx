import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'

// Note: Replace with your Mapbox access token
// For development, you can use a public token or set it via environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example'

function Map({ stations, selectedStation, onSelectStation }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  useEffect(() => {
    if (map.current) return // Initialize map only once

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [24.945831, 60.192059], // Helsinki center
      zoom: 11
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }, [])

  useEffect(() => {
    if (!map.current || !stations.length) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for each station
    stations.forEach(station => {
      const availability = station.available_bikes / station.capacity
      let color = '#10b981' // green
      if (availability < 0.2) color = '#ef4444' // red
      else if (availability < 0.5) color = '#f59e0b' // orange

      const el = document.createElement('div')
      el.className = 'marker'
      el.style.backgroundColor = color
      el.innerHTML = `<div class="marker-label">${station.available_bikes}</div>`

      el.addEventListener('click', () => {
        onSelectStation(station)
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat([station.longitude, station.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(
              `<div class="popup">
                <h3>${station.name}</h3>
                <p class="address">${station.address || ''}</p>
                <div class="popup-stats">
                  <div>🚴 Bikes: <strong>${station.available_bikes}</strong></div>
                  <div>🅿️ Docks: <strong>${station.available_docks}</strong></div>
                  <div>📊 Capacity: <strong>${station.capacity}</strong></div>
                </div>
              </div>`
            )
        )
        .addTo(map.current)

      markers.current.push(marker)
    })
  }, [stations, onSelectStation])

  useEffect(() => {
    if (!map.current || !selectedStation) return

    map.current.flyTo({
      center: [selectedStation.longitude, selectedStation.latitude],
      zoom: 14,
      duration: 1000
    })

    // Open the popup for selected station
    const selectedMarker = markers.current.find(marker => {
      const lngLat = marker.getLngLat()
      return lngLat.lng === selectedStation.longitude && lngLat.lat === selectedStation.latitude
    })

    if (selectedMarker) {
      selectedMarker.togglePopup()
    }
  }, [selectedStation])

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
    </div>
  )
}

export default Map
