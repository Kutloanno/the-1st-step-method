# The 1st Step Method | 90-Day R5k Roadmap

An interactive, high-performance course landing platform and 3D cinema seat reservation experience co-created by **Jay & Kutloano**.

---

## 🌟 Highlights & Architecture

1. **View 1: 3D Planetary Scrubber Hub (Minimalist Studio White)**
   - Procedural WebGL 3D globe powered by Three.js with realistic planetary stages.
   - Interactive Gaussian wave tick-mark ruler dial to scrub through the curriculum eras.
   - Dynamic stage metadata, era badge tags, and explore actions.

2. **View 2: Course Curriculum & Story Subpages**
   - **The River**: NSFAS scramble to R5k/month journey and Side A vs Side B comparison.
   - **The Method**: The 4-step framework (Skills, Positioning, Outreach, Delivery).
   - **Jay & Kutloano**: Instructor profiles, student testimonials, and mentorship pledge.
   - **90-Day Roadmap**: 8-week syllabus timeline with deliverables and milestones.
   - **Wins & Guarantees**: Social proof, 100% double guarantee, and interactive FAQ accordion.
   - Sticky navigation header with swipeable subpage tabs and quick-claim CTA.

3. **View 3: 2D-to-3D Cinema Seat Reservation Explorer (Deep Obsidian Theme)**
   - 108 capped seats with real-time availability, reserved seats, and VIP recliner tiers.
   - Full 3D POV auditorium fly-in with camera raycasting, sightline metrics (distance, FOV, lateral offset), and interactive minimap radar.
   - Full-screen theater layout (`100dvh`) with stacked companion showcase controls on mobile and side-by-side architecture on widescreen desktop.

4. **Multi-Device Responsive Optimization**
   - Engineered and tested across small smartphones (375px), standard phones (393px–430px), mobile landscape (844×390), tablets (768×1024), and desktop monitors (1366×768+).
   - Fluid typography and clamp-based seat grid geometry preventing edge clipping.

---

## 🚀 Getting Started

### Local Development

1. Clone or download the repository:
   ```bash
   git clone <REPO_URL>
   cd "Course Site"
   ```

2. Run the built-in local server (PowerShell):
   ```powershell
   powershell -ExecutionPolicy Bypass -File "server.ps1"
   ```
   Or use any static HTTP server (e.g., Python or Node):
   ```bash
   python -m http.server 8080
   # or
   npx serve .
   ```

3. Open in your browser:
   ```
   http://localhost:8080/
   ```

---

## 📁 Project Structure

```
├── index.html       # Single-Page Application structure (Hub, Subpages, Theater)
├── styles.css       # Studio White & Cinema Obsidian design systems + media queries
├── app.js           # Three.js engines, 2D/3D seat explorer, routing & state
├── server.ps1       # Lightweight PowerShell HTTP server daemon
├── vendor/          # Offline Three.js library and OrbitControls
└── .gitignore       # Git ignore rules
```
