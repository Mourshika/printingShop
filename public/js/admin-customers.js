$(function () {
  initAdmin('customers');
  const dlg = $('#dlg')[0], $form = $('#form');
  let isAdmin = false;
  $(document).on('admin:ready', (e, u) => { isAdmin = u.role === 'admin'; load(); });

  function load() {
    api('GET', '/api/customers?' + $.param({ search: $('#search').val() })).done(list => {
      $('#rows').html(list.length ? list.map(c => `<tr>
        <td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${esc(c.email || '-')}</td><td>${esc(c.address || '-')}</td>
        <td class="num">${c.order_count}</td>
        <td><button class="btn small secondary edit" data-id="${c.id}">Edit</button>
            ${isAdmin ? `<button class="btn small danger del" data-id="${c.id}">Delete</button>` : ''}</td></tr>`).join('')
        : '<tr><td colspan="6" class="empty">No customers found</td></tr>');
    });
  }

  let t;
  $('#search').on('input', () => { clearTimeout(t); t = setTimeout(load, 250); });

  $('#addBtn').on('click', () => {
    $form[0].reset(); clearErrors($form); $form.find('[name=id]').val('');
    $('#dlgTitle').text('Add customer'); dlg.showModal();
  });
  $('#cancelBtn').on('click', () => dlg.close());

  $('#rows').on('click', '.edit', function () {
    api('GET', '/api/customers/' + $(this).data('id')).done(c => {
      clearErrors($form);
      ['name', 'phone', 'email', 'address'].forEach(k => $form.find(`[name=${k}]`).val(c[k] || ''));
      $form.find('[name=id]').val(c.id);
      $('#dlgTitle').text('Edit customer'); dlg.showModal();
    });
  });

  $('#rows').on('click', '.del', function () {
    if (!confirm('Delete this customer?')) return;
    api('DELETE', '/api/customers/' + $(this).data('id'))
      .done(r => { toast(r.message); load(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });

  $form.on('submit', function (e) {
    e.preventDefault();
    if (!validateForm($form, { name: [V.required('Name')], phone: [V.required('Phone'), V.phone], email: [V.email] })) return;
    const id = $form.find('[name=id]').val();
    const data = {};
    ['name', 'phone', 'email', 'address'].forEach(k => (data[k] = $form.find(`[name=${k}]`).val().trim()));
    api(id ? 'PUT' : 'POST', id ? '/api/customers/' + id : '/api/customers', data)
      .done(r => { dlg.close(); toast(r.message); load(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });
});
