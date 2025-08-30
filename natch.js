// widget.js

async function loadMatch(container, matchId, eventId = null) {
  const storageKey = `match_${matchId}`;
  const league = container.getAttribute('data-league') || 'eng.1';

  container.innerHTML = '<div class="loading">Loading match data...</div>';

  try {
    console.log(`Fetching match data for ID: ${matchId} in league: ${league}`);

    // Fetch match by ID
    let res = await fetch(`https://love-weld-nine.vercel.app/api/espn?league=${league}&id=${matchId}`);
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
});    ).join("") || "";

    // Venue and other info
    const venue = gameInfo.venue?.fullName || "TBD";
    const venueCapacity = gameInfo.venue?.capacity || "Unknown";
    const attendance = gameInfo.attendance || "TBD";
    const kickoff = gameInfo.date ? new Date(gameInfo.date).toLocaleString("en-GB", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "short"
    }) : "TBD";

    container.innerHTML = `
      <div class="match-widget">
        <div class="header">
          <h2>⚽ ${homeName} vs ${awayName}</h2>
          <div class="league-info">Premier League 2024-25</div>
          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
        </div>
        
        <div class="adsense">
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous"></script>
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-2485970459707316"
               data-ad-slot="2737166010"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>

        <div class="teams-section">
          <div class="logos-row">
            <img src="${homeLogo}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${isLive || isComplete ? 
                `<div class="score-row">
                  <span class="score">${homeScore}</span>
                  <span class="score-separator"> - </span>
                  <span class="score">${awayScore}</span>
                </div>` : ""
              }
            </div>
            <img src="${awayLogo}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Recent Form</h3>
            <div class="stat-item">
              <span class="stat-label">${homeName} Form</span>
              <span class="stat-value">${homeFormDisplay || "N/A"}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">${awayName} Form</span>
              <span class="stat-value">${awayFormDisplay || "N/A"}</span>
            </div>
            ${homeTeam.statistics ? homeTeam.statistics.slice(0, 5).map(stat =>
              `<div class="stat-item">
                <span class="stat-label">${stat.label}</span>
                <span class="stat-value">${stat.displayValue}</span>
              </div>`
            ).join("") : "<p>No statistics available</p>"}
          </div>
          
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">-</div></div>
            </div>
          </div>
          
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">
              <p>Match events will appear here during live matches</p>
            </div>
          </div>
          
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item">
              <span class="stat-label">Competition</span>
              <span class="stat-value">Premier League</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Venue Capacity</span>
              <span class="stat-value">${venueCapacity}</span>
            </div>
          </div>
        </div>

        <div class="adsense">
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous"></script>
          <ins class="adsbygoogle"
               style="display:block; text-align:center;"
               data-ad-layout="in-article"
               data-ad-format="fluid"
               data-ad-client="ca-pub-2485970459707316"
               data-ad-slot="3657034432"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>
      </div>
    `;
  }

  function displayMatch(match, fromStorage = false) {
    console.log('displayMatch called with:', match);
    const comp = match.competitions?.[0];
    if (!comp) {
      console.error('No competition data found in match:', match);
      container.innerHTML = 'Invalid match data structure';
      return;
    }
    const home = comp.competitors?.find(c => c.homeAway === "home");
    const away = comp.competitors?.find(c => c.homeAway === "away");

    const homeName = home?.team?.name || "Home";
    const awayName = away?.team?.name || "Away";

    const kickoff = new Date(match.date).toLocaleString("en-GB", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "short"
    });

    const isLive = match.status?.type?.state === "in";
    const isComplete = match.status?.type?.state === "post";
    const clock = match.status?.displayClock || match.status?.clock || "";

    const liveButton = isLive
      ? '<span class="live-btn live">🔴 LIVE</span>'
      : isComplete
      ? '<span class="live-btn final">✅ FULL TIME</span>'
      : '<span class="live-btn scheduled">⏰ SCHEDULED</span>';

    const homeForm =
      home?.form
        ?.split("")
        .map(
          f =>
            `<span class="form-letter ${
              f === "W" ? "win" : f === "D" ? "draw" : "loss"
            }">${f}</span>`
        )
        .join("") || "";

    const awayForm =
      away?.form
        ?.split("")
        .map(
          f =>
            `<span class="form-letter ${
              f === "W" ? "win" : f === "D" ? "draw" : "loss"
            }">${f}</span>`
        )
        .join("") || "";

    const homeStats = home?.statistics || [];
    const awayStats = away?.statistics || [];
    const statsMap = {};

    homeStats.forEach(h => {
      const key = h.name;
      const homeVal = h.displayValue || h.value || "-";
      const awayObj = awayStats.find(a => a.name === key);
      const awayVal = awayObj?.displayValue || awayObj?.value || "-";
      statsMap[key] = { home: homeVal, away: awayVal };
    });

    awayStats.forEach(a => {
      if (!statsMap[a.name]) {
        const homeObj = homeStats.find(h => h.name === a.name);
        const homeVal = homeObj?.displayValue || homeObj?.value || "-";
        const awayVal = a.displayValue || a.value || "-";
        statsMap[a.name] = { home: homeVal, away: awayVal };
      }
    });

    let statsHtml = "";
    Object.entries(statsMap).forEach(([key, val]) => {
      statsHtml += `<div class="stat-item"><span class="stat-label">${key}</span><span class="stat-value">${val.home} - ${val.away}</span></div>`;
    });

    const moneyline = comp.odds?.find(o => o.moneyline)?.moneyline || {};
    const overUnder = comp.odds?.find(o => o.overUnder)?.overUnder || {};
    const attendance = comp.attendance || "TBD";
    const venue = comp.venue?.fullName || "TBD";
    const venueCapacity = comp.venue?.capacity || "Unknown";
    const weather = comp.weather || {};
    const broadcast =
      comp.broadcasts?.map(b => b.names?.join(", "))?.join(" | ") || "TBD";
    const tickets =
      comp.tickets
        ?.map(
          t =>
            `<a href="${t.links?.[0]?.href || "#"}" target="_blank">${t.summary}</a>`
        )
        .join(" | ") || "Check official website";
    const season =
      match.season?.year +
        " " +
        (match.season?.slug?.replace(/-/g, " ") || "Season") || "";
    const events = comp.details?.events || [];
    const eventsHtml = events.length
      ? events
          .map(
            ev =>
              `<div class="event-item"><span class="event-time">${ev.clock ||
                "FT"}</span><span>${ev.text ||
                ev.description ||
                "Event"}</span></div>`
          )
          .join("")
      : "<p>No match events available</p>";

    container.innerHTML = `
      <div class="match-widget">
        <div class="header">
          <h2>⚽ ${homeName} vs ${awayName}</h2>
          <div class="league-info">${season}</div>
          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<!-- Advertisement -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="2737166010"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
        <div class="teams-section">
          <div class="logos-row">
            <img src="${home?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${
                isLive || isComplete
                  ? `<div class="score-row"><span class="score">${home?.score ||
                      "0"}</span><span class="score-separator"> - </span><span class="score">${away?.score ||
                      "0"}</span></div>`
                  : ""
              }
            </div>
            <img src="${away?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance.toLocaleString ? attendance.toLocaleString() : attendance}</p>
            <p><strong>📺 ${broadcast}</strong></p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Live Statistics</h3>
            ${statsHtml || "<p>No live stats available</p>"}
            <div class="stat-item"><span class="stat-label">Home Form</span><span class="stat-value">${homeForm}</span></div>
            <div class="stat-item"><span class="stat-label">Away Form</span><span class="stat-value">${awayForm}</span></div>
            <div class="stat-item"><span class="stat-label">Home Record</span><span class="stat-value">${home?.records?.[0]?.summary || "N/A"}</span></div>
            <div class="stat-item"><span class="stat-label">Away Record</span><span class="stat-value">${away?.records?.[0]?.summary || "N/A"}</span></div>
          </div>
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">${moneyline.home?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">${moneyline.draw?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">${moneyline.away?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">${overUnder.over?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">${overUnder.under?.close?.odds || "-"}</div></div>
            </div>
          </div>
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">${eventsHtml}</div>
          </div>
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item"><span class="stat-label">Tickets</span><span class="stat-value">${tickets}</span></div>
            <div class="stat-item"><span class="stat-label">Weather</span><span class="stat-value">${weather.temperature || "N/A"}${weather.condition ? ` - ${weather.condition}` : ""}</span></div>
            <div class="stat-item"><span class="stat-label">Referee</span><span class="stat-value">${comp.officials?.[0]?.displayName || "TBD"}</span></div>
            <div class="stat-item"><span class="stat-label">Competition</span><span class="stat-value">${match.season?.slug?.replace(/-/g, " ") || "League"}</span></div>
          </div>
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="3657034432"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
      </div>
    `;
  }
}

