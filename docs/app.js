const $ = (selector) => document.querySelector(selector);

function renderList(id, items) {
  const node = $(id);
  node.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
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
          <strong>${alert.title}</strong>
          <p>${alert.detail}</p>
        </article>
      `,
    )
    .join("");

  renderList("#flights", report.sections.flights);
  renderList("#golf", report.sections.golf);
  renderList("#lodging", report.sections.lodging);
  renderList("#car", report.sections.car);

  $("#costs").innerHTML = report.costs
    .map(
      (cost) => `
        <div class="cost-row">
          <strong>${cost.item}</strong>
          <span class="cost-amount">${cost.amount}</span>
          <span class="cost-note">${cost.note}</span>
        </div>
      `,
    )
    .join("");

  $("#channels").innerHTML = report.lodgingChannels
    .map((channel) => `<span>${channel}</span>`)
    .join("");

  $("#questions").innerHTML = report.questions
    .map((question) => `<li>${question}</li>`)
    .join("");

  $("#history").innerHTML = report.history
    .map(
      (entry) => `
        <article class="history-item">
          <time>${entry.date}</time>
          <p>${entry.summary}</p>
        </article>
      `,
    )
    .join("");

  $("#sources").innerHTML = report.sources
    .map(
      (source) =>
        `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label}</a>`,
    )
    .join("");
}

fetch("./data/report.json")
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
