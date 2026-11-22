/**
 * THE 1ST STEP METHOD · ONLINE COURSE PLATFORM & 3D PLANETARY / CINEMA SEAT SYSTEM
 * Co-Founded by Jay & Kutloano (Helping NSFAS varsity students make R5,000/month)
 * Unified interactive application controller:
 * 1. 3D Planetary Scrubber Engine (White Studio Hub + Gaussian Wave Ruler)
 * 2. Course Subpages System (The River, The Method, Jay & Kutloano, 90-Day Roadmap, Wins & Proof)
 * 3. 2D-to-3D Cinema Seat Selector (Cohort 04 Auditorium, 108 Capped Spots)
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION & DATA DICTIONARIES
  // ==========================================================================

  // 6 Planetary Stages corresponding to course pages
  const PLANET_STAGES = [
    {
      id: 0,
      era: 'Stage 01 · The Genesis',
      title: 'The River: NSFAS to 5k per month',
      sub: 'From broke on the 10th of the month to a consistent R5,000/mo online',
      cta: 'Explore The River',
      target: 'subpage-0',
      color: '#e26a2c'
    },
    {
      id: 1,
      era: 'Stage 02 · Protoplanet',
      title: 'The 1st Step Method',
      sub: 'Why traditional courses fail & how our creator stack works',
      cta: 'Explore The Method',
      target: 'subpage-1',
      color: '#4b5563'
    },
    {
      id: 2,
      era: 'Stage 03 · Magma Core',
      title: 'Jay & Kutloano',
      sub: 'Meet the varsity founders: R100k+ earned, zero foreign theory',
      cta: 'Meet The Founders',
      target: 'subpage-2',
      color: '#c2410c'
    },
    {
      id: 3,
      era: 'Stage 04 · First Oceans',
      title: 'The 90-Day Roadmap',
      sub: 'The 4 Stepping Stones: UGC, Storefront, Clients & AI Scale',
      cta: 'Explore The Roadmap',
      target: 'subpage-3',
      color: '#0d9488'
    },
    {
      id: 4,
      era: 'Stage 05 · Pangaea',
      title: 'Wins & Proof',
      sub: 'Real student results, Dinner Party Brag & verified creator retainers',
      cta: 'Explore Student Wins',
      target: 'subpage-4',
      color: '#059669'
    },
    {
      id: 5,
      era: 'Today · Open Enrollment',
      title: 'Available Spots in 3D',
      sub: 'First Step Method Available Spots · 25 Limited Spots (5 Free)',
      cta: 'Claim Your Spot',
      target: 'seats-page',
      color: '#7ee09b'
    }
  ];

  // Cohort Row Metrics (25 Capped Spots: 5 Rows x 5 Seats · 5 Free Student Seats)
  const ROWS = ['A', 'B', 'C', 'D', 'E'];
  const SEATS_PER_ROW = 5;

  const ROW_METRICS = {
    A: { dist: 6.0, fov: 78, zone: 'COHORT SPOT', type: 'Cohort 01 Pass', price: 499, desc: 'Direct live engagement with instructors' },
    B: { dist: 7.5, fov: 68, zone: 'COHORT SPOT', type: 'Cohort 01 Pass', price: 499, desc: 'Optimal focal axis for live review sessions' },
    C: { dist: 9.0, fov: 60, zone: 'COHORT SPOT', type: 'Cohort 01 Pass', price: 499, desc: 'Balanced perspective for masterclass breakdowns' },
    D: { dist: 10.5, fov: 54, zone: 'COHORT SPOT', type: 'Cohort 01 Pass', price: 499, desc: 'Full overview & active cohort participation' },
    E: { dist: 12.0, fov: 48, zone: 'FREE STUDENT SPOT', type: 'Free Student Seat', price: 0, desc: '100% Free scholarship seat for university students' }
  };

  const SEAT_LATERAL_OFFSETS = [
    { seat: 1, offset: 2.0, dir: 'left side', sign: -1 },
    { seat: 2, offset: 1.0, dir: 'left center', sign: -1 },
    { seat: 3, offset: 0.0, dir: 'centerline', sign: 0 },
    { seat: 4, offset: 1.0, dir: 'right center', sign: 1 },
    { seat: 5, offset: 2.0, dir: 'right side', sign: 1 }
  ];

  const TAKEN_SEATS = {
    'Cohort 01': {
      A: [],
      B: [],
      C: [],
      D: [],
      E: []
    },
    'Cohort 1': {
      A: [],
      B: [],
      C: [],
      D: [],
      E: []
    }
  };

  // Global Application State
  const state = {
    theme: 'light',
    currentView: 'planet-hub', // 'planet-hub' | 'course-pages' | 'seats-page'
    currentStageIndex: 0,
    currentSubpageIndex: 0,
    currentCohort: 'Cohort 01',
    selectedRow: 'B',
    selectedSeat: 3,
    cinemaMode: '2D', // '2D' | '3D'
    transitioning: false,
    drawerMinimized: false,
    audioPlaying: false
  };

  // ==========================================================================
  // DOM REFERENCES
  // ==========================================================================
  // Views
  const viewPlanetHub = document.getElementById('view-planet-hub');
  const viewCoursePages = document.getElementById('view-course-pages');
  const viewSeatsPage = document.getElementById('view-seats-page');

  // Planet Hub Elements
  const elPlanetCanvasWrap = document.getElementById('planet-canvas-wrapper');
  const elPlanetEraHeader = document.getElementById('planet-era-header');
  const elPlanetPageTitle = document.getElementById('planet-page-title');
  const elPlanetPageSubtitle = document.getElementById('planet-page-subtitle');
  const elPlanetExploreBtn = document.getElementById('planet-explore-btn');
  const elExploreBtnText = document.getElementById('explore-btn-text');
  const elScrubberTrack = document.getElementById('scrubber-track');
  const elScrubberDial = document.getElementById('scrubber-dial');
  const elHeaderClaimBtn = document.getElementById('header-claim-btn');
  const elAnchorStart = document.getElementById('anchor-start');
  const elAnchorSeats = document.getElementById('anchor-seats');

  // Subpage Elements
  const elSubpageTabs = document.querySelectorAll('.subpage-tab');
  const elSubpageSections = document.querySelectorAll('.subpage-section');
  const elBtnBackToPlanets = document.getElementById('btn-back-to-planets');
  const elSubpageClaimCta = document.getElementById('subpage-claim-cta');

  // Cinema Seats Elements
  const elGrid = document.getElementById('auditorium-grid');
  const elScreen2D = document.getElementById('screen-2d');
  const elScreen3D = document.getElementById('screen-3d');
  const elBtnContinue = document.getElementById('btn-continue');
  const elBarSeatLabel = document.getElementById('bar-seat-label');
  const elBarPriceLabel = document.getElementById('bar-price-label');
  const elPovDrawer = document.getElementById('pov-drawer');
  const elDrawerHandle = document.getElementById('drawer-handle');
  const elBtnChangeSeat = document.getElementById('btn-change-seat');
  const elBtnBack3D = document.getElementById('btn-back-3d');
  const elBtnBack2D = document.getElementById('btn-back-2d');
  const elBtnRecenter = document.getElementById('btn-recenter-view');
  const elBtnBook = document.getElementById('btn-book-seat');
  const elBtnBookText = document.getElementById('btn-book-text');
  const elRadarMatrix = document.getElementById('radar-matrix');
  const elLookHint = document.getElementById('look-hint');

  // Drawer metric elements
  const elDrawerSeatTitle = document.getElementById('drawer-seat-title');
  const elDrawerSeatSub = document.getElementById('drawer-seat-sub');
  const elDrawerZoneBadge = document.getElementById('drawer-zone-badge');
  const elMetricDist = document.getElementById('metric-dist');
  const elMetricDistSub = document.getElementById('metric-dist-sub');
  const elMetricFov = document.getElementById('metric-fov');
  const elMetricFovSub = document.getElementById('metric-fov-sub');
  const elMetricOffset = document.getElementById('metric-offset');
  const elMetricOffsetDir = document.getElementById('metric-offset-dir');
  const elPovStatusSeat = document.getElementById('pov-status-seat');

  // Modals & Extras
  const elSpecsModal = document.getElementById('specs-modal');
  const elBtnInfo = document.getElementById('btn-info');
  const elBtnCloseSpecs = document.getElementById('btn-close-specs');
  const elBtnDoneSpecs = document.getElementById('btn-done-specs');
  const elSpecsTriggerSidebar = document.getElementById('specs-modal-trigger');
  const elTicketModal = document.getElementById('ticket-modal');
  const elBtnConfirmTicket = document.getElementById('btn-confirm-ticket');
  const elTShowtime = document.getElementById('t-showtime');
  const elTSeat = document.getElementById('t-seat');
  const elTZone = document.getElementById('t-zone');
  const elTPrice = document.getElementById('t-price');
  const elTMetrics = document.getElementById('t-metrics');
  const elAmbientAudioBtn = document.getElementById('ambient-audio-btn');

  // Checkout & Paystack Elements
  const elCheckoutModal = document.getElementById('checkout-modal');
  const elBtnCloseCheckout = document.getElementById('btn-close-checkout');
  const elCheckoutSummarySpot = document.getElementById('checkout-summary-spot');
  const elCheckoutSummaryPrice = document.getElementById('checkout-summary-price');
  const elCheckoutTierBadge = document.getElementById('checkout-tier-badge');
  const elCheckoutModalTitle = document.getElementById('checkout-modal-title');
  const elCheckoutForm = document.getElementById('checkout-form');
  const elStudentName = document.getElementById('student-name');
  const elStudentEmail = document.getElementById('student-email');
  const elStudentPhone = document.getElementById('student-phone');
  const elStudentAge = document.getElementById('student-age');
  const elBtnPaystackSubmit = document.getElementById('btn-paystack-submit');
  const elCheckoutBtnText = document.getElementById('checkout-btn-text');
  const elTrustGuaranteeText = document.getElementById('trust-guarantee-text');
  const elPaystackTrustBadge = document.getElementById('paystack-trust-badge');

  // ==========================================================================
  // THEME ENFORCEMENT (PERMANENT MODERN STUDIO LIGHT MODE)
  // ==========================================================================
  function applyTheme() {
    state.theme = 'light';
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');

    try {
      localStorage.removeItem('first_step_theme');
    } catch (e) {}

    if (typeof updateScrubberUI === 'function') {
      updateScrubberUI();
    }
  }

  function initTheme() {
    applyTheme();
  }

  // ==========================================================================
  // 1. PAGE NAVIGATION MANAGER (PLANET HUB <-> SUBPAGES <-> SEATS)
  // ==========================================================================
  function switchView(viewName) {
    if (state.currentView === viewName) return;
    state.currentView = viewName;

    [viewPlanetHub, viewCoursePages, viewSeatsPage].forEach(v => v.classList.remove('active'));

    // Re-apply active theme classes across views
    applyTheme();

    if (viewName === 'planet-hub') {
      viewPlanetHub.classList.add('active');
      setTimeout(() => {
        if (planetRenderer && planetCamera && elPlanetCanvasWrap) {
          const pw = elPlanetCanvasWrap.clientWidth;
          const ph = elPlanetCanvasWrap.clientHeight;
          if (pw > 0 && ph > 0) {
            planetCamera.aspect = pw / ph;
            planetCamera.updateProjectionMatrix();
            planetRenderer.setSize(pw, ph);
          }
        }
      }, 50);
    } else if (viewName === 'course-pages') {
      viewCoursePages.classList.add('active');
    } else if (viewName === 'seats-page') {
      viewSeatsPage.classList.add('active');
      viewSeatsPage.scrollTop = 0;
      // Ensure 2D map is visible and 3D is reset
      exitTo2DMap();
      render2DSeatGrid();
      setTimeout(() => {
        onCinemaWindowResize();
      }, 50);
    }
  }

  function openCourseSubpage(index) {
    state.currentSubpageIndex = index;
    elSubpageTabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
    elSubpageSections.forEach((sec, i) => {
      sec.classList.toggle('active', i === index);
    });
    switchView('course-pages');
    viewCoursePages.scrollTop = 0;
  }

  function initPageRouting() {
    // Top nav stage links
    document.querySelectorAll('.nav-stage-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const stage = parseInt(link.dataset.stage, 10);
        if (stage === 5) {
          switchView('seats-page');
        } else {
          setScrubberStage(stage, true);
        }
      });
    });

    // Header claim button & anchor seats button
    if (elHeaderClaimBtn) elHeaderClaimBtn.addEventListener('click', () => switchView('seats-page'));
    if (elAnchorSeats) elAnchorSeats.addEventListener('click', () => switchView('seats-page'));
    if (elSubpageClaimCta) elSubpageClaimCta.addEventListener('click', () => switchView('seats-page'));

    // Subpage back button
    if (elBtnBackToPlanets) elBtnBackToPlanets.addEventListener('click', () => switchView('planet-hub'));

    // Subpage tab pills
    elSubpageTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => openCourseSubpage(i));
    });

    // Subpage in-page CTA buttons
    document.querySelectorAll('[data-action="go-to-seats"]').forEach(btn => {
      btn.addEventListener('click', () => switchView('seats-page'));
    });

    // 2D Seat Map back chevron -> returns to Planet Scrubber Hub
    if (elBtnBack2D) {
      elBtnBack2D.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('planet-hub');
      });
    }

    // Logo click returns to planet hub
    const logoLink = document.getElementById('studio-logo-link');
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        setScrubberStage(0, true);
        switchView('planet-hub');
      });
    }

    // Planet explore button
    if (elPlanetExploreBtn) {
      elPlanetExploreBtn.addEventListener('click', () => {
        const stage = PLANET_STAGES[state.currentStageIndex];
        if (stage.id === 5) {
          switchView('seats-page');
        } else {
          openCourseSubpage(stage.id);
        }
      });
    }

    // URL Hash Deep Linking Support
    function handleHashRoute() {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#seats' || hash === '#auditorium') {
        switchView('seats-page');
      } else if (hash === '#3d' || hash === '#seats-3d') {
        switchView('seats-page');
        setTimeout(() => triggerFlyInTo3D(), 150);
      } else if (hash === '#subpage-0' || hash === '#the-river' || hash === '#river') {
        openCourseSubpage(0);
      } else if (hash === '#subpage-1' || hash === '#the-method' || hash === '#method') {
        openCourseSubpage(1);
      } else if (hash === '#subpage-2' || hash === '#jay-kutloano' || hash === '#founders') {
        openCourseSubpage(2);
      } else if (hash === '#subpage-3' || hash === '#roadmap' || hash === '#curriculum') {
        openCourseSubpage(3);
      } else if (hash === '#subpage-4' || hash === '#wins' || hash === '#proof' || hash === '#guarantees' || hash === '#faq') {
        openCourseSubpage(4);
      } else if (hash === '#planet' || hash === '#home') {
        switchView('planet-hub');
      }
    }

    window.addEventListener('hashchange', handleHashRoute);
    if (window.location.hash) {
      handleHashRoute();
    }
  }

  // ==========================================================================
  // 2. 3D PLANETARY SCRUBBER ENGINE (THREE.JS + PROCEDURAL TEXTURES)
  // ==========================================================================
  let planetScene, planetCamera, planetRenderer, planetMesh;
  let planetTextures = [];
  let spinVelocity = 0;
  let isDraggingGlobe = false;
  let globeDragStart = { x: 0, y: 0 };
  let currentTickValue = 0; // Float between 0 and 44
  const TOTAL_TICKS = 45;

  // Generate procedural canvas textures for all 6 planetary stages
  function generateProceduralPlanetTexture(stageIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    if (stageIndex === 0) {
      // 1. Solar Fireball (Genesis): Glowing plasma, granulation, solar flares
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#ff4500');
      grad.addColorStop(0.3, '#ffaa00');
      grad.addColorStop(0.6, '#ff2200');
      grad.addColorStop(1, '#ffdd44');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Convective granules
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 32 + 8;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 240, 160, 0.45)' : 'rgba(180, 20, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stageIndex === 1) {
      // 2. Protoplanet (4.6B): Dark charcoal basalt with glowing lava fissures
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);

      // Impact craters
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = Math.random() * 24 + 6;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glowing magma cracks
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2.5;
      for (let j = 0; j < 14; j++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, Math.random() * h);
        for (let k = 0; k < 6; k++) {
          ctx.lineTo(Math.random() * w, Math.random() * h);
        }
        ctx.stroke();
      }
    } else if (stageIndex === 2) {
      // 3. Magma Ocean (4.5B): Glowing mantle, molten veins, dark crust islands
      const lavaGrad = ctx.createLinearGradient(0, 0, 0, h);
      lavaGrad.addColorStop(0, '#c2410c');
      lavaGrad.addColorStop(0.5, '#f97316');
      lavaGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, 0, w, h);

      // Dark crust tectonic fragments
      ctx.fillStyle = '#18181b';
      for (let i = 0; i < 35; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.random() * 80 + 30, Math.random() * 40 + 15, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stageIndex === 3) {
      // 4. First Oceans (4.4B / 3.7B): Deep teal ancient oceans with volcanic land
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, w, h);

      // Primitive continents / island arcs
      ctx.fillStyle = '#292524';
      for (let i = 0; i < 24; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 60 + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // Atmospheric haze gradient
      const haze = ctx.createLinearGradient(0, 0, 0, h);
      haze.addColorStop(0, 'rgba(251, 146, 60, 0.25)');
      haze.addColorStop(0.5, 'transparent');
      haze.addColorStop(1, 'rgba(251, 146, 60, 0.25)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    } else if (stageIndex === 4) {
      // 5. Pangaea & Snowball Earth: Polar glaciers and huge green/gold supercontinent
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, w, h);

      // Polar ice caps
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h * 0.18);
      ctx.fillRect(0, h * 0.82, w, h * 0.18);

      // Pangaea supercontinent
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.25);
      ctx.bezierCurveTo(w * 0.65, h * 0.22, w * 0.75, h * 0.5, w * 0.62, h * 0.72);
      ctx.bezierCurveTo(w * 0.45, h * 0.80, w * 0.28, h * 0.65, w * 0.32, h * 0.45);
      ctx.closePath();
      ctx.fill();

      // Desert interior
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 6. Earth Today (Blue Marble): Deep blue oceans, continents, desert belts, white clouds
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, w, h);

      // Continents (Americas & Afro-Eurasia outlines)
      ctx.fillStyle = '#16a34a';
      // Americas
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.42, 70, 110, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eurasia / Africa
      ctx.beginPath();
      ctx.ellipse(w * 0.68, h * 0.45, 120, 95, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Desert belt
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(w * 0.66, h * 0.44, 60, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling white clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      for (let c = 0; c < 18; c++) {
        ctx.beginPath();
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        ctx.ellipse(cx, cy, Math.random() * 90 + 30, Math.random() * 22 + 8, Math.random() * 0.6 - 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  function initPlanetThreeJS() {
    if (!elPlanetCanvasWrap) return;
    const width = elPlanetCanvasWrap.clientWidth || 380;
    const height = elPlanetCanvasWrap.clientHeight || 380;

    planetScene = new THREE.Scene();

    planetCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    planetCamera.position.set(0, 0, 4.4);

    planetRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    planetRenderer.setSize(width, height);
    planetRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    planetRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    planetRenderer.toneMappingExposure = 1.15;
    elPlanetCanvasWrap.appendChild(planetRenderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    planetScene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    keyLight.position.set(5, 4, 4);
    planetScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8bc4ff, 0.55);
    rimLight.position.set(-5, -2, -3);
    planetScene.add(rimLight);

    // Pre-generate all 6 planet textures
    for (let i = 0; i < 6; i++) {
      planetTextures.push(generateProceduralPlanetTexture(i));
    }

    // Centered 3D Sphere (1.55 radius, 64 segments)
    const sphereGeom = new THREE.SphereGeometry(1.55, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: planetTextures[0],
      roughness: 0.65,
      metalness: 0.05
    });

    planetMesh = new THREE.Mesh(sphereGeom, sphereMat);
    planetScene.add(planetMesh);

    // Globe drag interaction
    initGlobeDragControls();

    // Render Loop
    requestAnimationFrame(renderPlanetLoop);
  }

  function renderPlanetLoop() {
    requestAnimationFrame(renderPlanetLoop);

    if (state.currentView !== 'planet-hub' || !planetMesh) return;

    // Idle rotation + momentum decay
    planetMesh.rotation.y += 0.0045 + spinVelocity;
    spinVelocity *= 0.92;

    // Apply motion blur when scrubbing fast
    if (Math.abs(spinVelocity) > 0.04) {
      elPlanetCanvasWrap.style.filter = 'blur(1.2px)';
    } else {
      elPlanetCanvasWrap.style.filter = 'none';
    }

    planetRenderer.render(planetScene, planetCamera);
  }

  function initGlobeDragControls() {
    const el = elPlanetCanvasWrap;
    if (!el) return;

    const onStart = (cx, cy) => {
      isDraggingGlobe = true;
      globeDragStart.x = cx;
      globeDragStart.y = cy;
    };

    const onMove = (cx, cy) => {
      if (!isDraggingGlobe || !planetMesh) return;
      const dx = cx - globeDragStart.x;
      globeDragStart.x = cx;
      globeDragStart.y = cy;

      // Rotate planet on drag
      planetMesh.rotation.y += dx * 0.012;
      spinVelocity = dx * 0.006;

      // Adjust scrubber value smoothly
      currentTickValue = Math.max(0, Math.min(TOTAL_TICKS - 1, currentTickValue + dx * 0.12));
      updateScrubberUI();
    };

    const onEnd = () => {
      isDraggingGlobe = false;
    };

    el.addEventListener('pointerdown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    // Touch support
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', onEnd);

    // Wheel scrolling on the planet hub scrubs between stages (inverted scroll direction)
    window.addEventListener('wheel', (e) => {
      if (state.currentView !== 'planet-hub') return;
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      spinVelocity -= delta * 0.00045;
      currentTickValue = Math.max(0, Math.min(TOTAL_TICKS - 1, currentTickValue - delta * 0.035));
      updateScrubberUI();
    }, { passive: true });
  }

  // ==========================================================================
  // 3. BOTTOM GAUSSIAN WAVE RULER DIAL
  // ==========================================================================
  function initScrubberDial() {
    if (!elScrubberTrack) return;
    elScrubberTrack.innerHTML = '';

    // Build 45 tick marks
    for (let i = 0; i < TOTAL_TICKS; i++) {
      const tick = document.createElement('div');
      tick.className = 'scrubber-tick';
      tick.dataset.index = i.toString();
      elScrubberTrack.appendChild(tick);
    }

    // Scrubber dial drag handling
    let isScrubbingRuler = false;

    const handleRulerScrub = (clientX) => {
      const rect = elScrubberTrack.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const targetTick = (relativeX / rect.width) * (TOTAL_TICKS - 1);
      
      const delta = targetTick - currentTickValue;
      spinVelocity = delta * 0.04;
      currentTickValue = targetTick;
      updateScrubberUI();
    };

    elScrubberDial.addEventListener('pointerdown', (e) => {
      isScrubbingRuler = true;
      handleRulerScrub(e.clientX);
    });

    window.addEventListener('pointermove', (e) => {
      if (isScrubbingRuler) handleRulerScrub(e.clientX);
    });

    window.addEventListener('pointerup', () => { isScrubbingRuler = false; });
    window.addEventListener('pointercancel', () => { isScrubbingRuler = false; });

    // Anchor button listeners
    if (elAnchorStart) {
      elAnchorStart.addEventListener('click', () => setScrubberStage(0, true));
    }

    updateScrubberUI();
  }

  function setScrubberStage(stageIndex, animateSpin = false) {
    stageIndex = Math.max(0, Math.min(5, stageIndex));
    // Map stage 0..5 to ticks: 0, 9, 18, 27, 36, 44
    const tickTargets = [0, 9, 18, 27, 36, 44];
    currentTickValue = tickTargets[stageIndex];

    if (animateSpin) {
      spinVelocity = 0.22;
    }
    updateScrubberUI();
  }

  function updateScrubberUI() {
    const ticks = elScrubberTrack ? elScrubberTrack.querySelectorAll('.scrubber-tick') : [];
    const activeIndex = Math.round(currentTickValue);

    // Apply bell-curve Gaussian wave formula:
    // dist = Math.abs(tickIndex - activeTickIndex)
    // wave = Math.exp(-Math.pow(dist, 2) / 5.5)
    // height = 10 + 24 * wave (in px)
    ticks.forEach((tick, i) => {
      const dist = Math.abs(i - currentTickValue);
      const wave = Math.exp(-Math.pow(dist, 2) / 5.5);
      const h = 10 + 24 * wave;
      tick.style.height = `${h.toFixed(1)}px`;

      if (dist < 0.6) {
        tick.classList.add('center-active');
        tick.style.backgroundColor = '#111111';
      } else {
        tick.classList.remove('center-active');
        if (dist <= 2.5) {
          tick.style.backgroundColor = '#4b5563';
        } else if (dist <= 5.0) {
          tick.style.backgroundColor = '#9ca3af';
        } else {
          tick.style.backgroundColor = '#d4d4d4';
        }
      }
    });

    // Compute active stage index (0 to 5)
    const stageFloat = (currentTickValue / (TOTAL_TICKS - 1)) * 5.0;
    const stageIndex = Math.max(0, Math.min(5, Math.round(stageFloat)));

    if (stageIndex !== state.currentStageIndex) {
      state.currentStageIndex = stageIndex;
      onStageChanged(stageIndex);
    }
  }

  function onStageChanged(stageIndex) {
    const stage = PLANET_STAGES[stageIndex];
    if (!stage) return;

    // Cross-fade 2-line typography
    elPlanetEraHeader.textContent = stage.era;
    elPlanetPageTitle.textContent = stage.title;
    elPlanetPageSubtitle.textContent = stage.sub;
    elExploreBtnText.textContent = stage.cta;

    // Update top nav active pill
    document.querySelectorAll('.nav-stage-link').forEach((link, i) => {
      link.classList.toggle('active', i === stageIndex);
    });

    // Morph 3D Planet Texture
    if (planetMesh && planetTextures[stageIndex]) {
      planetMesh.material.map = planetTextures[stageIndex];
      planetMesh.material.needsUpdate = true;
    }
  }

  // ==========================================================================
  // 4. FAQ ACCORDION HANDLERS
  // ==========================================================================
  function initFAQAccordion() {
    document.querySelectorAll('.faq-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item');
        if (item) item.classList.toggle('open');
      });
    });
  }

  // ==========================================================================
  // 4B. REACTBITS COMPARISON SLIDER (BEFORE VS. AFTER OUR PTR)
  // ==========================================================================
  function initComparisonSlider() {
    const slider = document.getElementById('ptr-compare-slider');
    const handle = document.getElementById('ptr-compare-handle');
    const presetBtns = document.querySelectorAll('.comparison-presets-bar .preset-btn');
    if (!slider || !handle) return;

    let isDragging = false;
    let currentPos = 50;

    function setPosition(percent, smooth = false) {
      currentPos = Math.max(5, Math.min(95, percent));
      if (smooth) {
        slider.style.transition = '--slider-pos 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        slider.style.setProperty('--slider-pos', `${currentPos}%`);
        setTimeout(() => {
          slider.style.transition = '';
        }, 360);
      } else {
        slider.style.setProperty('--slider-pos', `${currentPos}%`);
      }
      handle.setAttribute('aria-valuenow', Math.round(currentPos));

      presetBtns.forEach(btn => {
        const p = parseFloat(btn.dataset.pos);
        btn.classList.toggle('active', Math.abs(currentPos - p) < 7);
      });
    }

    function updateFromClientX(clientX) {
      const rect = slider.getBoundingClientRect();
      if (rect.width <= 0) return;
      const x = clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setPosition(percent, false);
    }

    function onPointerDown(e) {
      if (e.target.closest('.preset-btn') || e.target.closest('button')) return;
      isDragging = true;
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {}
      updateFromClientX(e.clientX);
      slider.classList.add('is-dragging');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      updateFromClientX(e.clientX);
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (err) {}
      slider.classList.remove('is-dragging');
    }

    handle.addEventListener('pointerdown', onPointerDown);
    slider.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Keyboard navigation
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 3;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setPosition(currentPos - step, false);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setPosition(currentPos + step, false);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setPosition(5, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        setPosition(95, true);
      }
    });

    // Preset buttons
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pos = parseFloat(btn.dataset.pos);
        if (!isNaN(pos)) {
          setPosition(pos, true);
        }
      });
    });

    setPosition(50, false);
  }

  // ==========================================================================
  // 5. 2D-TO-3D CINEMA SEAT SELECTOR ("THE SEATS PAGE")
  // ==========================================================================
  function render2DSeatGrid() {
    if (!elGrid) return;
    elGrid.innerHTML = '';
    const takenMap = TAKEN_SEATS[state.currentCohort] || TAKEN_SEATS['Cohort 01'] || {};

    ROWS.forEach((rowLetter) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';
      const isFreeRow = (ROW_METRICS[rowLetter] && ROW_METRICS[rowLetter].price === 0);
      if (isFreeRow) rowDiv.classList.add('seat-row-free');

      // Left row label
      const labelDiv = document.createElement('span');
      labelDiv.className = `row-label ${isFreeRow ? 'row-label-free' : ''}`;
      if (isFreeRow) {
        labelDiv.innerHTML = `${rowLetter}<span class="free-pill-tag">FREE</span>`;
      } else {
        labelDiv.textContent = rowLetter;
      }
      rowDiv.appendChild(labelDiv);

      // Seats cluster (5 spots across = 25 total)
      const clusterDiv = document.createElement('div');
      clusterDiv.className = 'row-seats-cluster';

      const sec = createSeatSection(rowLetter, 1, SEATS_PER_ROW, false, takenMap);
      clusterDiv.appendChild(sec);

      rowDiv.appendChild(clusterDiv);
      elGrid.appendChild(rowDiv);
    });

    update2DSelectionUI();
    renderMiniRadar();
  }

  let toastTimeout = null;
  function showSeatTakenFeedback(seatBtn, rowLetter, seatNum) {
    if (seatBtn) {
      seatBtn.classList.remove('shake-seat');
      void seatBtn.offsetWidth;
      seatBtn.classList.add('shake-seat');
      setTimeout(() => seatBtn.classList.remove('shake-seat'), 400);
    }
    showToast(`Spot ${rowLetter}${seatNum} is already reserved for ${state.currentCohort}`);
  }

  function showToast(message, isSuccess = false) {
    let toast = document.getElementById('cinema-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cinema-toast';
      toast.className = 'cinema-toast';
      toast.innerHTML = '<span class="cinema-toast-dot"></span><span id="cinema-toast-msg"></span>';
      document.body.appendChild(toast);
    }
    const msgEl = document.getElementById('cinema-toast-msg');
    if (msgEl) msgEl.textContent = message;

    if (isSuccess) {
      toast.classList.add('success');
    } else {
      toast.classList.remove('success');
    }

    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function createSeatSection(rowLetter, startSeat, endSeat, isRecliner, takenMap) {
    const sec = document.createElement('div');
    sec.className = 'seat-section';

    for (let s = startSeat; s <= endSeat; s++) {
      const seatBtn = document.createElement('button');
      const isTaken = takenMap[rowLetter] && takenMap[rowLetter].includes(s);
      const isSelected = (state.selectedRow === rowLetter && state.selectedSeat === s);
      const isFree = (ROW_METRICS[rowLetter] && ROW_METRICS[rowLetter].price === 0);

      seatBtn.className = `seat-btn ${isRecliner ? 'recliner' : 'standard'} ${isTaken ? 'taken' : 'available'} ${isSelected ? 'selected' : ''} ${isFree ? 'free-seat' : ''}`;
      seatBtn.dataset.row = rowLetter;
      seatBtn.dataset.seat = s.toString();
      seatBtn.title = isTaken
        ? `Row ${rowLetter}, Seat ${s} (Reserved)`
        : isFree
          ? `Row ${rowLetter}, Seat ${s} — 100% Free Student Seat`
          : `Row ${rowLetter}, Seat ${s} — Click to view in 3D`;
      seatBtn.setAttribute('aria-label', `Row ${rowLetter}, Seat ${s}, ${isFree ? 'Free Student Seat' : isTaken ? 'Taken' : 'Available'}`);

      if (isTaken) {
        seatBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          showSeatTakenFeedback(seatBtn, rowLetter, s);
        });
      } else {
        seatBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSeatSelect(rowLetter, s, true);
        });
      }

      // Seat number label inside selected seat
      const numSpan = document.createElement('span');
      numSpan.className = 'seat-num-label';
      numSpan.textContent = s.toString();
      seatBtn.appendChild(numSpan);

      sec.appendChild(seatBtn);
    }
    return sec;
  }

  function handleSeatSelect(rowLetter, seatNum, immediateFlyIn = true) {
    if (state.transitioning) return;

    state.selectedRow = rowLetter;
    state.selectedSeat = seatNum;

    update2DSelectionUI();
    renderMiniRadar();
    updateSightlineDrawerUI();
    update3DSelectedSeatHighlight();
    updateSidebarPresetActive();

    if (immediateFlyIn) {
      if (state.cinemaMode === '2D') {
        triggerFlyInTo3D();
      } else if (state.cinemaMode === '3D') {
        smoothRepositionIn3D();
      }
    }
  }

  function update2DSelectionUI() {
    if (!elGrid) return;
    const allSeats = elGrid.querySelectorAll('.seat-btn');
    allSeats.forEach((btn) => {
      const r = btn.dataset.row;
      const s = parseInt(btn.dataset.seat, 10);
      if (r === state.selectedRow && s === state.selectedSeat) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    if (state.selectedRow && state.selectedSeat) {
      const metrics = ROW_METRICS[state.selectedRow] || { price: 499 };
      const isFree = metrics.price === 0;
      elBarSeatLabel.textContent = `Spot ${state.selectedRow}${state.selectedSeat}${isFree ? ' · Free Seat' : ''}`;
      elBarPriceLabel.textContent = isFree ? 'FREE (R0)' : `R${metrics.price.toLocaleString('en-ZA')}`;
      elBtnContinue.disabled = false;
    } else {
      elBarSeatLabel.textContent = 'Choose your cohort spot';
      elBarPriceLabel.textContent = '—';
      elBtnContinue.disabled = true;
    }
  }

  function renderMiniRadar() {
    if (!elRadarMatrix) return;
    elRadarMatrix.innerHTML = '';
    const takenMap = TAKEN_SEATS[state.currentCohort] || {};

    ROWS.forEach((rowLetter) => {
      for (let s = 1; s <= SEATS_PER_ROW; s++) {
        const dot = document.createElement('div');
        const isTaken = takenMap[rowLetter] && takenMap[rowLetter].includes(s);
        const isActive = (state.selectedRow === rowLetter && state.selectedSeat === s);
        const isFree = (ROW_METRICS[rowLetter] && ROW_METRICS[rowLetter].price === 0);

        dot.className = `radar-dot ${isTaken ? 'taken' : ''} ${isActive ? 'active' : ''} ${isFree ? 'radar-free' : ''}`;
        dot.title = isTaken
          ? `Row ${rowLetter}, Seat ${s} (Reserved)`
          : isFree
            ? `Row ${rowLetter}, Seat ${s} (100% Free Student Seat)`
            : `Row ${rowLetter}, Seat ${s} (Click to switch POV)`;

        if (!isTaken) {
          dot.style.cursor = 'pointer';
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            handleSeatSelect(rowLetter, s, true);
          });
        } else {
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            showSeatTakenFeedback(null, rowLetter, s);
          });
        }

        elRadarMatrix.appendChild(dot);
      }
    });
  }

  function updateSightlineDrawerUI() {
    if (!state.selectedRow || !state.selectedSeat) return;

    const rowLetter = state.selectedRow;
    const seatNum = state.selectedSeat;
    const rMeta = ROW_METRICS[rowLetter] || { price: 499, type: 'Cohort 01 Pass' };
    const isFree = rMeta.price === 0;

    if (elDrawerZoneBadge) {
      elDrawerZoneBadge.textContent = isFree ? 'COHORT 01 · 5 FREE STUDENT SPOTS' : 'COHORT 01 · 25 CAPPED SPOTS';
      elDrawerZoneBadge.className = isFree ? 'drawer-zone-badge zone-free' : 'drawer-zone-badge zone-sweetspot';
    }

    const elDrawerSeatPill = document.getElementById('drawer-seat-pill');
    if (elDrawerSeatPill) {
      elDrawerSeatPill.textContent = isFree ? `Spot ${rowLetter}${seatNum} (100% Free)` : `Spot ${rowLetter}${seatNum} Reserved`;
    }

    if (elDrawerSeatTitle) {
      elDrawerSeatTitle.textContent = isFree ? 'Free Student Scholarship Spot' : 'The 1st Step Method';
    }

    if (elDrawerSeatSub) {
      elDrawerSeatSub.textContent = isFree
        ? '100% Free Cohort Access · Co-led live by Jay & Kutloano'
        : '90-Day R5,000/mo Roadmap · Co-led live by Jay & Kutloano';
    }

    if (elPovStatusSeat) {
      elPovStatusSeat.textContent = isFree ? `Free Spot ${rowLetter}${seatNum}` : `Cohort Spot ${rowLetter}${seatNum}`;
    }

    // Metric 1: Monthly Target
    if (elMetricDist) elMetricDist.textContent = 'R5,000';
    if (elMetricDistSub) elMetricDistSub.textContent = 'Predictable student income';

    // Metric 2: Timeline
    if (elMetricFov) elMetricFov.textContent = '90';
    const elFovUnit = document.getElementById('metric-fov-unit');
    if (elFovUnit) elFovUnit.textContent = 'days';
    if (elMetricFovSub) elMetricFovSub.textContent = '1–2 hrs daily around classes';

    if (elBtnBookText) {
      elBtnBookText.textContent = isFree ? 'Claim Free Cohort Spot · R0' : `Reserve Cohort Spot · R${rMeta.price.toLocaleString('en-ZA')}`;
    }
    if (slideCommitController) {
      slideCommitController.updatePrice(rMeta.price);
    }
  }

  function initCohortPillButtons() {
    const pills = document.querySelectorAll('.showtime-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');

        state.currentCohort = pill.dataset.time || pill.textContent.trim();
        state.selectedRow = 'B';
        state.selectedSeat = 3;
        render2DSeatGrid();
        updateSightlineDrawerUI();
        update3DSelectedSeatHighlight();
      });
    });
  }

  // ==========================================================================
  // 6. THREE.JS 3D CINEMA AUDITORIUM & LIVE DESERT FILM CANVAS
  // ==========================================================================
  let cinemaScene, cinemaCamera, cinemaRenderer, cinemaContainer;
  let curvedScreenMesh, cinemaFilmCanvas, cinemaFilmCtx, cinemaFilmTexture;
  let filmParticles = [];
  let travelerProgress = 0;
  let chairsMap = {};
  let selectedSeatGroup = null;
  let screenBounceLight, seatHighlightLight, cinemaRimLight;
  let cinemaCameraTarget = new THREE.Vector3(0, 2.5, -8.5);

  let isCinemaPointerDown = false;
  let cinemaPointerStart = { x: 0, y: 0 };
  let currentCinemaYaw = 0;
  let currentCinemaPitch = 0;
  let targetCinemaYaw = 0;
  let targetCinemaPitch = 0;
  const MAX_YAW = 0.45;
  const MAX_PITCH = 0.25;

  function getSeatCoordinates3D(rowLetter, seatNum) {
    const rowIndex = ROWS.indexOf(rowLetter);
    const zBase = -8.5 + ROW_METRICS[rowLetter].dist;
    
    let yBase = 0;
    if (rowIndex < 7) {
      yBase = rowIndex * 0.38;
    } else {
      yBase = 6 * 0.38 + (rowIndex - 6) * 0.48;
    }

    const sMeta = SEAT_LATERAL_OFFSETS[seatNum - 1];
    const xBase = sMeta ? sMeta.offset * sMeta.sign : 0;

    return { x: xBase, y: yBase, z: zBase, rowIndex: rowIndex };
  }

  function initCinemaThreeJS() {
    cinemaContainer = document.getElementById('webgl-container');
    if (!cinemaContainer) return;
    const width = cinemaContainer.clientWidth || 390;
    const height = cinemaContainer.clientHeight || 750;

    cinemaScene = new THREE.Scene();
    cinemaScene.background = new THREE.Color(0x070505);
    cinemaScene.fog = new THREE.FogExp2(0x090706, 0.038);

    cinemaCamera = new THREE.PerspectiveCamera(66, width / height, 0.1, 80);
    cinemaCamera.position.set(0, 8, 4);
    cinemaCamera.lookAt(0, 2.5, -8.5);

    cinemaRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    cinemaRenderer.setSize(width, height);
    cinemaRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cinemaRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    cinemaRenderer.toneMappingExposure = 1.05;
    cinemaContainer.appendChild(cinemaRenderer.domElement);

    initCinemaFilmCanvas();
    buildCurvedIMAXScreen();
    setupCinemaLighting();
    build108CinemaChairsAndRisers();
    initCinemaFreeLookControls();

    requestAnimationFrame(renderCinemaLoop);
  }

  function initCinemaFilmCanvas() {
    cinemaFilmCanvas = document.createElement('canvas');
    cinemaFilmCanvas.width = 1024;
    cinemaFilmCanvas.height = 485;
    cinemaFilmCtx = cinemaFilmCanvas.getContext('2d');

    filmParticles = [];
    for (let i = 0; i < 48; i++) {
      filmParticles.push({
        x: Math.random() * cinemaFilmCanvas.width,
        y: Math.random() * cinemaFilmCanvas.height,
        vx: (Math.random() - 0.2) * 0.45,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    cinemaFilmTexture = new THREE.CanvasTexture(cinemaFilmCanvas);
    cinemaFilmTexture.generateMipmaps = true;
    cinemaFilmTexture.minFilter = THREE.LinearMipmapLinearFilter;
    cinemaFilmTexture.magFilter = THREE.LinearFilter;
  }

  function updateCinemaDesertFilm(time) {
    if (!cinemaFilmCtx) return;
    const w = cinemaFilmCanvas.width;
    const h = cinemaFilmCanvas.height;

    // Glowing sunset sky
    const skyGrad = cinemaFilmCtx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#1c0803');
    skyGrad.addColorStop(0.35, '#8c280e');
    skyGrad.addColorStop(0.68, '#de6922');
    skyGrad.addColorStop(0.85, '#f5af42');
    skyGrad.addColorStop(1, '#ffdf94');
    cinemaFilmCtx.fillStyle = skyGrad;
    cinemaFilmCtx.fillRect(0, 0, w, h);

    // Sun disc
    const sunX = w * 0.65;
    const sunY = h * 0.48;
    const sunGlow = cinemaFilmCtx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 280);
    sunGlow.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
    sunGlow.addColorStop(0.18, 'rgba(255, 190, 80, 0.65)');
    sunGlow.addColorStop(0.55, 'rgba(230, 80, 20, 0.25)');
    sunGlow.addColorStop(1, 'rgba(230, 80, 20, 0)');
    cinemaFilmCtx.fillStyle = sunGlow;
    cinemaFilmCtx.beginPath();
    cinemaFilmCtx.arc(sunX, sunY, 280, 0, Math.PI * 2);
    cinemaFilmCtx.fill();

    // Cinematic flare
    const flareGrad = cinemaFilmCtx.createLinearGradient(0, sunY, w, sunY);
    flareGrad.addColorStop(0, 'rgba(126, 224, 155, 0)');
    flareGrad.addColorStop(0.5, 'rgba(255, 240, 180, 0.45)');
    flareGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.85)');
    flareGrad.addColorStop(0.8, 'rgba(255, 210, 120, 0.35)');
    flareGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');
    cinemaFilmCtx.fillStyle = flareGrad;
    cinemaFilmCtx.fillRect(0, sunY - 2, w, 4);

    // Dune Layers
    cinemaFilmCtx.fillStyle = '#4a1515';
    cinemaFilmCtx.beginPath();
    cinemaFilmCtx.moveTo(0, h * 0.62);
    cinemaFilmCtx.bezierCurveTo(w * 0.25, h * 0.58, w * 0.5, h * 0.66, w, h * 0.60);
    cinemaFilmCtx.lineTo(w, h);
    cinemaFilmCtx.lineTo(0, h);
    cinemaFilmCtx.closePath();
    cinemaFilmCtx.fill();

    const dune2Grad = cinemaFilmCtx.createLinearGradient(0, h * 0.65, 0, h);
    dune2Grad.addColorStop(0, '#c75316');
    dune2Grad.addColorStop(1, '#2c0c08');
    cinemaFilmCtx.fillStyle = dune2Grad;
    cinemaFilmCtx.beginPath();
    cinemaFilmCtx.moveTo(0, h * 0.76);
    cinemaFilmCtx.bezierCurveTo(w * 0.35, h * 0.62, w * 0.7, h * 0.82, w, h * 0.68);
    cinemaFilmCtx.lineTo(w, h);
    cinemaFilmCtx.lineTo(0, h);
    cinemaFilmCtx.closePath();
    cinemaFilmCtx.fill();

    const ridgePeakY = h * 0.72;
    const dune3Grad = cinemaFilmCtx.createLinearGradient(w * 0.3, ridgePeakY, w * 0.9, h);
    dune3Grad.addColorStop(0, '#e87e28');
    dune3Grad.addColorStop(0.35, '#82240d');
    dune3Grad.addColorStop(1, '#150606');
    cinemaFilmCtx.fillStyle = dune3Grad;
    cinemaFilmCtx.beginPath();
    cinemaFilmCtx.moveTo(0, h * 0.88);
    cinemaFilmCtx.bezierCurveTo(w * 0.3, ridgePeakY, w * 0.6, h * 0.75, w, h * 0.84);
    cinemaFilmCtx.lineTo(w, h);
    cinemaFilmCtx.lineTo(0, h);
    cinemaFilmCtx.closePath();
    cinemaFilmCtx.fill();

    // Lone Cloaked Traveler
    travelerProgress = (travelerProgress + 0.0007) % 1;
    const tX = w * (0.28 + travelerProgress * 0.38);
    const tY = ridgePeakY + Math.sin(travelerProgress * Math.PI) * 12 + 6;
    drawTraveler(cinemaFilmCtx, tX, tY, time);

    // Dust particles
    cinemaFilmCtx.fillStyle = '#ffe9b8';
    filmParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > w) p.x = 0;
      if (p.x < 0) p.x = w;
      if (p.y > h) p.y = 0;
      if (p.y < 0) p.y = h;

      cinemaFilmCtx.globalAlpha = p.alpha;
      cinemaFilmCtx.beginPath();
      cinemaFilmCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      cinemaFilmCtx.fill();
    });
    cinemaFilmCtx.globalAlpha = 1.0;

    // 3D Cinema Curved Screen Countdown to January 10, 2027
    drawCinemaCountdown(cinemaFilmCtx, w, h, time);

    // Course Title Overlay on Stage Screen
    cinemaFilmCtx.font = '700 13px Inter, sans-serif';
    cinemaFilmCtx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    cinemaFilmCtx.fillText('THE 1ST STEP METHOD · COHORT 01 · JAY & KUTLOANO', 38, h - 28);

    if (cinemaFilmTexture) {
      cinemaFilmTexture.needsUpdate = true;
    }

    if (screenBounceLight) {
      screenBounceLight.intensity = 1.8 * (1.0 + Math.sin(time * 0.003) * 0.08);
    }
  }

  // Target timestamp: January 10, 2027 00:00:00
  const COHORT_TARGET_TIMESTAMP = new Date('2027-01-10T00:00:00').getTime();

  function drawCinemaCountdown(ctx, w, h, time) {
    const now = Date.now();
    const diff = Math.max(0, COHORT_TARGET_TIMESTAMP - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const dStr = String(days);
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');

    ctx.save();

    // Responsive dimensions on the 1024x485 IMAX canvas
    const cardW = 670;
    const cardH = 175;
    const cardX = (w - cardW) / 2;
    const cardY = 52;

    // 1. Soft atmospheric glow behind the countdown HUD
    const glowGrad = ctx.createRadialGradient(w / 2, cardY + cardH / 2, 60, w / 2, cardY + cardH / 2, 360);
    glowGrad.addColorStop(0, 'rgba(251, 146, 60, 0.22)');
    glowGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(cardX - 50, cardY - 40, cardW + 100, cardH + 80);

    // 2. Main Glass HUD Backdrop (Obsidian Glass)
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(16, 6, 7, 0.90)');
    cardGrad.addColorStop(1, 'rgba(8, 3, 4, 0.96)');
    ctx.fillStyle = cardGrad;
    drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    // 3. Subtle Glowing Border
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    borderGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
    borderGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.35)');
    borderGrad.addColorStop(1, 'rgba(251, 191, 36, 0.7)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4. Header Bar: Pulsing Live Indicator + Date Tag
    const pulseAlpha = 0.65 + Math.sin(time * 0.005) * 0.35;
    ctx.beginPath();
    ctx.arc(cardX + 28, cardY + 28, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${pulseAlpha})`;
    ctx.fill();

    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.fillText('COHORT 01 COMMENCES · JANUARY 10, 2027', cardX + 42, cardY + 32);

    ctx.font = '600 11.5px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textAlign = 'right';
    ctx.fillText('108 TOTAL SEATS · LIVE ROADMAP', cardX + cardW - 24, cardY + 32);

    // Subtle Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 24, cardY + 46);
    ctx.lineTo(cardX + cardW - 24, cardY + 46);
    ctx.stroke();

    // 5. Four Distinct Unit Counter Cards
    const units = [
      { val: dStr, label: 'DAYS' },
      { val: hStr, label: 'HOURS' },
      { val: mStr, label: 'MINUTES' },
      { val: sStr, label: 'SECONDS' }
    ];

    const blockW = 124;
    const blockH = 80;
    const blockY = cardY + 58;
    const totalBlocksW = 4 * blockW;
    const gap = (cardW - 48 - totalBlocksW) / 3;

    units.forEach((u, i) => {
      const bx = cardX + 24 + i * (blockW + gap);

      // Sub-block glass card
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      drawRoundedRectPath(ctx, bx, blockY, blockW, blockH, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Large Numerals
      ctx.textAlign = 'center';
      ctx.font = '800 36px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(251, 146, 60, 0.85)';
      ctx.shadowBlur = 12;
      ctx.fillText(u.val, bx + blockW / 2, blockY + 48);
      ctx.shadowBlur = 0; // reset

      // Sub-label
      ctx.font = '700 10px Inter, sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText(u.label, bx + blockW / 2, blockY + 68);

      // Colon separator between blocks
      if (i < 3) {
        const colonX = bx + blockW + gap / 2;
        const colonAlpha = 0.45 + Math.sin(time * 0.007) * 0.4;
        ctx.font = '800 24px Inter, sans-serif';
        ctx.fillStyle = `rgba(253, 230, 138, ${colonAlpha})`;
        ctx.fillText(':', colonX, blockY + 45);
      }
    });

    // 6. Bottom Ribbon
    ctx.textAlign = 'center';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(254, 215, 170, 0.85)';
    ctx.fillText('⚡ 3D AUDITORIUM VIEW · SECURE YOUR SPOT BEFORE COUNTDOWN REACHES ZERO', cardX + cardW / 2, cardY + cardH - 12);

    ctx.restore();
  }

  function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawTraveler(ctx, x, y, time) {
    ctx.save();
    ctx.fillStyle = '#0f0504';
    const walkCycle = Math.sin(time * 0.006);
    const capeWave = Math.sin(time * 0.008) * 4;

    ctx.beginPath();
    ctx.arc(x, y - 28, 5, 0, Math.PI * 2);
    ctx.moveTo(x - 5, y - 25);
    ctx.lineTo(x - 14 - capeWave, y - 6);
    ctx.lineTo(x - 8, y);
    ctx.lineTo(x - 3 + walkCycle * 4, y + 8);
    ctx.lineTo(x + 2 - walkCycle * 4, y + 8);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x + 7, y - 24);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0a0303';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 32);
    ctx.lineTo(x + 11, y + 8);
    ctx.stroke();
    ctx.restore();
  }

  function buildCurvedIMAXScreen() {
    const screenWidth = 11.6;
    const screenHeight = 5.5;
    const geom = new THREE.PlaneGeometry(screenWidth, screenHeight, 36, 16);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const normalizedX = x / (screenWidth / 2);
      const zOffset = Math.pow(normalizedX, 2) * 0.92;
      pos.setZ(i, zOffset);
    }
    geom.computeVertexNormals();

    const screenMat = new THREE.MeshStandardMaterial({
      map: cinemaFilmTexture,
      emissiveMap: cinemaFilmTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.94,
      roughness: 0.8,
      metalness: 0.05
    });

    curvedScreenMesh = new THREE.Mesh(geom, screenMat);
    curvedScreenMesh.position.set(0, 2.55, -8.5);
    cinemaScene.add(curvedScreenMesh);

    const bezelMat = new THREE.MeshBasicMaterial({ color: 0x050404 });
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(screenWidth + 0.35, screenHeight + 0.35, 0.15),
      bezelMat
    );
    bezel.position.set(0, 2.55, -8.6);
    cinemaScene.add(bezel);
  }

  function setupCinemaLighting() {
    const ambientLight = new THREE.AmbientLight(0x281916, 0.45);
    cinemaScene.add(ambientLight);

    screenBounceLight = new THREE.PointLight(0xffcda3, 1.8, 22, 1.4);
    screenBounceLight.position.set(0, 3.2, -6.5);
    cinemaScene.add(screenBounceLight);

    cinemaRimLight = new THREE.DirectionalLight(0xffb87a, 0.85);
    cinemaRimLight.position.set(0, 4.0, -8.0);
    cinemaRimLight.target.position.set(0, 1.2, 4.0);
    cinemaScene.add(cinemaRimLight);
    cinemaScene.add(cinemaRimLight.target);

    const overheadLight = new THREE.DirectionalLight(0x40302b, 0.35);
    overheadLight.position.set(0, 12, 0);
    cinemaScene.add(overheadLight);

    seatHighlightLight = new THREE.PointLight(0x7ee09b, 0, 3.5, 2.0);
    seatHighlightLight.position.set(0, 2, 0);
    cinemaScene.add(seatHighlightLight);
  }

  function build108CinemaChairsAndRisers() {
    const standardVelvetMat = new THREE.MeshStandardMaterial({
      color: 0x8c1d19,
      roughness: 0.78,
      metalness: 0.08
    });

    const reclinerVelvetMat = new THREE.MeshStandardMaterial({
      color: 0x9e231e,
      roughness: 0.72,
      metalness: 0.1
    });

    const armrestMat = new THREE.MeshStandardMaterial({
      color: 0x161312,
      roughness: 0.55,
      metalness: 0.15
    });

    const riserFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f0d0c,
      roughness: 0.9,
      metalness: 0.05
    });

    const aisleLightMat = new THREE.MeshBasicMaterial({ color: 0xffd29d });

    const cushionGeom = new THREE.BoxGeometry(0.52, 0.12, 0.48);
    const backrestGeom = new THREE.BoxGeometry(0.50, 0.62, 0.12);
    const headrestGeom = new THREE.BoxGeometry(0.44, 0.22, 0.14);
    const armrestGeom = new THREE.BoxGeometry(0.08, 0.30, 0.44);
    const baseMountGeom = new THREE.BoxGeometry(0.08, 0.34, 0.08);

    ROWS.forEach((rowLetter, rIndex) => {
      const rowCoords = getSeatCoordinates3D(rowLetter, 3);
      const riserDepth = 1.25;
      const riserHeight = rIndex === 0 ? 0.2 : rowCoords.y + 0.2;

      const riserBox = new THREE.Mesh(
        new THREE.BoxGeometry(6.6, riserHeight, riserDepth),
        riserFloorMat
      );
      riserBox.position.set(0, riserHeight / 2 - 0.1, rowCoords.z);
      cinemaScene.add(riserBox);

      [-1.8, 1.8].forEach((aisleX) => {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.05), aisleLightMat);
        strip.position.set(aisleX, riserHeight - 0.08, rowCoords.z - riserDepth / 2 + 0.04);
        cinemaScene.add(strip);
      });
    });

    ROWS.forEach((rowLetter) => {
      const velvetMat = standardVelvetMat;

      for (let s = 1; s <= SEATS_PER_ROW; s++) {
        const coords = getSeatCoordinates3D(rowLetter, s);
        const chairGroup = new THREE.Group();
        chairGroup.position.set(coords.x, coords.y, coords.z);

        if (s <= 1) chairGroup.rotation.y = 0.08;
        else if (s >= 5) chairGroup.rotation.y = -0.08;

        const cushion = new THREE.Mesh(cushionGeom, velvetMat.clone());
        cushion.position.set(0, 0.36, 0.02);
        cushion.rotation.x = -0.08;
        chairGroup.add(cushion);

        const backrest = new THREE.Mesh(backrestGeom, velvetMat.clone());
        backrest.position.set(0, 0.68, 0.22);
        backrest.rotation.x = 0.22;
        chairGroup.add(backrest);

        const headrest = new THREE.Mesh(headrestGeom, velvetMat.clone());
        headrest.position.set(0, 0.98, 0.28);
        headrest.rotation.x = 0.18;
        chairGroup.add(headrest);

        const armL = new THREE.Mesh(armrestGeom, armrestMat);
        armL.position.set(-0.29, 0.44, 0.05);
        chairGroup.add(armL);

        const armR = new THREE.Mesh(armrestGeom, armrestMat);
        armR.position.set(0.29, 0.44, 0.05);
        chairGroup.add(armR);

        const mountL = new THREE.Mesh(baseMountGeom, armrestMat);
        mountL.position.set(-0.2, 0.17, 0.02);
        chairGroup.add(mountL);

        const mountR = new THREE.Mesh(baseMountGeom, armrestMat);
        mountR.position.set(0.2, 0.17, 0.02);
        chairGroup.add(mountR);

        chairGroup.userData = {
          row: rowLetter,
          seat: s,
          cushion: cushion,
          backrest: backrest,
          headrest: headrest,
          baseMat: velvetMat
        };

        cinemaScene.add(chairGroup);
        chairsMap[`${rowLetter}-${s}`] = chairGroup;
      }
    });

    update3DSelectedSeatHighlight();
  }

  let selectedSeatCanvas = null;
  let selectedSeatTexture = null;

  function createSelectedSeatTexture(seatNum) {
    if (!selectedSeatCanvas) {
      selectedSeatCanvas = document.createElement('canvas');
      selectedSeatCanvas.width = 256;
      selectedSeatCanvas.height = 256;
      selectedSeatTexture = new THREE.CanvasTexture(selectedSeatCanvas);
    }

    const isFree = (ROW_METRICS[state.selectedRow] && ROW_METRICS[state.selectedRow].price === 0);
    const ctx = selectedSeatCanvas.getContext('2d');
    ctx.fillStyle = isFree ? '#10b981' : '#7ee09b';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 14;
    ctx.strokeRect(12, 12, 232, 232);

    ctx.fillStyle = isFree ? '#ffffff' : '#06200e';
    ctx.font = isFree ? '700 84px Inter, sans-serif' : '700 120px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.selectedRow}${seatNum}`, 128, isFree ? 105 : 132);

    if (isFree) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px Inter, sans-serif';
      ctx.fillText('FREE', 128, 178);
    }

    selectedSeatTexture.needsUpdate = true;
    return selectedSeatTexture;
  }

  function update3DSelectedSeatHighlight() {
    if (!state.selectedRow || !state.selectedSeat) return;

    if (selectedSeatGroup && selectedSeatGroup.userData) {
      const u = selectedSeatGroup.userData;
      u.cushion.material = u.baseMat.clone();
      u.backrest.material = u.baseMat.clone();
      u.headrest.material = u.baseMat.clone();
    }

    const key = `${state.selectedRow}-${state.selectedSeat}`;
    const newGroup = chairsMap[key];
    if (!newGroup) return;

    selectedSeatGroup = newGroup;
    const u = newGroup.userData;

    const tex = createSelectedSeatTexture(state.selectedSeat);
    u.cushion.material = new THREE.MeshStandardMaterial({
      map: tex,
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.1
    });

    const mintEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x8c1d19,
      emissive: new THREE.Color(0x7ee09b),
      emissiveIntensity: 0.42,
      roughness: 0.72
    });

    u.backrest.material = mintEmissiveMat;
    u.headrest.material = mintEmissiveMat;

    const coords = getSeatCoordinates3D(state.selectedRow, state.selectedSeat);
    if (seatHighlightLight) {
      seatHighlightLight.position.set(coords.x, coords.y + 1.8, coords.z);
      seatHighlightLight.intensity = 1.4;
    }
  }

  // Camera Choreography Engine
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function triggerFlyInTo3D() {
    if (state.transitioning) return;
    state.transitioning = true;
    state.cinemaMode = '3D';

    elScreen2D.classList.add('fly-out-zoom');
    elScreen2D.style.pointerEvents = 'none';
    elScreen2D.style.opacity = '0';
    elScreen3D.classList.add('active');
    elScreen3D.style.opacity = '1';
    elScreen3D.style.pointerEvents = 'auto';
    elScreen3D.style.zIndex = '5';
    elPovDrawer.classList.remove('active-up', 'minimized');
    state.drawerMinimized = false;

    currentCinemaYaw = 0;
    currentCinemaPitch = 0;
    targetCinemaYaw = 0;
    targetCinemaPitch = 0;

    const coords = getSeatCoordinates3D(state.selectedRow, state.selectedSeat);
    const targetFov = 68 - coords.rowIndex * 1.4;

    const startCamPos = new THREE.Vector3(coords.x, coords.y + 7.8, coords.z + 0.12);
    const startLookAt = new THREE.Vector3(coords.x, coords.y, coords.z);
    const endCamPos = new THREE.Vector3(coords.x, coords.y + 0.82, coords.z + 0.12);
    const endLookAt = new THREE.Vector3(0, 2.5, -8.5);

    cinemaCamera.position.copy(startCamPos);
    cinemaCamera.lookAt(startLookAt);
    cinemaCamera.fov = 65;
    cinemaCamera.updateProjectionMatrix();

    const startTime = performance.now();
    const duration = 1550;

    function animateTransition(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.29) {
        cinemaCamera.position.set(coords.x, coords.y + 7.8, coords.z + 0.12);
        cinemaCamera.lookAt(startLookAt);
      } else {
        const tB = (progress - 0.29) / 0.71;
        const easeB = easeInOutCubic(tB);
        cinemaCamera.position.lerpVectors(startCamPos, endCamPos, easeB);
        cinemaCameraTarget.lerpVectors(startLookAt, endLookAt, easeB);
        cinemaCamera.lookAt(cinemaCameraTarget);
        cinemaCamera.fov = THREE.MathUtils.lerp(65, targetFov, easeB);
        cinemaCamera.updateProjectionMatrix();
      }

      if (progress < 1) {
        requestAnimationFrame(animateTransition);
      } else {
        cinemaCamera.position.copy(endCamPos);
        cinemaCameraTarget.copy(endLookAt);
        cinemaCamera.lookAt(cinemaCameraTarget);
        state.transitioning = false;

        setTimeout(() => elPovDrawer.classList.add('active-up'), 120);
        if (elLookHint) {
          elLookHint.classList.remove('hidden');
          setTimeout(() => elLookHint.classList.add('hidden'), 3500);
        }
      }
    }

    requestAnimationFrame(animateTransition);
  }

  function triggerFlyOutTo2D() {
    if (state.transitioning) return;
    state.transitioning = true;
    state.cinemaMode = '2D';

    elPovDrawer.classList.remove('active-up', 'minimized');
    state.drawerMinimized = false;

    const coords = getSeatCoordinates3D(state.selectedRow, state.selectedSeat);
    const startCamPos = cinemaCamera.position.clone();
    const endCamPos = new THREE.Vector3(coords.x, coords.y + 7.8, coords.z + 0.12);
    const startLookAt = cinemaCameraTarget.clone();
    const endLookAt = new THREE.Vector3(coords.x, coords.y, coords.z);

    const startTime = performance.now();
    const duration = 1250;

    function animateFlyOut(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      cinemaCamera.position.lerpVectors(startCamPos, endCamPos, ease);
      cinemaCameraTarget.lerpVectors(startLookAt, endLookAt, ease);
      cinemaCamera.lookAt(cinemaCameraTarget);

      if (progress > 0.45) {
        elScreen2D.classList.remove('fly-out-zoom');
        elScreen2D.style.pointerEvents = 'auto';
        elScreen2D.style.opacity = '1';
      }

      if (progress < 1) {
        requestAnimationFrame(animateFlyOut);
      } else {
        elScreen3D.classList.remove('active');
        elScreen3D.style.opacity = '0';
        elScreen3D.style.pointerEvents = 'none';
        elScreen3D.style.zIndex = '1';
        state.transitioning = false;
        update2DSelectionUI();
      }
    }

    requestAnimationFrame(animateFlyOut);
  }

  function exitTo2DMap() {
    state.cinemaMode = '2D';
    state.transitioning = false;
    if (elScreen3D) {
      elScreen3D.classList.remove('active');
      elScreen3D.style.opacity = '0';
      elScreen3D.style.pointerEvents = 'none';
      elScreen3D.style.zIndex = '1';
    }
    if (elScreen2D) {
      elScreen2D.classList.remove('fly-out-zoom');
      elScreen2D.style.pointerEvents = 'auto';
      elScreen2D.style.opacity = '1';
    }
    if (elPovDrawer) elPovDrawer.classList.remove('active-up', 'minimized');
    state.drawerMinimized = false;
  }

  function smoothRepositionIn3D() {
    if (state.transitioning) return;
    state.transitioning = true;

    const coords = getSeatCoordinates3D(state.selectedRow, state.selectedSeat);
    const targetFov = 68 - coords.rowIndex * 1.4;
    const endCamPos = new THREE.Vector3(coords.x, coords.y + 0.82, coords.z + 0.12);
    const startCamPos = cinemaCamera.position.clone();
    const startFov = cinemaCamera.fov;

    const startTime = performance.now();
    const duration = 950;

    function glide(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      cinemaCamera.position.lerpVectors(startCamPos, endCamPos, ease);
      cinemaCamera.fov = THREE.MathUtils.lerp(startFov, targetFov, ease);
      cinemaCamera.updateProjectionMatrix();

      if (progress < 1) {
        requestAnimationFrame(glide);
      } else {
        cinemaCamera.position.copy(endCamPos);
        state.transitioning = false;
      }
    }

    requestAnimationFrame(glide);
  }

  function initCinemaFreeLookControls() {
    const el = cinemaContainer;
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();
    let pointerDownStart = { x: 0, y: 0 };

    const onStart = (clientX, clientY) => {
      if (state.transitioning || state.cinemaMode !== '3D') return;
      isCinemaPointerDown = true;
      cinemaPointerStart.x = clientX;
      cinemaPointerStart.y = clientY;
      pointerDownStart.x = clientX;
      pointerDownStart.y = clientY;
    };

    const onMove = (clientX, clientY) => {
      if (!isCinemaPointerDown || state.transitioning || state.cinemaMode !== '3D') return;
      const dx = clientX - cinemaPointerStart.x;
      const dy = clientY - cinemaPointerStart.y;
      cinemaPointerStart.x = clientX;
      cinemaPointerStart.y = clientY;

      const sensitivity = 0.0035;
      targetCinemaYaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, targetCinemaYaw - dx * sensitivity));
      targetCinemaPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, targetCinemaPitch + dy * sensitivity));
    };

    const onEnd = (clientX, clientY) => {
      if (!isCinemaPointerDown) return;
      isCinemaPointerDown = false;

      if (typeof clientX === 'number' && typeof clientY === 'number') {
        const dist = Math.hypot(clientX - pointerDownStart.x, clientY - pointerDownStart.y);
        if (dist < 7 && state.cinemaMode === '3D' && !state.transitioning) {
          const rect = el.getBoundingClientRect();
          mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
          mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouseCoord, cinemaCamera);

          const intersects = raycaster.intersectObjects(cinemaScene.children, true);
          for (let hit of intersects) {
            let obj = hit.object;
            while (obj && !obj.userData?.row && obj.parent && obj.parent !== cinemaScene) {
              obj = obj.parent;
            }
            if (obj && obj.userData && obj.userData.row) {
              const r = obj.userData.row;
              const s = obj.userData.seat;
              const takenMap = TAKEN_SEATS[state.currentCohort] || {};
              if (takenMap[r] && takenMap[r].includes(s)) {
                showToast(`Row ${r} · Seat ${s} is already reserved`);
              } else {
                handleSeatSelect(r, s, true);
              }
              break;
            }
          }
        }
      }
    };

    el.addEventListener('pointerdown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('pointerup', (e) => onEnd(e.clientX, e.clientY));
    window.addEventListener('pointercancel', () => { isCinemaPointerDown = false; });

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const touch = e.changedTouches ? e.changedTouches[0] : null;
      if (touch) onEnd(touch.clientX, touch.clientY);
      else onEnd();
    });

    if (elBtnRecenter) {
      elBtnRecenter.addEventListener('click', () => {
        targetCinemaYaw = 0;
        targetCinemaPitch = 0;
      });
    }
  }

  function renderCinemaLoop(time) {
    requestAnimationFrame(renderCinemaLoop);

    if (state.currentView !== 'seats-page') return;

    updateCinemaDesertFilm(time);

    if (state.cinemaMode === '3D' && !state.transitioning) {
      currentCinemaYaw += (targetCinemaYaw - currentCinemaYaw) * 0.12;
      currentCinemaPitch += (targetCinemaPitch - currentCinemaPitch) * 0.12;

      const coords = getSeatCoordinates3D(state.selectedRow, state.selectedSeat);
      const lookDist = 10.0;
      const screenTarget = new THREE.Vector3(
        lookDist * Math.sin(currentCinemaYaw),
        2.55 + lookDist * Math.sin(currentCinemaPitch),
        -8.5
      );

      cinemaCameraTarget.copy(screenTarget);
      cinemaCamera.lookAt(cinemaCameraTarget);
    }

    if (cinemaRenderer && cinemaScene && cinemaCamera) {
      cinemaRenderer.render(cinemaScene, cinemaCamera);
    }
  }

  function onCinemaWindowResize() {
    if (!cinemaRenderer || !cinemaCamera || !cinemaContainer) return;
    const w = cinemaContainer.clientWidth;
    const h = cinemaContainer.clientHeight;
    cinemaCamera.aspect = w / h;
    cinemaCamera.updateProjectionMatrix();
    cinemaRenderer.setSize(w, h);
  }

  // ==========================================================================
  // 7. COMPANION SIDEBAR PRESETS, AMBIENCE & MODALS
  // ==========================================================================
  function initShowcasePresets() {
    const presets = [
      { id: 'preset-b4', row: 'B', seat: 4 },
      { id: 'preset-f8', row: 'F', seat: 8 },
      { id: 'preset-i12', row: 'I', seat: 12 }
    ];

    const scrollToTheater = () => {
      if (viewSeatsPage) {
        viewSeatsPage.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    presets.forEach((p) => {
      const btn = document.getElementById(p.id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        handleSeatSelect(p.row, p.seat, true);
        if (state.cinemaMode === '2D') triggerFlyInTo3D();
        scrollToTheater();
      });
    });

    const btnScrollToTheater = document.getElementById('btn-scroll-to-theater');
    if (btnScrollToTheater) {
      btnScrollToTheater.addEventListener('click', scrollToTheater);
    }
  }

  function updateSidebarPresetActive() {
    const presets = [
      { id: 'preset-b4', row: 'B', seat: 4 },
      { id: 'preset-f8', row: 'F', seat: 8 },
      { id: 'preset-i12', row: 'I', seat: 12 }
    ];

    presets.forEach((p) => {
      const btn = document.getElementById(p.id);
      if (!btn) return;
      btn.classList.toggle('active', state.selectedRow === p.row && state.selectedSeat === p.seat);
    });
  }

  let audioCtx = null;
  let subOsc = null;
  let noiseNode = null;
  let masterGain = null;

  function toggleCinemaAmbience() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      subOsc = audioCtx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(42, audioCtx.currentTime);

      const subFilter = audioCtx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(90, audioCtx.currentTime);

      const subGain = audioCtx.createGain();
      subGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start();

      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const windFilter = audioCtx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(260, audioCtx.currentTime);
      windFilter.Q.setValueAtTime(3.0, audioCtx.currentTime);

      const windGain = audioCtx.createGain();
      windGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

      noiseNode.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      noiseNode.start();
    }

    if (audioCtx.state === 'suspended') audioCtx.resume();
    state.audioPlaying = !state.audioPlaying;

    if (state.audioPlaying) {
      masterGain.gain.setTargetAtTime(0.45, audioCtx.currentTime, 0.4);
      if (elAmbientAudioBtn) {
        elAmbientAudioBtn.classList.add('active');
        elAmbientAudioBtn.querySelector('.audio-btn-label').textContent = 'Hall Ambience (On)';
      }
    } else {
      masterGain.gain.setTargetAtTime(0.001, audioCtx.currentTime, 0.3);
      if (elAmbientAudioBtn) {
        elAmbientAudioBtn.classList.remove('active');
        elAmbientAudioBtn.querySelector('.audio-btn-label').textContent = 'Hall Ambience (Off)';
      }
    }
  }

  // ==========================================================================
  // 6B. SLIDE COMMIT COMPONENT (THEATRE CHECKOUT BUTTON)
  // ==========================================================================
  let slideCommitController = null;

  function initSlideCommit(onConfirmCallback) {
    const container = document.getElementById('slide-commit-container');
    const track = document.getElementById('slide-commit-track');
    const capsule = document.getElementById('slide-commit-capsule');
    const content = document.getElementById('slide-commit-content');
    const label = document.getElementById('slide-commit-label');
    const arrow = document.getElementById('slide-commit-arrow');
    const spin = document.getElementById('slide-commit-spin');
    const done = document.getElementById('slide-commit-done');
    const plainText = document.getElementById('slide-commit-text-plain');
    const doneText = document.getElementById('slide-commit-done-text');
    const sr = document.getElementById('slide-commit-sr');
    if (!container || !track || !capsule || !content) return;

    const PAD = 4;
    const SQUASH_MAX = 0.08;
    const SQUASH_DIV = 110;
    const SWELL = 1.03;
    const MIN_PENDING = 320;
    const HOLD_MS = 1600;

    let phase = 'idle';
    let isHeld = false;
    let isHot = false;
    let currentX = 0;
    let anchorX = 0;
    let grabOffset = null;
    let activePointerId = null;
    let animFrame = null;
    let timer = null;

    const getMetrics = () => {
      const rect = track.getBoundingClientRect();
      const width = rect.width || 320;
      const height = rect.height || 54;
      const GRIP = height - PAD * 2;
      const INNER = Math.max(1, width - PAD * 2);
      const TRAVEL = Math.max(1, INNER - GRIP);
      const radius = height / 2;
      const gripR = Math.max(0, radius - PAD);
      return { width, height, GRIP, INNER, TRAVEL, radius, gripR };
    };

    function clamp(val, min, max) {
      return Math.min(max, Math.max(min, val));
    }

    function updateVisuals(xVal, forceEdge = null) {
      const { GRIP, INNER, TRAVEL, gripR } = getMetrics();
      const seen = clamp(xVal, 0, TRAVEL);
      const edge = forceEdge !== null ? forceEdge : (seen + GRIP + clamp(anchorX - seen, 0, TRAVEL));
      
      // Capsule clip path
      const rightInset = Math.max(0, INNER - edge);
      capsule.style.clipPath = `inset(0 ${rightInset}px 0 0 round ${gripR}px)`;
      
      // Center content in the visible grip
      const centerPos = (seen + edge) / 2 - INNER / 2;
      content.style.transform = `translateX(${centerPos}px)`;

      // Label opacity fades out as grip moves
      const say = clamp(1 - (seen / (TRAVEL * 0.55)), 0, 1);
      if (label) label.style.opacity = say;

      // Arrow opacity
      const arrowOp = clamp(1 - (seen - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1);
      if (arrow) arrow.style.opacity = phase === 'idle' ? arrowOp : 0;

      // Squash and swell scale
      const swell = (isHot && !isHeld && phase === 'idle') ? SWELL : 1;
      const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -xVal) / SQUASH_DIV);
      capsule.style.transform = `scale(${q * swell}, ${swell / q})`;
      capsule.style.transformOrigin = `${seen}px 50%`;

      // Update ARIA
      const percent = Math.round((seen / TRAVEL) * 100);
      capsule.setAttribute('aria-valuenow', percent);
      const labelStr = plainText ? plainText.textContent : 'Slide to reserve';
      capsule.setAttribute('aria-valuetext', `${labelStr}, ${percent}%`);
    }

    function setPhase(newPhase) {
      phase = newPhase;
      container.dataset.phase = newPhase;
      if (newPhase === 'pending') {
        if (sr) sr.textContent = 'Processing reservation...';
        if (arrow) arrow.style.opacity = 0;
        if (spin) spin.style.opacity = 1;
      } else if (newPhase === 'done') {
        if (sr) sr.textContent = doneText ? doneText.textContent : 'Reserved';
        if (spin) spin.style.opacity = 0;
        if (arrow) arrow.style.opacity = 0;
        if (done) {
          done.style.opacity = 1;
          done.style.transform = 'scale(1)';
        }
      } else if (newPhase === 'idle') {
        if (sr) sr.textContent = '';
        if (spin) spin.style.opacity = 0;
        if (done) {
          done.style.opacity = 0;
          done.style.transform = 'scale(0.95)';
        }
        if (arrow) arrow.style.opacity = 1;
      }
    }

    function goHome() {
      if (animFrame) cancelAnimationFrame(animFrame);
      let startX = currentX;
      let startTime = performance.now();
      const duration = 240;

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        currentX = startX * (1 - ease);
        anchorX = 0;
        updateVisuals(currentX);

        if (progress < 1) {
          animFrame = requestAnimationFrame(step);
        } else {
          currentX = 0;
          anchorX = 0;
          updateVisuals(0);
          animFrame = null;
        }
      }
      animFrame = requestAnimationFrame(step);
    }

    function commit() {
      const { INNER, TRAVEL } = getMetrics();
      clearTimeout(timer);
      currentX = TRAVEL;
      anchorX = TRAVEL;
      updateVisuals(TRAVEL);
      setPhase('pending');

      setTimeout(() => {
        setPhase('done');
        anchorX = TRAVEL;

        // Animate currentX to 0 so the pill smoothly stretches to full width and centers content
        const startX = currentX;
        const startTime = performance.now();
        const duration = 280;

        function springToZero(now) {
          const t = Math.min(1, (now - startTime) / duration);
          const ease = 1 - Math.pow(1 - t, 3);
          currentX = startX * (1 - ease);
          updateVisuals(currentX);
          if (t < 1) {
            requestAnimationFrame(springToZero);
          } else {
            currentX = 0;
            updateVisuals(0);
          }
        }
        requestAnimationFrame(springToZero);

        // Landing dip pulse animation
        track.style.transform = 'scale(0.97)';
        setTimeout(() => { track.style.transform = 'scale(1)'; }, 180);

        // Call the checkout confirm callback
        if (typeof onConfirmCallback === 'function') {
          onConfirmCallback();
        }

        timer = setTimeout(() => {
          settle();
        }, HOLD_MS);
      }, MIN_PENDING);
    }

    function settle() {
      setPhase('idle');
      const startAnchor = anchorX;
      const startTime = performance.now();
      const duration = 240;

      function collapseAnchor(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        anchorX = startAnchor * (1 - ease);
        updateVisuals(0);
        if (t < 1) {
          requestAnimationFrame(collapseAnchor);
        } else {
          anchorX = 0;
          currentX = 0;
          updateVisuals(0);
        }
      }
      requestAnimationFrame(collapseAnchor);
    }

    track.addEventListener('pointerdown', (e) => {
      if (phase === 'pending' || phase === 'done' || e.button !== 0) return;
      if (animFrame) cancelAnimationFrame(animFrame);
      activePointerId = e.pointerId;
      isHeld = true;
      container.setAttribute('data-held', '');
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {}

      const rect = track.getBoundingClientRect();
      const at = e.clientX - rect.left - PAD;
      grabOffset = at - currentX;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isHeld || e.pointerId !== activePointerId) return;
      const { TRAVEL } = getMetrics();
      const rect = track.getBoundingClientRect();
      const at = e.clientX - rect.left - PAD;
      if (grabOffset === null) grabOffset = at - currentX;

      const nextX = clamp(at - grabOffset, -15, TRAVEL + 10);
      currentX = nextX;
      updateVisuals(currentX);
    });

    const onPointerRelease = (e) => {
      if (!isHeld || (e && e.pointerId !== activePointerId)) return;
      isHeld = false;
      activePointerId = null;
      grabOffset = null;
      container.removeAttribute('data-held');
      try {
        track.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const { TRAVEL } = getMetrics();
      if (currentX >= TRAVEL * 0.9) {
        commit();
      } else {
        goHome();
      }
    };

    window.addEventListener('pointerup', onPointerRelease);
    window.addEventListener('pointercancel', onPointerRelease);

    capsule.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') {
        isHot = true;
        updateVisuals(currentX);
      }
    });
    capsule.addEventListener('pointerleave', () => {
      isHot = false;
      updateVisuals(currentX);
    });

    capsule.addEventListener('keydown', (e) => {
      if (phase === 'pending' || phase === 'done') return;
      const { TRAVEL } = getMetrics();
      const step = TRAVEL / 10;

      if (e.key === 'End') {
        e.preventDefault();
        commit();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        currentX = Math.min(TRAVEL, currentX + step);
        updateVisuals(currentX);
        if (currentX >= TRAVEL) commit();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        currentX = Math.max(0, currentX - step);
        updateVisuals(currentX);
      } else if (e.key === 'Home' || e.key === 'Escape') {
        e.preventDefault();
        goHome();
      }
    });

    updateVisuals(0);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (phase === 'idle') updateVisuals(currentX);
        else if (phase === 'done') {
          const { INNER, TRAVEL } = getMetrics();
          updateVisuals(TRAVEL, INNER);
        }
      });
      ro.observe(track);
    }

    window.addEventListener('resize', () => {
      if (phase === 'idle') updateVisuals(0);
      else if (phase === 'done') {
        const { INNER, TRAVEL } = getMetrics();
        updateVisuals(TRAVEL, INNER);
      }
    });

    slideCommitController = {
      updatePrice(price) {
        const isFree = price === 0;
        const formatted = isFree ? 'FREE (R0)' : `R${price.toLocaleString('en-ZA')}`;
        const labelStr = isFree ? 'Slide to Claim Free Spot · R0' : `Slide to Reserve Spot · ${formatted}`;
        const doneStr = isFree ? 'Claimed Free Spot · R0' : `Reserved · ${formatted}`;
        if (plainText) plainText.textContent = labelStr;
        if (doneText) doneText.textContent = doneStr;
        capsule.setAttribute('aria-label', labelStr);
        if (phase === 'idle') updateVisuals(0);
      },
      reset() {
        settle();
      }
    };
  }

  // ==========================================================================
  // PAYSTACK PAYMENT & SEAT RESERVATION INTEGRATION
  // ==========================================================================
  const PAYSTACK_DEFAULT_KEY = 'pk_test_cb912809e5b2e67df1bbbe04085f1c97034cf5e2';

  function getPaystackPublicKey() {
    if (typeof window !== 'undefined' && window.PAYSTACK_PUBLIC_KEY) {
      return window.PAYSTACK_PUBLIC_KEY;
    }
    try {
      const saved = localStorage.getItem('paystack_public_key');
      if (saved && saved.startsWith('pk_')) return saved;
    } catch (e) {}
    return PAYSTACK_DEFAULT_KEY;
  }

  function openCheckoutModal() {
    if (!state.selectedRow || !state.selectedSeat) return;

    const rowLetter = state.selectedRow;
    const seatNum = state.selectedSeat;
    const rMeta = ROW_METRICS[rowLetter] || { price: 499, type: 'Cohort 01 Pass' };
    const isFree = (rMeta.price === 0);

    if (elCheckoutSummarySpot) {
      elCheckoutSummarySpot.textContent = isFree ? `Spot ${rowLetter}${seatNum} (Free Student Spot)` : `Spot ${rowLetter}${seatNum}`;
    }
    if (elCheckoutSummaryPrice) {
      elCheckoutSummaryPrice.textContent = isFree ? 'FREE (R0)' : `R${rMeta.price.toLocaleString('en-ZA')}`;
    }
    if (elCheckoutTierBadge) {
      elCheckoutTierBadge.textContent = isFree ? 'FREE SCHOLARSHIP ENROLLMENT' : 'COHORT 01 ENROLLMENT';
    }
    if (elCheckoutModalTitle) {
      elCheckoutModalTitle.textContent = isFree ? 'Claim Your Free Scholarship Seat' : 'Secure Your Seat';
    }
    if (elCheckoutBtnText) {
      elCheckoutBtnText.textContent = isFree ? 'Claim Free Student Seat · R0' : `Pay R${rMeta.price} with Paystack`;
    }
    if (elTrustGuaranteeText) {
      elTrustGuaranteeText.textContent = isFree 
        ? '100% Free Varsity Scholarship · Zero tuition or hidden fees' 
        : 'Secured via 256-bit SSL Paystack payment gateway';
    }
    if (elPaystackTrustBadge) {
      elPaystackTrustBadge.style.display = isFree ? 'none' : 'flex';
    }

    // Pre-fill stored student info if available
    try {
      const savedName = localStorage.getItem('fsm_student_name');
      const savedEmail = localStorage.getItem('fsm_student_email');
      const savedPhone = localStorage.getItem('fsm_student_phone');
      const savedAge = localStorage.getItem('fsm_student_age');
      if (savedName && elStudentName && !elStudentName.value) elStudentName.value = savedName;
      if (savedEmail && elStudentEmail && !elStudentEmail.value) elStudentEmail.value = savedEmail;
      if (savedPhone && elStudentPhone && !elStudentPhone.value) elStudentPhone.value = savedPhone;
      if (savedAge && elStudentAge && !elStudentAge.value) elStudentAge.value = savedAge;
    } catch (e) {}

    // Clear validation states
    document.querySelectorAll('.checkout-field-group').forEach((grp) => grp.classList.remove('has-error'));
    if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');

    if (elCheckoutModal) {
      elCheckoutModal.classList.add('open');
      setTimeout(() => {
        if (elStudentName && !elStudentName.value) elStudentName.focus();
        else if (elStudentEmail && !elStudentEmail.value) elStudentEmail.focus();
      }, 150);
    }
  }

  function closeCheckoutModal() {
    if (elCheckoutModal) elCheckoutModal.classList.remove('open');
    if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');
  }

  async function safeParseResponse(response, defaultMsg) {
    let rawText = '';
    try {
      rawText = await response.text();
    } catch (e) {
      throw new Error(defaultMsg || 'Unable to read server response');
    }

    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('[SafeParseResponse Non-JSON]', response.status, rawText.slice(0, 300));
      if (response.status >= 500) {
        throw new Error('Our payment server is currently updating. Please wait a few seconds and try again.');
      }
      throw new Error(defaultMsg || `Server responded with status ${response.status}. Please check your connection.`);
    }
  }

  function handleCheckoutSubmit(e) {
    if (e) e.preventDefault();

    const nameVal = elStudentName ? elStudentName.value.trim() : '';
    const emailVal = elStudentEmail ? elStudentEmail.value.trim() : '';
    const phoneVal = elStudentPhone ? elStudentPhone.value.trim() : '';
    const ageVal = elStudentAge ? elStudentAge.value.trim() : '';

    const nameGroup = elStudentName ? elStudentName.closest('.checkout-field-group') : null;
    const emailGroup = elStudentEmail ? elStudentEmail.closest('.checkout-field-group') : null;
    const phoneGroup = elStudentPhone ? elStudentPhone.closest('.checkout-field-group') : null;
    const ageGroup = elStudentAge ? elStudentAge.closest('.checkout-field-group') : null;
    const ageErrorEl = document.getElementById('age-error');

    let hasError = false;

    if (!nameVal) {
      if (nameGroup) nameGroup.classList.add('has-error');
      hasError = true;
    } else if (nameGroup) {
      nameGroup.classList.remove('has-error');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      if (emailGroup) emailGroup.classList.add('has-error');
      hasError = true;
    } else if (emailGroup) {
      emailGroup.classList.remove('has-error');
    }

    const phoneClean = phoneVal.replace(/[\s\-\(\)\+]/g, '');
    if (!phoneVal || phoneClean.length < 9) {
      if (phoneGroup) phoneGroup.classList.add('has-error');
      hasError = true;
    } else if (phoneGroup) {
      phoneGroup.classList.remove('has-error');
    }

    const ageNum = parseInt(ageVal, 10);
    if (!ageVal || isNaN(ageNum)) {
      if (ageErrorEl) ageErrorEl.textContent = 'Please enter your age';
      if (ageGroup) ageGroup.classList.add('has-error');
      hasError = true;
    } else if (ageNum < 18) {
      if (ageErrorEl) ageErrorEl.textContent = 'You must be 18 or older to reserve a seat. Anyone under 18 is not allowed.';
      if (ageGroup) ageGroup.classList.add('has-error');
      hasError = true;
    } else if (ageNum > 120) {
      if (ageErrorEl) ageErrorEl.textContent = 'Please enter a valid age';
      if (ageGroup) ageGroup.classList.add('has-error');
      hasError = true;
    } else if (ageGroup) {
      ageGroup.classList.remove('has-error');
    }

    if (hasError) return;

    // Save student details
    try {
      localStorage.setItem('fsm_student_name', nameVal);
      localStorage.setItem('fsm_student_email', emailVal);
      if (phoneVal) localStorage.setItem('fsm_student_phone', phoneVal);
      if (ageVal) localStorage.setItem('fsm_student_age', ageVal);
    } catch (err) {}

    const rowLetter = state.selectedRow;
    const seatNum = state.selectedSeat;
    const rMeta = ROW_METRICS[rowLetter] || { price: 499 };
    const isFree = (rMeta.price === 0);

    if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.add('loading');
    if (elCheckoutBtnText) elCheckoutBtnText.textContent = isFree ? 'Securing Spot...' : 'Connecting to Paystack...';

    // 1. Free Seat flow: Claim immediately
    if (isFree) {
      setTimeout(() => {
        completeReservation({
          studentName: nameVal,
          studentEmail: emailVal,
          studentPhone: phoneVal,
          studentAge: ageNum,
          row: rowLetter,
          seat: seatNum,
          price: 0,
          reference: `FSM-FREE-${rowLetter}${seatNum}-${Date.now().toString(36).toUpperCase()}`,
          status: 'FREE SCHOLARSHIP PASS'
        });
      }, 500);
      return;
    }

    // 2. Standard Paid Seat flow (R499 via Backend Initialize -> PaystackPop.checkout -> Backend Verify)
    (async () => {
      try {
        // Step 1: Call backend initialize route to get data.access_code
        const initResponse = await fetch('/api/paystack/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: emailVal,
            amount: rMeta.price, // sends price in Rands; server computes priceInRands * 100
            studentName: nameVal,
            studentPhone: phoneVal,
            studentAge: ageNum,
            row: rowLetter,
            seat: seatNum,
            cohort: state.currentCohort
          })
        });

        const initResult = await safeParseResponse(initResponse, 'Payment initialization failed');

        if (!initResult.status || !initResult.data || !initResult.data.access_code) {
          throw new Error(initResult.message || 'Payment initialization failed');
        }

        const accessCode = initResult.data.access_code;
        const fallbackRef = initResult.data.reference || `FSM-COHORT1-${rowLetter}${seatNum}-${Date.now().toString(36).toUpperCase()}`;

        // Step 2: Handle checkout via @paystack/inline-js PaystackPop
        // If simulation access_code is returned (when PAYSTACK_SECRET_KEY is in dev mode)
        if (accessCode.startsWith('sim_acc_')) {
          if (elCheckoutBtnText) elCheckoutBtnText.textContent = 'Processing Dev Simulation...';
          setTimeout(async () => {
            // Call backend verify route
            const verifyRes = await fetch(`/api/paystack/verify/${encodeURIComponent(fallbackRef)}`);
            const verifyData = await safeParseResponse(verifyRes, 'Verification failed');
            if (verifyData.status) {
              completeReservation({
                studentName: nameVal,
                studentEmail: emailVal,
                studentPhone: phoneVal,
                studentAge: ageNum,
                row: rowLetter,
                seat: seatNum,
                price: rMeta.price,
                reference: fallbackRef,
                status: 'PAID · PAYSTACK VERIFIED'
              });
            } else {
              throw new Error(verifyData.message || 'Verification failed');
            }
          }, 1100);
          return;
        }

        // Standard @paystack/inline-js flow
        if (typeof PaystackPop !== 'undefined') {
          const popup = new PaystackPop();
          popup.checkout({
            accessCode: accessCode,
            onSuccess: async (transaction) => {
              const txRef = (transaction && (transaction.reference || transaction.trxref)) || fallbackRef;
              if (elCheckoutBtnText) elCheckoutBtnText.textContent = 'Verifying with Paystack...';

              try {
                // Step 3: Inside onSuccess, send transaction.reference to verify route before confirmation
                const verifyResponse = await fetch(`/api/paystack/verify/${encodeURIComponent(txRef)}`);
                const verifyResult = await safeParseResponse(verifyResponse, 'Payment verification failed');

                if (verifyResult.status && (!verifyResult.data || verifyResult.data.status === 'success')) {
                  completeReservation({
                    studentName: nameVal,
                    studentEmail: emailVal,
                    studentPhone: phoneVal,
                    studentAge: ageNum,
                    row: rowLetter,
                    seat: seatNum,
                    price: rMeta.price,
                    reference: txRef,
                    status: 'PAID · PAYSTACK VERIFIED'
                  });
                } else {
                  throw new Error(verifyResult.message || 'Payment verification failed');
                }
              } catch (verifyErr) {
                console.error('Payment verification failed:', verifyErr);
                showToast('Payment verification failed: ' + (verifyErr.message || 'Unknown error'), false);
                if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');
                if (elCheckoutBtnText) elCheckoutBtnText.textContent = `Pay R${rMeta.price} with Paystack`;
              }
            },
            onCancel: () => {
              if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');
              if (elCheckoutBtnText) elCheckoutBtnText.textContent = `Pay R${rMeta.price} with Paystack`;
              showToast('Payment window closed. Spot is on hold—complete payment to reserve.');
            }
          });
        } else {
          throw new Error('Paystack inline SDK not loaded');
        }
      } catch (err) {
        console.warn('Paystack flow error:', err);
        showToast(err.message || 'Payment connection error', false);
        if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');
        if (elCheckoutBtnText) elCheckoutBtnText.textContent = `Pay R${rMeta.price} with Paystack`;
      }
    })();
  }

  function completeReservation(bookingData) {
    const { studentName, row, seat, price, reference, status } = bookingData;
    const isFree = (price === 0);

    // 1. Mark seat as taken in TAKEN_SEATS
    ['Cohort 01', 'Cohort 1'].forEach((cohortKey) => {
      if (!TAKEN_SEATS[cohortKey]) {
        TAKEN_SEATS[cohortKey] = { A: [], B: [], C: [], D: [], E: [] };
      }
      if (!TAKEN_SEATS[cohortKey][row]) {
        TAKEN_SEATS[cohortKey][row] = [];
      }
      if (!TAKEN_SEATS[cohortKey][row].includes(seat)) {
        TAKEN_SEATS[cohortKey][row].push(seat);
      }
    });

    // 2. Persist reservation to database (Supabase via /api/reservations) and localStorage
    fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        studentEmail: bookingData.studentEmail || '',
        studentPhone: bookingData.studentPhone || '',
        row,
        seat,
        price,
        reference,
        status,
        cohort: state.currentCohort
      })
    }).then(res => safeParseResponse(res, 'Database sync notice')).then(data => {
      console.log('[Supabase Reservation Synced]:', data);
    }).catch(err => {
      console.warn('[Supabase Sync Notice]:', err.message);
    });

    try {
      const reservations = JSON.parse(localStorage.getItem('fsm_confirmed_reservations_v2') || '[]');
      reservations.push({
        ...bookingData,
        cohort: state.currentCohort,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('fsm_confirmed_reservations_v2', JSON.stringify(reservations));
    } catch (e) {}

    // 3. Reset submit button & close checkout modal
    if (elBtnPaystackSubmit) elBtnPaystackSubmit.classList.remove('loading');
    if (elCheckoutBtnText) elCheckoutBtnText.textContent = isFree ? 'Claim Free Student Seat · R0' : `Pay R${price} with Paystack`;
    if (elCheckoutModal) elCheckoutModal.classList.remove('open');

    // 4. Update 2D grid and 3D scene
    render2DSeatGrid();
    renderMiniRadar();
    update3DSelectedSeatHighlight();

    // 5. Populate and open confirmed Ticket Modal
    const elTStudentName = document.getElementById('t-student-name');
    if (elTStudentName) elTStudentName.textContent = studentName;

    if (elTShowtime) elTShowtime.textContent = `${state.currentCohort}`;
    if (elTSeat) elTSeat.textContent = `Cohort 01 · Spot ${row}${seat}${isFree ? ' (Free Student Spot)' : ''}`;
    if (elTZone) elTZone.textContent = isFree ? 'FREE SCHOLARSHIP COHORT PASS' : 'STANDARD COHORT PASS';
    if (elTPrice) {
      elTPrice.textContent = isFree ? 'CLAIMED · FREE (R0)' : `PAID · R${price}`;
      elTPrice.style.color = '#10b981';
    }

    const elTMetrics = document.getElementById('t-metrics');
    if (elTMetrics) {
      elTMetrics.textContent = reference;
    }

    const elTBarcodeNum = document.getElementById('t-barcode-num');
    if (elTBarcodeNum) {
      elTBarcodeNum.textContent = reference;
    }

    if (elTicketModal) elTicketModal.classList.add('open');

    // 6. Celebratory success toast
    const firstName = studentName.split(' ')[0] || studentName;
    const toastMsg = isFree
      ? `🎉 Free scholarship secured! Welcome to Cohort 01, ${firstName}!`
      : `🎉 Payment verified! Spot ${row}${seat} secured for ${firstName}!`;
    showToast(toastMsg, true);
  }

  function restoreSavedReservations() {
    try {
      // Clear legacy pre-reset reservations from local storage once
      if (localStorage.getItem('fsm_spots_reset_all_nov23') !== 'true') {
        localStorage.removeItem('fsm_confirmed_reservations');
        localStorage.removeItem('fsm_confirmed_reservations_v2');
        localStorage.setItem('fsm_spots_reset_all_nov23', 'true');
      }

      const saved = JSON.parse(localStorage.getItem('fsm_confirmed_reservations_v2') || '[]');
      if (Array.isArray(saved)) {
        saved.forEach((b) => {
          if (b.row && b.seat) {
            ['Cohort 01', 'Cohort 1'].forEach((ck) => {
              if (TAKEN_SEATS[ck] && TAKEN_SEATS[ck][b.row]) {
                if (!TAKEN_SEATS[ck][b.row].includes(b.seat)) {
                  TAKEN_SEATS[ck][b.row].push(b.seat);
                }
              }
            });
          }
        });
      }
    } catch (e) {}
  }

  async function syncServerReservations() {
    try {
      const res = await fetch('/api/reservations');
      const data = await safeParseResponse(res, 'Could not sync reservations');
      if (data && data.status && Array.isArray(data.reservations)) {
        let changed = false;
        data.reservations.forEach((r) => {
          if (r.row && r.seat) {
            const row = r.row;
            const seat = Number(r.seat);
            ['Cohort 01', 'Cohort 1'].forEach((ck) => {
              if (TAKEN_SEATS[ck] && TAKEN_SEATS[ck][row]) {
                if (!TAKEN_SEATS[ck][row].includes(seat)) {
                  TAKEN_SEATS[ck][row].push(seat);
                  changed = true;
                }
              }
            });
          }
        });
        if (changed) {
          render2DSeatGrid();
          renderMiniRadar();
          update3DSelectedSeatHighlight();
        }
      }
    } catch (err) {
      // Offline or network error
    }
  }

  function initModals() {
    const openSpecs = () => elSpecsModal.classList.add('open');
    const closeSpecs = () => elSpecsModal.classList.remove('open');

    if (elBtnInfo) elBtnInfo.addEventListener('click', openSpecs);
    if (elSpecsTriggerSidebar) elSpecsTriggerSidebar.addEventListener('click', openSpecs);
    if (elBtnCloseSpecs) elBtnCloseSpecs.addEventListener('click', closeSpecs);
    if (elBtnDoneSpecs) elBtnDoneSpecs.addEventListener('click', closeSpecs);

    const closeTicket = () => elTicketModal.classList.remove('open');

    // SlideCommit triggers Paystack Checkout Modal
    initSlideCommit(openCheckoutModal);
    if (elBtnBook) elBtnBook.addEventListener('click', openCheckoutModal);

    if (elBtnCloseCheckout) elBtnCloseCheckout.addEventListener('click', closeCheckoutModal);
    if (elCheckoutForm) elCheckoutForm.addEventListener('submit', handleCheckoutSubmit);

    if (elBtnConfirmTicket) elBtnConfirmTicket.addEventListener('click', closeTicket);

    [elSpecsModal, elTicketModal, elCheckoutModal].forEach((modal) => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elCheckoutModal && elCheckoutModal.classList.contains('open')) closeCheckoutModal();
        if (elTicketModal && elTicketModal.classList.contains('open')) closeTicket();
        if (elSpecsModal && elSpecsModal.classList.contains('open')) closeSpecs();
      }
    });
  }

  function initDrawerToggle() {
    if (!elDrawerHandle || !elPovDrawer) return;
    elDrawerHandle.addEventListener('click', () => {
      state.drawerMinimized = !state.drawerMinimized;
      elPovDrawer.classList.toggle('minimized', state.drawerMinimized);
    });
  }

  function initContactForm() {
    const elContactForm = document.getElementById('contact-form');
    const elContactName = document.getElementById('contact-name');
    const elContactEmail = document.getElementById('contact-email');
    const elContactMessage = document.getElementById('contact-message');
    const elContactBtn = document.getElementById('btn-contact-submit');
    const elContactBtnText = document.getElementById('contact-btn-text');
    const elContactStatus = document.getElementById('contact-status-msg');

    if (!elContactForm) return;

    elContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = elContactName ? elContactName.value.trim() : '';
      const email = elContactEmail ? elContactEmail.value.trim() : '';
      const message = elContactMessage ? elContactMessage.value.trim() : '';

      if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address', false);
        if (elContactEmail) elContactEmail.focus();
        return;
      }

      if (!message) {
        showToast('Please type your question or message', false);
        if (elContactMessage) elContactMessage.focus();
        return;
      }

      if (elContactBtn) elContactBtn.disabled = true;
      if (elContactBtnText) elContactBtnText.textContent = 'Sending Message...';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await safeParseResponse(response, 'Failed to send message');
        if (data.status) {
          elContactForm.reset();
          showToast('Message sent! Jay & Kutloano will reply within 24 hours.', true);
          if (elContactStatus) {
            elContactStatus.textContent = 'Message sent! We will reply to your email within 24 hours.';
            elContactStatus.style.display = 'block';
            elContactStatus.style.color = '#10b981';
          }
        } else {
          throw new Error(data.message || 'Failed to deliver message');
        }
      } catch (err) {
        console.error('[Contact Form Error]:', err);
        showToast(err.message || 'Error delivering message. Please try again.', false);
        if (elContactStatus) {
          elContactStatus.textContent = err.message || 'Failed to send. Please try again.';
          elContactStatus.style.display = 'block';
          elContactStatus.style.color = '#ef4444';
        }
      } finally {
        if (elContactBtn) elContactBtn.disabled = false;
        if (elContactBtnText) elContactBtnText.textContent = 'Send Question to Mentors →';
      }
    });
  }

  // ==========================================================================
  // 8. MASTER INITIALIZATION
  // ==========================================================================
  function init() {
    initTheme();
    initPageRouting();
    initPlanetThreeJS();
    initScrubberDial();
    initFAQAccordion();
    initComparisonSlider();
    initContactForm();

    restoreSavedReservations();
    syncServerReservations();
    render2DSeatGrid();
    initCohortPillButtons();
    initCinemaThreeJS();
    initDrawerToggle();
    initShowcasePresets();
    initModals();

    if (elBtnContinue) {
      elBtnContinue.addEventListener('click', triggerFlyInTo3D);
    }
    const bottomBar = document.getElementById('bottom-sticky-bar');
    if (bottomBar) {
      bottomBar.addEventListener('click', (e) => {
        if (!e.target.closest('#btn-continue') && state.selectedRow && state.selectedSeat) {
          triggerFlyInTo3D();
        }
      });
    }

    if (elBtnChangeSeat) elBtnChangeSeat.addEventListener('click', triggerFlyOutTo2D);
    if (elBtnBack3D) elBtnBack3D.addEventListener('click', triggerFlyOutTo2D);
    if (elAmbientAudioBtn) elAmbientAudioBtn.addEventListener('click', toggleCinemaAmbience);

    window.addEventListener('resize', () => {
      onCinemaWindowResize();
      if (planetRenderer && planetCamera && elPlanetCanvasWrap) {
        const pw = elPlanetCanvasWrap.clientWidth;
        const ph = elPlanetCanvasWrap.clientHeight;
        planetCamera.aspect = pw / ph;
        planetCamera.updateProjectionMatrix();
        planetRenderer.setSize(pw, ph);
      }
    });

    updateSightlineDrawerUI();
    updateSidebarPresetActive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
