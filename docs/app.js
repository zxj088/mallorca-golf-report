const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderList(id, items) {
  const node = $(id);
  node.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderPickCards(id, picks) {
  const node = $(id);
  node.innerHTML = picks
    .map(
      (pick) => `
        <article class="pick-card">
          <div>
            <h3>${escapeHtml(pick.title)}</h3>
            <p class="pick-meta">${escapeHtml(pick.dates || pick.distance)}</p>
          </div>
          <p class="pick-price">${escapeHtml(pick.price)}</p>
          <p>${escapeHtml(pick.why)}</p>
          <a class="pick-link" href="${encodeURI(pick.url)}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>
        </article>
      `,
    )
    .join("");
}

function renderReport(report) {
  $("#last-updated").textContent = `更新：${report.lastUpdated}`;
  $("#next-review").textContent = report.nextReview;
  $("#primary-window").textContent = report.recommendation.primaryWindow;
  $("#golf-window").textContent = `打球窗口：${report.recommendation.golfWindow}`;
  $("#decision").textContent = report.recommendation.decision;
  $("#confidence").textContent = `判断信心：${report.recommendation.confidence}`;
  $("#route-copy").textContent = `${report.trip.origin} → ${report.trip.destination}，${report.trip.travellers}；${report.trip.golfers}。`;

  $("#alerts").innerHTML = report.alerts
    .map(
      (alert) => `
        <article class="alert ${alert.level}">
          <strong>${escapeHtml(alert.title)}</strong>
          <p>${escapeHtml(alert.detail)}</p>
        </article>
      `,
    )
    .join("");

  renderList("#flights", report.sections.flights);
  renderList("#golf", report.sections.golf);
  renderList("#lodging", report.sections.lodging);
  renderList("#car", report.sections.car);
  renderPickCards("#combo-picks", report.currentPicks.bestCombos);
  renderPickCards("#flight-picks", report.currentPicks.flights);
  renderPickCards("#lodging-picks", report.currentPicks.lodging);

  $("#costs").innerHTML = report.costs
    .map(
      (cost) => `
        <div class="cost-row">
          <strong>${escapeHtml(cost.item)}</strong>
          <span class="cost-amount">${escapeHtml(cost.amount)}</span>
          <span class="cost-note">${escapeHtml(cost.note)}</span>
        </div>
      `,
    )
    .join("");

  const lodgingSearch = report.lodgingSearch;
  $("#channels").innerHTML = report.lodgingChannels
    .map(
      (channel) => `
        <a href="${encodeURI(channel.url)}" target="_blank" rel="noopener noreferrer">
          <strong>${escapeHtml(channel.label)}</strong>
          <span>${escapeHtml(channel.note)}</span>
        </a>
      `,
    )
    .join("");
  if (lodgingSearch?.note) {
    $("#channels").insertAdjacentHTML(
      "beforebegin",
      `<p class="channel-note">查询条件：${escapeHtml(lodgingSearch.checkIn)} 入住，${escapeHtml(lodgingSearch.checkOut)} 退房，${escapeHtml(lodgingSearch.adults)} 位成人，${escapeHtml(lodgingSearch.rooms)} 间/套。${escapeHtml(lodgingSearch.note)}</p>`,
    );
  }

  $("#questions").innerHTML = report.questions
    .map((question) => `<li>${escapeHtml(question)}</li>`)
    .join("");

  $("#history").innerHTML = report.history
    .map(
      (entry) => `
        <article class="history-item">
          <time>${escapeHtml(entry.date)}</time>
          <p>${escapeHtml(entry.summary)}</p>
        </article>
      `,
    )
    .join("");

  $("#sources").innerHTML = report.sources
    .map(
      (source) =>
        `<a href="${encodeURI(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} ↗</a>`,
    )
    .join("");
}

fetch("./data/report.json?v=20260725-sites")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Report data failed to load");
    }
    return response.json();
  })
  .then(renderReport)
  .catch(() => {
    $("#decision").textContent = "报告数据暂时无法读取，请检查 data/report.json。";
  });
