async function loadMatch(container, league, fixtureId) {
  const storageKey = `match_${fixtureId}`;

  try {
    const res = await fetch(`https://love-weld-nine.vercel.app/api/espn?league=${league}&id=${fixtureId}`);
    const data = await res.json();

    if (!data.events?.length) {
      loadFromStorage("No matches available");
      return;
    }

    // ✅ since we fetch by fixture id, the first event is our match
    const match = data.events[0];

    if (!match) {
      loadFromStorage("No upcoming or live match found for this fixture");
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(match));
    displayMatch(match);

    if (match.status?.type?.state === "in") {
      setTimeout(() => loadMatch(container, league, fixtureId), 30000);
    }
  } catch (err) {
    console.error(err);
    loadFromStorage("❌ Failed to load match data");
  }

  function loadFromStorage(fallbackMsg) {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const match = JSON.parse(stored);
      displayMatch(match, true);
    } else {
      container.innerHTML = fallbackMsg;
    }
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
  const league = container.getAttribute("data-league");
  const fixtureId = container.getAttribute("data-id");
  loadMatch(container, league, fixtureId);
  setInterval(() => loadMatch(container, league, fixtureId), 30000);
});
