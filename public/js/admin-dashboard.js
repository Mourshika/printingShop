$(function () {
  initAdmin('dashboard');
  $('#today').text(new Date().toLocaleDateString('en-GB', { dateStyle: 'full' }));

  api('GET', '/api/reports/summary').done(d => {
    const o = d.orders;
    const stat = (label, value) => `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div></div>`;
    $('#stats').hide().html(
      stat('Total orders', o.total_orders || 0) + stat('Orders today', o.today_orders || 0) +
      stat('Revenue (paid)', money(d.revenue)) + stat('Outstanding', money(d.outstanding)) +
      stat('Customers', d.customers) + stat('Active services', d.services)
    ).fadeIn(300);

    // revenue bars (last 7 days, fill missing days with 0)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      days.push(dt.toLocaleDateString('en-CA'));
    }
    const map = {}; d.last7.forEach(r => (map[r.day] = r.revenue));
    const max = Math.max(1, ...days.map(x => map[x] || 0));
    $('#bars').html(days.map(x => {
      const v = map[x] || 0;
      return `<div class="bar-col" title="${money(v)}"><div class="bar" style="height:${(v / max) * 130}px"></div>${x.slice(5)}</div>`;
    }).join(''));

    $('#statusList').html(['pending', 'processing', 'ready', 'completed', 'cancelled'].map(s =>
      `<p><span class="status ${s}">${s}</span> <strong>${o[s] || 0}</strong></p>`).join(''));

    $('#recent').html(d.recent.length ? d.recent.map(r => `<tr>
      <td>${esc(r.order_no)}</td><td>${esc(r.customer_name)}</td>
      <td><span class="status ${r.status}">${r.status}</span></td>
      <td><span class="status ${r.payment_status}">${r.payment_status}</span></td>
      <td class="num">${money(r.total)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">No orders yet</td></tr>');
  }).fail(xhr => toast(errMsg(xhr), false));
});
