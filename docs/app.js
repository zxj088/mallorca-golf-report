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

let candidateStates = {};

async function updateCandidateState(candidateId, action) {
  const code = window.prompt("请输入确认码");
  if (code !== "56") {
    window.alert("确认码不正确，未执行操作。");
    return;
  }

  try {
    const response = await fetch("/api/candidate-states", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ candidateId, action, code }),
    });
    if (!response.ok) throw new Error("状态保存失败");
    await refreshCandidateStates();
  } catch {
    window.alert("状态暂时无法同步，请稍后重试。");
  }
}

function applyCandidateStates() {
  document.querySelectorAll("[data-candidate-id]").forEach((card) => {
    const state = candidateStates[card.dataset.candidateId] || "";
    card.classList.toggle("is-verified", state === "verified");
    card.classList.toggle("is-deleted", state === "deleted");
    card.querySelectorAll("button").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.action === state),
      );
    });
  });
}

async function refreshCandidateStates() {
  try {
    const response = await fetch("/api/candidate-states", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("状态读取失败");
    const payload = await response.json();
    candidateStates = payload.states || {};
    applyCandidateStates();
  } catch {
    // 保留当前显示状态，下一次轮询继续重试。
  }
}

function renderLodgingCandidates(candidates) {
  const node = $("#lodging-candidates");
  node.innerHTML = candidates
    .map(
      (candidate) => `
        <article class="candidate-card" data-candidate-id="${escapeHtml(candidate.id)}">
          <div class="candidate-copy">
            <div class="candidate-meta">
              <span>${escapeHtml(candidate.addedDate)}</span>
              <span>${escapeHtml(candidate.source)}</span>
            </div>
            <h3>${escapeHtml(candidate.title)}</h3>
            <strong>${escapeHtml(candidate.price)}</strong>
            <p>${escapeHtml(candidate.note)}</p>
            <a href="${encodeURI(candidate.url)}" target="_blank" rel="noopener noreferrer">查看房源 ↗</a>
          </div>
          <div class="candidate-actions" aria-label="${escapeHtml(candidate.title)}操作">
            <button type="button" data-action="verified">已核实</button>
            <button type="button" data-action="deleted">删除</button>
          </div>
        </article>
      `,
    )
    .join("");

  node.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest("[data-candidate-id]");
    updateCandidateState(card.dataset.candidateId, button.dataset.action);
  });
  refreshCandidateStates();
  window.setInterval(refreshCandidateStates, 4000);
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
        <details class="alert ${alert.level}">
          <summary>
            <strong>${escapeHtml(alert.title)}</strong>
            <span class="fold-label">展开</span>
          </summary>
          <p>${escapeHtml(alert.detail)}</p>
        </details>
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

  renderLodgingCandidates(report.lodgingCandidates || []);
  const diff = report.dailyDiff;
  if (diff) {
    $("#diff-period").textContent =
      `${diff.previousDate} → ${diff.currentDate}。${diff.note || ""}`;
    renderList("#daily-diff", diff.items || []);
  }

  const airbnb = report.airbnbSpotlight;
  if (airbnb) {
    $("#airbnb-modal-summary").textContent = airbnb.summary;
    $("#airbnb-modal-name").textContent = airbnb.name;
    $("#airbnb-modal-details").textContent = airbnb.details;
    $("#airbnb-modal-price").textContent = airbnb.price;
    $("#airbnb-modal-caution").textContent = airbnb.caution;
    $("#airbnb-modal-listing").href = airbnb.listingUrl;
    $("#airbnb-modal-search").href = airbnb.searchUrl;

    const modal = $("#airbnb-modal");
    const openModal = () => {
      if (!modal.open) modal.showModal();
    };
    $("#open-airbnb-modal").addEventListener("click", openModal);
    $(".modal-close").addEventListener("click", () => modal.close());
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    });
    openModal();
  }
}

fetch("./data/report.json?v=20260803-lodging")
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
