$(function () {
  initAdmin('reports');

  function qs() { return $.param({ from: $('#from').val(), to: $('#to').val() }); }

  function load() {
    api('GET', '/api/reports/sales?' + qs()).done(rows => {
      let o = 0, r = 0;
      rows.forEach(x => { o += x.orders; r += Number(x.revenue); });
      $('#salesRows').html(rows.length ? rows.map(x => `<tr><td>${x.day}</td><td class="num">${x.orders}</td><td class="num">${money(x.revenue)}</td></tr>`).join('')
        : '<tr><td colspan="3" class="empty">No paid orders in this period</td></tr>');
      $('#totOrders').text(o); $('#totRev').text(money(r));
    });
    api('GET', '/api/reports/payment-methods?' + qs()).done(rows => {
      $('#methodRows').html(rows.length ? rows.map(x => `<tr><td style="text-transform:capitalize">${x.method}</td><td class="num">${x.payments}</td><td class="num">${money(x.amount)}</td></tr>`).join('')
        : '<tr><td colspan="3" class="empty">No payments</td></tr>');
    });
    api('GET', '/api/reports/top-services?' + qs()).done(rows => {
      $('#topRows').html(rows.length ? rows.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.category)}</td><td class="num">${x.qty_sold}</td><td class="num">${money(x.revenue)}</td></tr>`).join('')
        : '<tr><td colspan="4" class="empty">No data</td></tr>');
    });
    $('#csvBtn').attr('href', '/api/reports/sales.csv?' + qs());
  }

  $('#apply').on('click', function () {
    const f = $('#from').val(), t = $('#to').val();
    if (f && t && f > t) return toast('"From" date must be before "To" date', false);
    load();
  });
  $('#reset').on('click', () => { $('#from, #to').val(''); load(); });
  $('#printBtn').on('click', () => window.print());
  load();
});
