$(function () {
  initAdmin('orders');
  const dlg = $('#dlg')[0], viewDlg = $('#viewDlg')[0], payDlg = $('#payDlg')[0];
  const $form = $('#form'), $payForm = $('#payForm');
  const STATUSES = ['pending', 'processing', 'ready', 'completed', 'cancelled'];
  let isAdmin = false, services = [];
  $(document).on('admin:ready', (e, u) => { isAdmin = u.role === 'admin'; load(); });

  function load() {
    const q = { search: $('#search').val(), status: $('#statusFilter').val(), payment: $('#payFilter').val(), from: $('#from').val(), to: $('#to').val() };
    api('GET', '/api/orders?' + $.param(q)).done(list => {
      $('#rows').html(list.length ? list.map(o => `<tr>
        <td><strong>${esc(o.order_no)}</strong></td>
        <td>${esc(o.customer_name)}<br><small class="hint">${esc(o.customer_phone)}</small></td>
        <td>${fmtDate(o.created_at)}</td><td class="num">${money(o.total)}</td>
        <td><select class="statusSel" data-id="${o.id}" aria-label="Order status">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td><span class="status ${o.payment_status}">${o.payment_status}</span></td>
        <td><button class="btn small secondary view" data-id="${o.id}">View</button>
          ${o.payment_status === 'unpaid' && o.status !== 'cancelled' ? `<button class="btn small pay" data-id="${o.id}" data-no="${esc(o.order_no)}" data-total="${o.total}">Pay</button>` : ''}
          ${isAdmin ? `<button class="btn small danger del" data-id="${o.id}">Delete</button>` : ''}</td></tr>`).join('')
        : '<tr><td colspan="7" class="empty">No orders found</td></tr>');
    });
  }

  let t;
  $('#search').on('input', () => { clearTimeout(t); t = setTimeout(load, 250); });
  $('#statusFilter, #payFilter, #from, #to').on('change', load);

  // ----- change status -----
  $('#rows').on('change', '.statusSel', function () {
    api('PUT', `/api/orders/${$(this).data('id')}/status`, { status: this.value })
      .done(r => { toast(r.message); load(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });

  // ----- delete -----
  $('#rows').on('click', '.del', function () {
    if (!confirm('Delete this order permanently?')) return;
    api('DELETE', '/api/orders/' + $(this).data('id')).done(r => { toast(r.message); load(); }).fail(xhr => toast(errMsg(xhr), false));
  });

  // ----- view / invoice -----
  $('#rows').on('click', '.view', function () {
    api('GET', '/api/orders/' + $(this).data('id')).done(o => {
      const items = o.items.map(i => `<tr><td>${esc(i.service_name)}</td><td class="num">${i.quantity} ${esc(i.unit)}</td><td class="num">${money(i.unit_price)}</td><td class="num">${money(i.subtotal)}</td></tr>`).join('');
      const pays = o.payments.length ? o.payments.map(p => `<li>${fmtDate(p.created_at)} - ${p.method}${p.card_last4 ? ' ****' + p.card_last4 : ''} - ${money(p.amount)} - <strong>${p.status}</strong> (${esc(p.transaction_ref)})</li>`).join('') : '<li>No payments yet</li>';
      $('#viewBody').html(`
        <h2>Invoice ${esc(o.order_no)}</h2>
        <p><strong>${esc(o.customer_name)}</strong> | ${esc(o.customer_phone)}<br>${fmtDate(o.created_at)}</p>
        <p><span class="status ${o.status}">${o.status}</span> <span class="status ${o.payment_status}">${o.payment_status}</span></p>
        <div class="table-wrap"><table><thead><tr><th>Service</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Subtotal</th></tr></thead><tbody>${items}</tbody></table></div>
        <div class="total-line">Total: ${money(o.total)}</div>
        ${o.notes ? `<p><em>Notes: ${esc(o.notes)}</em></p>` : ''}
        <h3>Payments</h3><ul>${pays}</ul>`);
      viewDlg.showModal();
    });
  });
  $('#closeView').on('click', () => viewDlg.close());
  $('#printBtn').on('click', () => window.print());

  // ----- payment (mock) -----
  $('#rows').on('click', '.pay', function () {
    $payForm[0].reset(); clearErrors($payForm); $('#payError').text(''); $('#cardBox').hide();
    $payForm.find('[name=order_id]').val($(this).data('id'));
    $('#payInfo').html(`Order <strong>${$(this).data('no')}</strong> - amount due <strong>${money($(this).data('total'))}</strong>`);
    payDlg.showModal();
  });
  $('#p_method').on('change', function () { $('#cardBox').toggle(this.value === 'card'); });
  $('#payCancel').on('click', () => payDlg.close());
  $('#p_card').on('input', function () { this.value = this.value.replace(/[^\d ]/g, ''); });

  $payForm.on('submit', function (e) {
    e.preventDefault();
    clearErrors($payForm); $('#payError').text('');
    const method = $payForm.find('[name=method]').val();
    const data = { method };
    if (method === 'card') {
      const num = $payForm.find('[name=card_number]').val().replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(num)) return setError($payForm.find('[name=card_number]'), 'Enter a valid card number');
      data.card_number = num;
    }
    api('POST', `/api/orders/${$payForm.find('[name=order_id]').val()}/pay`, data)
      .done(r => { payDlg.close(); toast(`${r.message} - ${r.transaction_ref}`); load(); })
      .fail(xhr => $('#payError').text(errMsg(xhr)));
  });

  // ----- new order -----
  function loadLookups() {
    const a = api('GET', '/api/customers').done(c => $('#o_cust').html('<option value="">Select customer...</option>' + c.map(x => `<option value="${x.id}">${esc(x.name)} (${esc(x.phone)})</option>`).join('')));
    const b = api('GET', '/api/services').done(s => (services = s));
    return $.when(a, b);
  }
  function addItemRow() {
    const opts = services.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const $row = $(`<div class="item-row"><select class="svc"><option value="">Service...</option>${opts}</select>
      <input class="qty" type="number" min="1" value="1" aria-label="Quantity"><span class="line">Rs. 0.00</span>
      <button type="button" class="btn small danger rm" aria-label="Remove item">&times;</button></div>`).hide();
    $('#items').append($row); $row.slideDown(120);
  }
  function recalc() {
    let total = 0;
    $('#items .item-row').each(function () {
      const s = services.find(x => x.id === Number($(this).find('.svc').val()));
      const qty = parseInt($(this).find('.qty').val(), 10) || 0;
      let line = 0;
      if (s && qty > 0) { const unit = s.bulk_qty && qty >= s.bulk_qty ? s.bulk_price : s.price; line = unit * qty; }
      total += line; $(this).find('.line').text(money(line));
    });
    $('#orderTotal').text(money(total));
  }
  $('#addBtn').on('click', () => {
    $form[0].reset(); clearErrors($form); $('#items').empty(); $('#orderTotal').text(money(0));
    loadLookups().done(() => { addItemRow(); recalc(); });
    dlg.showModal();
  });
  $('#cancelBtn').on('click', () => dlg.close());
  $('#addItem').on('click', addItemRow);
  $('#items').on('click', '.rm', function () { $(this).closest('.item-row').slideUp(120, function () { $(this).remove(); recalc(); }); });
  $('#items').on('input change', '.svc, .qty', recalc);

  $form.on('submit', function (e) {
    e.preventDefault();
    clearErrors($form);
    let ok = true;
    const cust = $form.find('[name=customer_id]');
    if (!cust.val()) { setError(cust, 'Select a customer'); ok = false; }
    const items = [];
    $('#items .item-row').each(function () {
      const sid = $(this).find('.svc').val(), qty = parseInt($(this).find('.qty').val(), 10);
      $(this).find('.svc, .qty').removeClass('invalid');
      if (!sid) { $(this).find('.svc').addClass('invalid'); ok = false; }
      if (!qty || qty < 1) { $(this).find('.qty').addClass('invalid'); ok = false; }
      if (sid && qty > 0) items.push({ service_id: Number(sid), quantity: qty });
    });
    if (!items.length) { toast('Add at least one valid item', false); ok = false; }
    if (!ok) return;
    api('POST', '/api/orders', { customer_id: Number(cust.val()), notes: $form.find('[name=notes]').val().trim(), items })
      .done(r => { dlg.close(); toast(`Order ${r.order_no} created`); load(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });
});