// Auto-init for all containers
document.querySelectorAll(".match-widget-container").forEach(container => {
  const matchId = container.getAttribute("data-match-id");
  loadMatch(container, matchId);
  setInterval(() => loadMatch(container, matchId), 30000);
});
              ${isLive || isComplete ? 
                `<div class="score-row">
                  <span class="score">${homeScore}</span>
                  <span class="score-separator"> - </span>
                  <span class="score">${awayScore}</span>
                </div>` : ""
              }
            </div>
            <img src="${awayLogo}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Recent Form</h3>
            <div class="stat-item">
              <span class="stat-label">${homeName} Form</span>
              <span class="stat-value">${homeFormDisplay || "N/A"}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">${awayName} Form</span>
              <span class="stat-value">${awayFormDisplay || "N/A"}</span>
            </div>
            ${homeTeam.statistics ? homeTeam.statistics.slice(0, 5).map(stat =>
              `<div class="stat-item">
                <span class="stat-label">${stat.label}</span>
                <span class="stat-value">${stat.displayValue}</span>
              </div>`
            ).join("") : "<p>No statistics available</p>"}
          </div>
          
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">-</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">-</div></div>
            </div>
          </div>
          
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">
              <p>Match events will appear here during live matches</p>
            </div>
          </div>
          
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item">
              <span class="stat-label">Competition</span>
              <span class="stat-value">Premier League</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Venue Capacity</span>
              <span class="stat-value">${venueCapacity}</span>
            </div>
          </div>
        </div>

        <div class="adsense">
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous"></script>
          <ins class="adsbygoogle"
               style="display:block; text-align:center;"
               data-ad-layout="in-article"
               data-ad-format="fluid"
               data-ad-client="ca-pub-2485970459707316"
               data-ad-slot="3657034432"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>
      </div>
    `;
  }

  function displayMatch(match, fromStorage = false) {
    const comp = match.competitions[0];
    const home = comp.competitors?.find(c => c.homeAway === "home");
    const away = comp.competitors?.find(c => c.homeAway === "away");

    const homeName = home?.team?.name || "Home";
    const awayName = away?.team?.name || "Away";

    const kickoff = new Date(match.date).toLocaleString("en-GB", {
      timeZone: "Europe/Paris",
      dateStyle: "short",
      timeStyle: "short"
    });

    const isLive = match.status?.type?.state === "in";
    const isComplete = match.status?.type?.state === "post";
    const clock = match.status?.displayClock || match.status?.clock || "";

    const liveButton = isLive
      ? '<span class="live-btn live">🔴 LIVE</span>'
      : isComplete
      ? '<span class="live-btn final">✅ FULL TIME</span>'
      : '<span class="live-btn scheduled">⏰ SCHEDULED</span>';

    const homeForm =
      home?.form
        ?.split("")
        .map(
          f =>
            `<span class="form-letter ${
              f === "W" ? "win" : f === "D" ? "draw" : "loss"
            }">${f}</span>`
        )
        .join("") || "";

    const awayForm =
      away?.form
        ?.split("")
        .map(
          f =>
            `<span class="form-letter ${
              f === "W" ? "win" : f === "D" ? "draw" : "loss"
            }">${f}</span>`
        )
        .join("") || "";

    const homeStats = home?.statistics || [];
    const awayStats = away?.statistics || [];
    const statsMap = {};

    homeStats.forEach(h => {
      const key = h.name;
      const homeVal = h.displayValue || h.value || "-";
      const awayObj = awayStats.find(a => a.name === key);
      const awayVal = awayObj?.displayValue || awayObj?.value || "-";
      statsMap[key] = { home: homeVal, away: awayVal };
    });

    awayStats.forEach(a => {
      if (!statsMap[a.name]) {
        const homeObj = homeStats.find(h => h.name === a.name);
        const homeVal = homeObj?.displayValue || homeObj?.value || "-";
        const awayVal = a.displayValue || a.value || "-";
        statsMap[a.name] = { home: homeVal, away: awayVal };
      }
    });

    let statsHtml = "";
    Object.entries(statsMap).forEach(([key, val]) => {
      statsHtml += `<div class="stat-item"><span class="stat-label">${key}</span><span class="stat-value">${val.home} - ${val.away}</span></div>`;
    });

    const moneyline = comp.odds?.find(o => o.moneyline)?.moneyline || {};
    const overUnder = comp.odds?.find(o => o.overUnder)?.overUnder || {};
    const attendance = comp.attendance || "TBD";
    const venue = comp.venue?.fullName || "TBD";
    const venueCapacity = comp.venue?.capacity || "Unknown";
    const weather = comp.weather || {};
    const broadcast =
      comp.broadcasts?.map(b => b.names?.join(", "))?.join(" | ") || "TBD";
    const tickets =
      comp.tickets
        ?.map(
          t =>
            `<a href="${t.links?.[0]?.href || "#"}" target="_blank">${t.summary}</a>`
        )
        .join(" | ") || "Check official website";
    const season =
      match.season?.year +
        " " +
        (match.season?.slug?.replace(/-/g, " ") || "Season") || "";
    const events = comp.details?.events || [];
    const eventsHtml = events.length
      ? events
          .map(
            ev =>
              `<div class="event-item"><span class="event-time">${ev.clock ||
                "FT"}</span><span>${ev.text ||
                ev.description ||
                "Event"}</span></div>`
          )
          .join("")
      : "<p>No match events available</p>";

    container.innerHTML = `
      <div class="match-widget">
        <div class="header">
          <h2>⚽ ${homeName} vs ${awayName}</h2>
          <div class="league-info">${season}</div>
          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<!-- Advertisement -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="2737166010"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
        <div class="teams-section">
          <div class="logos-row">
            <img src="${home?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${
                isLive || isComplete
                  ? `<div class="score-row"><span class="score">${home?.score ||
                      "0"}</span><span class="score-separator"> - </span><span class="score">${away?.score ||
                      "0"}</span></div>`
                  : ""
              }
            </div>
            <img src="${away?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance.toLocaleString ? attendance.toLocaleString() : attendance}</p>
            <p><strong>📺 ${broadcast}</strong></p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Live Statistics</h3>
            ${statsHtml || "<p>No live stats available</p>"}
            <div class="stat-item"><span class="stat-label">Home Form</span><span class="stat-value">${homeForm}</span></div>
            <div class="stat-item"><span class="stat-label">Away Form</span><span class="stat-value">${awayForm}</span></div>
            <div class="stat-item"><span class="stat-label">Home Record</span><span class="stat-value">${home?.records?.[0]?.summary || "N/A"}</span></div>
            <div class="stat-item"><span class="stat-label">Away Record</span><span class="stat-value">${away?.records?.[0]?.summary || "N/A"}</span></div>
          </div>
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">${moneyline.home?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">${moneyline.draw?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">${moneyline.away?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">${overUnder.over?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">${overUnder.under?.close?.odds || "-"}</div></div>
            </div>
          </div>
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">${eventsHtml}</div>
          </div>
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item"><span class="stat-label">Tickets</span><span class="stat-value">${tickets}</span></div>
            <div class="stat-item"><span class="stat-label">Weather</span><span class="stat-value">${weather.temperature || "N/A"}${weather.condition ? ` - ${weather.condition}` : ""}</span></div>
            <div class="stat-item"><span class="stat-label">Referee</span><span class="stat-value">${comp.officials?.[0]?.displayName || "TBD"}</span></div>
            <div class="stat-item"><span class="stat-label">Competition</span><span class="stat-value">${match.season?.slug?.replace(/-/g, " ") || "League"}</span></div>
          </div>
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="3657034432"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
      </div>
    `;
  }
}

