// widget.js

async function loadMatch(container, matchId, eventId = null) {
  const storageKey = `match_${matchId}`;
  const league = container.getAttribute('data-league') || 'eng.1';

  container.innerHTML = '<div class="loading">Loading match data...</div>';

  try {
    console.log(`Fetching match data for ID: ${matchId} in league: ${league}`);

    // Fetch match by ID
    let res = await fetch(`https://api.totalsportslive.co.zw?league=${league}&id=${matchId}`);
    let data = await res.json();

    // Find match
    let match = data.events?.find(e => String(e.id) === String(matchId));

    // If not found, fetch league events
    if (!match) {
      console.log('Match not found by ID, fetching league events...');
      res = await fetch(`https://love-weld-nine.vercel.app/api/espn?league=${league}`);
      data = await res.json();
      match = data.events?.find(e => String(e.id) === String(matchId));
    }

    if (!match) {
      console.log('No match found, trying storage fallback');
      return loadFromStorage();
    }

    // Store in localStorage
    localStorage.setItem(storageKey, JSON.stringify(match));

    // If eventId is provided, filter match events
    if (eventId && match.competitions?.[0]?.details?.events?.length) {
      match.competitions[0].details.events = match.competitions[0].details.events.filter(ev => String(ev.id) === String(eventId));
    }

    displayMatch(match);
  } catch (err) {
    console.error('Error loading match:', err);
    loadFromStorage("❌ Failed to load match data - API Error");
  }

  function loadFromStorage(fallbackMsg = 'No match found') {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      displayMatch(data, true);
    } else {
      container.innerHTML = fallbackMsg;
    }
  }

  function displayMatch(match, fromStorage = false) {
    const comp = match.competitions?.[0];
    if (!comp) return container.innerHTML = 'Invalid match data';

    const home = comp.competitors?.find(c => c.homeAway === "home");
    const away = comp.competitors?.find(c => c.homeAway === "away");

    const homeName = home?.team?.name || "Home";
    const awayName = away?.team?.name || "Away";

    const kickoff = match.date
      ? new Date(match.date).toLocaleString("en-GB", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" })
      : "TBD";

    const isLive = match.status?.type?.state === "in";
    const isComplete = match.status?.type?.state === "post";
    const clock = match.status?.displayClock || match.status?.clock || "";

    const liveButton = isLive
      ? '<span class="live-btn live">🔴 LIVE</span>'
      : isComplete
      ? '<span class="live-btn final">✅ FULL TIME</span>'
      : '<span class="live-btn scheduled">⏰ SCHEDULED</span>';

    // Forms
    const formatForm = form => form?.split("").map(f => `<span class="form-letter ${f==="W"?"win":f==="D"?"draw":"loss"}">${f}</span>`).join("") || "N/A";
    const homeForm = formatForm(home?.form);
    const awayForm = formatForm(away?.form);

    // Stats
    const statsHtml = generateStatsHtml(home?.statistics || [], away?.statistics || []);

    // Events
    const events = comp.details?.events || [];
    const eventsHtml = events.length ? events.map(ev => `<div class="event-item"><span class="event-time">${ev.clock || "FT"}</span>${ev.text || ev.description || "Event"}</div>`).join("") : "<p>No match events</p>";

    container.innerHTML = `
      <div class="match-widget">
        <div class="header">
          <h2>⚽ ${homeName} vs ${awayName}</h2>
          <div class="league-info">${match.season?.year || ""} ${match.season?.slug?.replace(/-/g," ") || ""}</div>
          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached)</p>' : ""}
        </div>
        <div class="teams-section">
          <div class="logos-row">
            <img src="${home?.team?.logo || 'https://via.placeholder.com/75'}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${isLive || isComplete ? `<div class="score-row"><span class="score">${home?.score || 0}</span> - <span class="score">${away?.score || 0}</span></div>` : ""}
            </div>
            <img src="${away?.team?.logo || 'https://via.placeholder.com/75'}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row"><div class="team-name">${homeName}</div><div class="vs-spacer"></div><div class="team-name">${awayName}</div></div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p>📅 ${kickoff}</p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card"><h3>📊 Live Statistics</h3>${statsHtml}<div class="stat-item"><span>Home Form:</span> ${homeForm}</div><div class="stat-item"><span>Away Form:</span> ${awayForm}</div></div>
          <div class="info-card"><h3>⚽ Match Events</h3><div class="events-list">${eventsHtml}</div></div>
        </div>
      </div>
    `;
  }

  function generateStatsHtml(homeStats, awayStats) {
    const statsMap = {};
    homeStats.forEach(h => {
      const key = h.name;
      statsMap[key] = { home: h.displayValue || h.value || "-", away: "-" };
    });
    awayStats.forEach(a => {
      if (!statsMap[a.name]) statsMap[a.name] = { home: "-", away: a.displayValue || a.value || "-" };
      else statsMap[a.name].away = a.displayValue || a.value || "-";
    });
    return Object.entries(statsMap).map(([k,v]) => `<div class="stat-item"><span>${k}</span> <span>${v.home} - ${v.away}</span></div>`).join("");
  }
}

// Auto-init + recursive refresh
document.querySelectorAll(".match-widget-container").forEach(container => {
  const matchId = container.getAttribute("data-match-id");
  const eventId = container.getAttribute("data-event-id") || null; // Optional
  (async function refresh() {
    await loadMatch(container, matchId, eventId);
    setTimeout(refresh, 30000);
  })();
});
