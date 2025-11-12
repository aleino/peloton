# User Interface Overview

This document describes the HSL Citybike Dashboard user interface.

## Main Dashboard View

The dashboard consists of three main sections:

### 1. Header Bar (Top)
```
┌────────────────────────────────────────────────────────────────────┐
│ 🚴 HSL Citybike Dashboard                                          │
│                                                                    │
│ Stations: 10    Available Bikes: 115    Available Docks: 185      │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Application title with bicycle emoji
- Real-time statistics:
  - Total number of stations
  - Total available bikes across all stations
  - Total available docks across all stations
- Blue gradient background (#007ac9)
- Auto-updates every 30 seconds

### 2. Sidebar (Left - 350px width)

```
┌──────────────────────────────────┐
│  [Search stations...]            │
│  [Sort by Name ▼]                │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐ │
│  │ Kaivopuisto              ● │ │ ◄── Green indicator (high availability)
│  │ Meritori 1                 │ │
│  │ 🚴 Bikes: 12               │ │
│  │ 🅿️  Docks: 18               │ │
│  │ 📊 Capacity: 30            │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Töölönlahdenpuisto       ● │ │ ◄── Orange indicator (medium)
│  │ Töölönlahdenkatu           │ │
│  │ 🚴 Bikes: 15               │ │
│  │ 🅿️  Docks: 25               │ │
│  │ 📊 Capacity: 40            │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Rautatientori            ● │ │ ◄── Green indicator
│  │ Kaivokatu 1                │ │
│  │ 🚴 Bikes: 20               │ │
│  │ 🅿️  Docks: 30               │ │
│  │ 📊 Capacity: 50            │ │
│  └────────────────────────────┘ │
│                                  │
│  ... (scrollable)                │
└──────────────────────────────────┘
```

**Features:**
- Search box - filter stations by name or address
- Sort dropdown - sort by name, available bikes, or available docks
- Station cards showing:
  - Station name (bold)
  - Address (gray text)
  - Availability indicator (colored dot)
  - Available bikes with bicycle emoji
  - Available docks with parking emoji
  - Total capacity with chart emoji
- Clickable cards - select station to view on map
- Highlighted selected card (blue border)
- Scrollable list

**Color Indicators:**
- 🟢 Green: High availability (>50% bikes)
- 🟠 Orange: Medium availability (20-50% bikes)
- 🔴 Red: Low availability (<20% bikes)
- ⚪ Gray: Empty (0 bikes)

### 3. Map View (Right - Remaining space)

```
┌────────────────────────────────────────────────────────────────┐
│  [+] [-]  ↑→↓←                                                 │ ◄── Navigation controls
│                                                                │
│                    Helsinki                                    │
│                                                                │
│              ●                                                 │
│        ●          ●                                            │
│                        ●                                       │
│    ●      ●                                                    │
│              ●                                                 │
│         ●          ●                                           │
│                                                                │
│                                                                │
│    ┌─────────────────────────────┐                           │
│    │ Kaivopuisto                 │  ◄── Station popup         │
│    │ Meritori 1                  │                            │
│    │ ─────────────────────────   │                            │
│    │ 🚴 Bikes: 12                │                            │
│    │ 🅿️  Docks: 18                │                            │
│    │ 📊 Capacity: 30             │                            │
│    └─────────────────────────────┘                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Features:**
- Interactive Mapbox GL map
- Centered on Helsinki (60.192059, 24.945831)
- Station markers:
  - Circular markers (40px diameter)
  - Color-coded by availability (green/orange/red)
  - Shows number of available bikes
  - White border for visibility
- Clickable markers - opens popup and selects station
- Popup displays:
  - Station name (blue heading)
  - Address
  - Available bikes, docks, and capacity
- Navigation controls:
  - Zoom in/out buttons
  - Compass and orientation controls
- Smooth fly-to animation when station selected
- Vector tile rendering for performance

## Interaction Flows

### Searching for a Station

1. User types in search box (e.g., "kaivo")
2. List filters in real-time
3. Matching stations shown
4. Click station card to view on map

### Selecting a Station

**From Sidebar:**
1. Click station card
2. Card highlights with blue border
3. Map animates (flies) to station location
4. Marker popup opens automatically

**From Map:**
1. Click station marker
2. Popup appears above marker
3. Corresponding card highlights in sidebar
4. Sidebar scrolls to show selected card (if needed)

### Sorting Stations

1. Click sort dropdown
2. Select option:
   - "Sort by Name" - Alphabetical order
   - "Sort by Bikes" - Most bikes first
   - "Sort by Docks" - Most docks first
3. List re-orders immediately

### Auto-Refresh

- Every 30 seconds:
  - Statistics update
  - Station data refreshes
  - Marker colors update
  - List updates
- Smooth transitions, no page reload

## Responsive Design

### Desktop (>768px)
- Sidebar: 350px fixed width
- Map: Remaining space
- Full statistics bar visible

### Mobile (<768px)
- Sidebar: Full width, 40vh max height
- Map: Below sidebar
- Statistics bar: Wrapped layout
- Touch-friendly tap targets

## Color Scheme

### Primary Colors
- **Primary Blue**: #007ac9 (header, selected items, links)
- **Dark Blue**: #005a9c (header gradient)

### Status Colors
- **Success/High**: #10b981 (green)
- **Warning/Medium**: #f59e0b (orange)
- **Error/Low**: #ef4444 (red)
- **Inactive**: #9ca3af (gray)

### Neutral Colors
- **Background**: #f8f9fa (light gray)
- **White**: #ffffff (cards, popups)
- **Text**: #333333 (primary text)
- **Light Text**: #666666 (secondary text)
- **Border**: #e0e0e0 (dividers)

## Typography

- **Primary Font**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', etc.)
- **Headings**: 600 weight
- **Body**: 400 weight
- **Small Text**: 0.85-0.9rem
- **Headers**: 1.8rem

## Accessibility

- Semantic HTML elements
- Color indicators supplemented with emoji
- Keyboard navigation support
- ARIA labels (future improvement)
- Sufficient color contrast
- Touch targets >44px on mobile

## Future UI Enhancements

- Dark mode toggle
- Favorite stations (star icon)
- Trip history visualization
- Charts and graphs
- Station details modal
- Weather overlay
- Route planning
- Notifications for low availability
