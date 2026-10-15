$(function () {
  // AJAX: load categories + services
  api('GET', '/api/services/categories').done(cats => {
    cats.forEach(c => $('#categoryFilter').append(`<option>${esc(c)}</option>`));
  });

  let timer;
  function loadServices() {
    const q = { search: $('#searchBox').val().trim(), category: $('#categoryFilter').val() };
    $.getJSON('/api/services', q).done(list => {
      const $g = $('#serviceGrid').hide().empty();
      if (!list.length) $g.append('<p class="empty">No services match your search.</p>');
      list.forEach(s => {
        const bulk = s.bulk_qty ? `<div class="badge-bulk">${money(s.bulk_price)} each for ${s.bulk_qty}+ ${esc(s.unit)}s</div>` : '';
        $g.append(`<article class="card">
          <span class="tag">${esc(s.category)}</span>
          <h3>${esc(s.name)}</h3>
          <p class="hint">${esc(s.description || '')}</p>
          <div class="price">${money(s.price)} <small>/ ${esc(s.unit)}</small></div>${bulk}
        </article>`);
      });
      $g.fadeIn(250);
    });
  }
  loadServices();
  $('#searchBox').on('input', () => { clearTimeout(timer); timer = setTimeout(loadServices, 250); });
  $('#categoryFilter').on('change', loadServices);

  // Order tracking
  $('#trackForm').on('submit', function (e) {
    e.preventDefault();
    const $f = $(this);
    const ok = validateForm($f, {
      order_no: [V.required('Order number')],
      phone: [V.required('Phone number'), V.phone]
    });
    if (!ok) return;
    $.getJSON('/api/track', { order_no: $f.find('[name=order_no]').val().trim(), phone: $f.find('[name=phone]').val().trim() })
      .done(o => {
        const steps = ['pending', 'processing', 'ready', 'completed'];
        const idx = steps.indexOf(o.status);
        const progress = o.status === 'cancelled'
          ? '<span class="status cancelled">Cancelled</span>'
          : steps.map((s, i) => `<span class="status ${i <= idx ? s : ''}" style="${i <= idx ? '' : 'background:#eee;color:#999'}">${s}</span>`).join(' &rarr; ');
        const items = o.items.map(i => `<li>${esc(i.name)} &times; ${i.quantity} - ${money(i.subtotal)}</li>`).join('');
        $('#trackResult').hide().html(`
          <h3>Order ${esc(o.order_no)}</h3>
          <p>Hello ${esc(o.customer_name)}. Placed on ${fmtDate(o.created_at)}.</p>
          <p>${progress}</p>
          <ul>${items}</ul>
          <p><strong>Total: ${money(o.total)}</strong> <span class="status ${o.payment_status}">${o.payment_status}</span></p>`).slideDown(250);
      })
      .fail(xhr => $('#trackResult').hide().html(`<p class="field-error">${esc(errMsg(xhr))}</p>`).fadeIn(200));
  });
});
