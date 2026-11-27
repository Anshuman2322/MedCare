// Phone-friendly tables. On small screens (see .cn-stack in index.css) every row
// of a `table.cn-stack` is shown as a card, each value with its column name in
// front of it. The column names come from the table's own <th> cells: this
// copies them onto the matching <td> as data-label, for every table on the
// page, including rows added later (search, refresh, paging). Nothing changes
// on larger screens, and if this never runs the table simply scrolls sideways.
let started = false;

function label(table) {
  const headings = [...table.querySelectorAll(':scope > thead th')].map((th) => th.textContent.trim());
  if (!headings.length) return;
  for (const row of table.querySelectorAll(':scope > tbody > tr')) {
    let column = 0;
    for (const cell of row.children) {
      const name = headings[column] || '';
      if (cell.getAttribute('data-label') !== name) cell.setAttribute('data-label', name);
      column += Number(cell.getAttribute('colspan')) || 1;
    }
  }
}

export function initStackedTables() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const run = () => document.querySelectorAll('table.cn-stack').forEach(label);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      run();
    });
  }).observe(document.body, { childList: true, subtree: true });
  run();
}