// Auto-init for all containers
document.querySelectorAll(".match-widget-container").forEach(container => {
  const matchId = container.getAttribute("data-match-id");
  loadMatch(container, matchId);
  setInterval(() => loadMatch(container, matchId), 30000);
});          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<!-- Advertisement -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="2737166010"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
        <div class="teams-section">
          <div class="logos-row">
            <img src="${home?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${
                isLive || isComplete
                  ? `<div class="score-row"><span class="score">${home?.score ||
                      "0"}</span><span class="score-separator"> - </span><span class="score">${away?.score ||
                      "0"}</span></div>`
                  : ""
              }
            </div>
            <img src="${away?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance.toLocaleString ? attendance.toLocaleString() : attendance}</p>
            <p><strong>📺 ${broadcast}</strong></p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Live Statistics</h3>
            ${statsHtml || "<p>No live stats available</p>"}
            <div class="stat-item"><span class="stat-label">Home Form</span><span class="stat-value">${homeForm}</span></div>
            <div class="stat-item"><span class="stat-label">Away Form</span><span class="stat-value">${awayForm}</span></div>
            <div class="stat-item"><span class="stat-label">Home Record</span><span class="stat-value">${home?.records?.[0]?.summary || "N/A"}</span></div>
            <div class="stat-item"><span class="stat-label">Away Record</span><span class="stat-value">${away?.records?.[0]?.summary || "N/A"}</span></div>
          </div>
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">${moneyline.home?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">${moneyline.draw?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">${moneyline.away?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">${overUnder.over?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">${overUnder.under?.close?.odds || "-"}</div></div>
            </div>
          </div>
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">${eventsHtml}</div>
          </div>
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item"><span class="stat-label">Tickets</span><span class="stat-value">${tickets}</span></div>
            <div class="stat-item"><span class="stat-label">Weather</span><span class="stat-value">${weather.temperature || "N/A"}${weather.condition ? ` - ${weather.condition}` : ""}</span></div>
            <div class="stat-item"><span class="stat-label">Referee</span><span class="stat-value">${comp.officials?.[0]?.displayName || "TBD"}</span></div>
            <div class="stat-item"><span class="stat-label">Competition</span><span class="stat-value">${match.season?.slug?.replace(/-/g, " ") || "League"}</span></div>
          </div>
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="3657034432"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
      </div>
    `;
  }
}

// Auto-init for all containers
document.querySelectorAll(".match-widget-container").forEach(container => {
  const matchId = container.getAttribute("data-match-id");
  loadMatch(container, matchId);
  setInterval(() => loadMatch(container, matchId), 30000);
});
        const key = h.name;
        const homeVal = h.displayValue || h.value || "-";
        const awayObj = awayStats.find(a => a.name === key);
        const awayVal = awayObj?.displayValue || awayObj?.value || "-";
        statsMap[key] = { home: homeVal, away: awayVal };
      });

      awayStats.forEach(a => {
        if (!statsMap[a.name]) {
          const homeObj = homeStats.find(h => h.name === a.name);
          const homeVal = homeObj?.displayValue || homeObj?.value || "-";
          const awayVal = a.displayValue || a.value || "-";
          statsMap[a.name] = { home: homeVal, away: awayVal };
        }
      });

      let statsHtml = "";
      Object.entries(statsMap).forEach(([key, val]) => {
        statsHtml += `<div class="stat-item"><span class="stat-label">${key}</span><span class="stat-value">${val.home} - ${val.away}</span></div>`;
      });

      const moneyline = comp.odds?.find(o => o.moneyline)?.moneyline || {};
      const overUnder = comp.odds?.find(o => o.overUnder)?.overUnder || {};
      const attendance = comp.attendance || "TBD";
      const venue = comp.venue?.fullName || "TBD";
      const venueCapacity = comp.venue?.capacity || "Unknown";
      const weather = comp.weather || {};
      const broadcast =
        comp.broadcasts?.map(b => b.names?.join(", "))?.join(" | ") || "TBD";
      const tickets =
        comp.tickets
          ?.map(
            t =>
              `<a href="${t.links?.[0]?.href || "#"}" target="_blank">${t.summary}</a>`
          )
          .join(" | ") || "Check official website";
      const season =
        match.season?.year +
          " " +
          (match.season?.slug?.replace(/-/g, " ") || "Season") || "";
      const events = comp.details?.events || [];
      const eventsHtml = events.length
        ? events
            .map(
              ev =>
                `<div class="event-item"><span class="event-time">${ev.clock ||
                  "FT"}</span><span>${ev.text ||
                  ev.description ||
                  "Event"}</span></div>`
            )
            .join("")
        : "<p>No match events available</p>";

      const container = document.querySelector(".match-widget-container, .football-widget");

      // NOTE: if you render into the specific container that called loadMatch,
      // replace the querySelector above with the element reference you already have.

      container.innerHTML = `
        <div class="match-widget">
          <div class="header">
            <h2>⚽ ${homeName} vs ${awayName}</h2>
            <div class="league-info">${season}</div>
            ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
          </div>
          <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-2485970459707316"
       data-ad-slot="2737166010"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>
       (adsbygoogle = window.adsbygoogle || []).push({});
  </script></p></div>
          <div class="teams-section">
            <div class="logos-row">
              <img src="${home?.team?.logo || "https://via.placeholder.com/75"}" alt="${homeName}" class="team-logo">
              <div class="vs-text">
                ${isLive || isComplete ? "FINAL" : "VS"}
                ${
                  isLive || isComplete
                    ? `<div class="score-row"><span class="score">${home?.score || "0"}</span><span class="score-separator"> - </span><span class="score">${away?.score || "0"}</span></div>`
                    : ""
                }
              </div>
              <img src="${away?.team?.logo || "https://via.placeholder.com/75"}" alt="${awayName}" class="team-logo">
            </div>
            <div class="names-row">
              <div class="team-name">${homeName}</div>
              <div class="vs-spacer"></div>
              <div class="team-name">${awayName}</div>
            </div>
            <div class="live-info">
              ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
              <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
              <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
              <p><strong>👥 Attendance:</strong> ${attendance.toLocaleString ? attendance.toLocaleString() : attendance}</p>
              <p><strong>📺 ${broadcast}</strong></p>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-card">
              <h3>📊 Live Statistics</h3>
              ${statsHtml || "<p>No live stats available</p>"}
              <div class="stat-item"><span class="stat-label">Home Form</span><span class="stat-value">${homeForm}</span></div>
              <div class="stat-item"><span class="stat-label">Away Form</span><span class="stat-value">${awayForm}</span></div>
              <div class="stat-item"><span class="stat-label">Home Record</span><span class="stat-value">${home?.records?.[0]?.summary || "N/A"}</span></div>
              <div class="stat-item"><span class="stat-label">Away Record</span><span class="stat-value">${away?.records?.[0]?.summary || "N/A"}</span></div>
            </div>
            <div class="info-card">
              <h3>💰 Betting Odds</h3>
              <div class="odds-grid">
                <div class="odds-card"><h4>Home Win</h4><div class="odds-value">${overUnder ? (moneyline.home?.close?.odds || "-") : "-"}</div></div>
                <div class="odds-card"><h4>Draw</h4><div class="odds-value">${overUnder ? (moneyline.draw?.close?.odds || "-") : "-"}</div></div>
                <div class="odds-card"><h4>Away Win</h4><div class="odds-value">${overUnder ? (moneyline.away?.close?.odds || "-") : "-"}</div></div>
                <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">${overUnder?.over?.close?.odds || "-"}</div></div>
                <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">${overUnder?.under?.close?.odds || "-"}</div></div>
              </div>
            </div>
            <div class="info-card">
              <h3>⚽ Match Events</h3>
              <div class="events-list">${eventsHtml}</div>
            </div>
            <div class="info-card">
              <h3>🎫 Match Information</h3>
              <div class="stat-item"><span class="stat-label">Tickets</span><span class="stat-value">${tickets}</span></div>
              <div class="stat-item"><span class="stat-label">Weather</span><span class="stat-value">${weather.temperature || "N/A"}${weather.condition ? ` - ${weather.condition}` : ""}</span></div>
              <div class="stat-item"><span class="stat-label">Referee</span><span class="stat-value">${comp.officials?.[0]?.displayName || "TBD"}</span></div>
              <div class="stat-item"><span class="stat-label">Competition</span><span class="stat-value">${match.season?.slug?.replace(/-/g, " ") || "League"}</span></div>
            </div>
          </div>
          <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-layout="in-article"
       data-ad-format="fluid"
       data-ad-client="ca-pub-2485970459707316"
       data-ad-slot="3657034432"></ins>
  <script>
       (adsbygoogle = window.adsbygoogle || []).push({});
  </script></p></div>
        </div>
      `;
    }
  }
})();          <div class="league-info">${season}</div>
          ${fromStorage ? '<p style="color:orange;font-size:12px">(cached data)</p>' : ""}
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<!-- Advertisement -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="2737166010"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
        <div class="teams-section">
          <div class="logos-row">
            <img src="${home?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${homeName}" class="team-logo">
            <div class="vs-text">
              ${isLive || isComplete ? "FINAL" : "VS"}
              ${
                isLive || isComplete
                  ? `<div class="score-row"><span class="score">${home?.score ||
                      "0"}</span><span class="score-separator"> - </span><span class="score">${away?.score ||
                      "0"}</span></div>`
                  : ""
              }
            </div>
            <img src="${away?.team?.logo ||
              "https://via.placeholder.com/75"}" alt="${awayName}" class="team-logo">
          </div>
          <div class="names-row">
            <div class="team-name">${homeName}</div>
            <div class="vs-spacer"></div>
            <div class="team-name">${awayName}</div>
          </div>
          <div class="live-info">
            ${!isLive && !isComplete ? `<p><strong>📅 ${kickoff}</strong></p>` : ""}
            <p>${liveButton} ${clock ? `- ${clock}` : ""}</p>
            <p><strong>🏟️ ${venue}</strong>${venueCapacity !== "Unknown" ? ` (${venueCapacity})` : ""}</p>
            <p><strong>👥 Attendance:</strong> ${attendance.toLocaleString ? attendance.toLocaleString() : attendance}</p>
            <p><strong>📺 ${broadcast}</strong></p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>📊 Live Statistics</h3>
            ${statsHtml || "<p>No live stats available</p>"}
            <div class="stat-item"><span class="stat-label">Home Form</span><span class="stat-value">${homeForm}</span></div>
            <div class="stat-item"><span class="stat-label">Away Form</span><span class="stat-value">${awayForm}</span></div>
            <div class="stat-item"><span class="stat-label">Home Record</span><span class="stat-value">${home?.records?.[0]?.summary || "N/A"}</span></div>
            <div class="stat-item"><span class="stat-label">Away Record</span><span class="stat-value">${away?.records?.[0]?.summary || "N/A"}</span></div>
          </div>
          <div class="info-card">
            <h3>💰 Betting Odds</h3>
            <div class="odds-grid">
              <div class="odds-card"><h4>Home Win</h4><div class="odds-value">${moneyline.home?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Draw</h4><div class="odds-value">${moneyline.draw?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Away Win</h4><div class="odds-value">${moneyline.away?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Over 2.5</h4><div class="odds-value">${overUnder.over?.close?.odds || "-"}</div></div>
              <div class="odds-card"><h4>Under 2.5</h4><div class="odds-value">${overUnder.under?.close?.odds || "-"}</div></div>
            </div>
          </div>
          <div class="info-card">
            <h3>⚽ Match Events</h3>
            <div class="events-list">${eventsHtml}</div>
          </div>
          <div class="info-card">
            <h3>🎫 Match Information</h3>
            <div class="stat-item"><span class="stat-label">Tickets</span><span class="stat-value">${tickets}</span></div>
            <div class="stat-item"><span class="stat-label">Weather</span><span class="stat-value">${weather.temperature || "N/A"}${weather.condition ? ` - ${weather.condition}` : ""}</span></div>
            <div class="stat-item"><span class="stat-label">Referee</span><span class="stat-value">${comp.officials?.[0]?.displayName || "TBD"}</span></div>
            <div class="stat-item"><span class="stat-label">Competition</span><span class="stat-value">${match.season?.slug?.replace(/-/g, " ") || "League"}</span></div>
          </div>
        </div>
        <div class="adsense"><p><script async="async" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2485970459707316" crossorigin="anonymous" ></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-2485970459707316"
     data-ad-slot="3657034432"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script></p></div>
      </div>
    `;
  }
}

// Auto-init for all containers
document.querySelectorAll(".match-widget-container").forEach(container => {
  const league = container.getAttribute("data-league");
  const fixtureId = container.getAttribute("data-id");
  loadMatch(container, league, fixtureId);
  setInterval(() => loadMatch(container, league, fixtureId), 30000);
});
