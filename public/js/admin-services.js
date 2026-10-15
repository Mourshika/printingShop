$(function () {
  initAdmin('services');
  const dlg = $('#dlg')[0], $form = $('#form');
  let isAdmin = false;
  $(document).on('admin:ready', (e, u) => { isAdmin = u.role === 'admin'; load(); });

  function loadCategories() {
    api('GET', '/api/services/categories').done(c => {
      $('#cats').html(c.map(x => `<option value="${esc(x)}">`).join(''));
      const cur = $('#catFilter').val();
      $('#catFilter').html('<option value="">All categories</option>' + c.map(x => `<option>${esc(x)}</option>`).join('')).val(cur);
    });
  }

  function load() {
    api('GET', '/api/services?all=1&' + $.param({ search: $('#search').val(), category: $('#catFilter').val() })).done(list => {
      $('#rows').html(list.length ? list.map(s => `<tr>
        <td>${esc(s.name)}</td><td>${esc(s.category)}</td><td>${esc(s.unit)}</td>
        <td class="num">${money(s.price)}</td>
        <td>${s.bulk_qty ? `${money(s.bulk_price)} @ ${s.bulk_qty}+` : '-'}</td>
        <td><span class="status ${s.is_active ? 'completed' : 'cancelled'}">${s.is_active ? 'active' : 'inactive'}</span></td>
        <td><button class="btn small secondary edit" data-id="${s.id}">Edit</button>
            ${isAdmin ? `<button class="btn small danger del" data-id="${s.id}">Delete</button>` : ''}</td></tr>`).join('')
        : '<tr><td colspan="7" class="empty">No services found</td></tr>');
    });
  }
  loadCategories();

  let t;
  $('#search').on('input', () => { clearTimeout(t); t = setTimeout(load, 250); });
  $('#catFilter').on('change', load);

  $('#addBtn').on('click', () => {
    $form[0].reset(); clearErrors($form); $form.find('[name=id]').val('');
    $('#dlgTitle').text('Add service'); dlg.showModal();
  });
  $('#cancelBtn').on('click', () => dlg.close());

  $('#rows').on('click', '.edit', function () {
    api('GET', '/api/services/' + $(this).data('id')).done(s => {
      clearErrors($form);
      Object.keys(s).forEach(k => $form.find(`[name="${k}"]`).val(s[k]));
      $form.find('[name=id]').val(s.id);
      $('#dlgTitle').text('Edit service'); dlg.showModal();
    });
  });

  $('#rows').on('click', '.del', function () {
    if (!confirm('Delete this service? (Services used in orders cannot be deleted - set them inactive instead.)')) return;
    api('DELETE', '/api/services/' + $(this).data('id'))
      .done(r => { toast(r.message); load(); loadCategories(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });

  $form.on('submit', function (e) {
    e.preventDefault();
    const ok = validateForm($form, {
      name: [V.required('Name')], category: [V.required('Category')], unit: [V.required('Unit')],
      price: [V.required('Price'), V.positive('Price')]
    });
    const bq = $form.find('[name=bulk_qty]').val(), bp = $form.find('[name=bulk_price]').val();
    let bulkOk = true;
    if ((bq && !bp) || (!bq && bp)) { setError($form.find('[name=bulk_qty]'), 'Enter both bulk quantity and bulk price, or leave both empty'); bulkOk = false; }
    else if (bq && Number(bp) >= Number($form.find('[name=price]').val())) { setError($form.find('[name=bulk_price]'), 'Bulk price should be lower than the normal price'); bulkOk = false; }
    if (!ok || !bulkOk) return;

    const id = $form.find('[name=id]').val();
    const data = {
      name: $form.find('[name=name]').val().trim(), category: $form.find('[name=category]').val().trim(),
      description: $form.find('[name=description]').val().trim(), unit: $form.find('[name=unit]').val().trim(),
      price: Number($form.find('[name=price]').val()),
      bulk_qty: bq ? Number(bq) : null, bulk_price: bp ? Number(bp) : null,
      is_active: $form.find('[name=is_active]').val() === '1'
    };
    api(id ? 'PUT' : 'POST', id ? '/api/services/' + id : '/api/services', data)
      .done(r => { dlg.close(); toast(r.message); load(); loadCategories(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });
});
