$(function () {
  initAdmin('staff');
  const dlg = $('#dlg')[0], $form = $('#form');

  // Only admins may open this page
  $(document).on('admin:ready', (e, u) => { if (u.role !== 'admin') location.href = '/admin/dashboard.html'; else load(); });

  function load() {
    api('GET', '/api/users').done(list => {
      $('#rows').html(list.map(u => `<tr>
        <td>${esc(u.username)}</td><td>${esc(u.full_name)}</td>
        <td><span class="status ${u.role === 'admin' ? 'processing' : 'ready'}">${u.role}</span></td>
        <td>${fmtDate(u.created_at)}</td>
        <td><button class="btn small secondary edit" data-id="${u.id}" data-user="${esc(u.username)}" data-name="${esc(u.full_name)}" data-role="${u.role}">Edit</button>
            ${u.id !== window.currentUser.id ? `<button class="btn small danger del" data-id="${u.id}">Delete</button>` : ''}</td></tr>`).join(''));
    }).fail(xhr => toast(errMsg(xhr), false));
  }

  $('#addBtn').on('click', () => {
    $form[0].reset(); clearErrors($form);
    $form.find('[name=id]').val(''); $form.find('[name=username]').prop('readonly', false);
    $('#passHint').text('(min 8 chars, letters + numbers)');
    $('#dlgTitle').text('Add user'); dlg.showModal();
  });
  $('#cancelBtn').on('click', () => dlg.close());

  $('#rows').on('click', '.edit', function () {
    const d = $(this).data();
    $form[0].reset(); clearErrors($form);
    $form.find('[name=id]').val(d.id);
    $form.find('[name=username]').val(d.user).prop('readonly', true);
    $form.find('[name=full_name]').val(d.name); $form.find('[name=role]').val(d.role);
    $('#passHint').text('(leave blank to keep current password)');
    $('#dlgTitle').text('Edit user'); dlg.showModal();
  });

  $('#rows').on('click', '.del', function () {
    if (!confirm('Delete this user?')) return;
    api('DELETE', '/api/users/' + $(this).data('id')).done(r => { toast(r.message); load(); }).fail(xhr => toast(errMsg(xhr), false));
  });

  const strong = v => (/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? '' : 'Password needs 8+ characters with letters and numbers');

  $form.on('submit', function (e) {
    e.preventDefault();
    const id = $form.find('[name=id]').val();
    const rules = { full_name: [V.required('Full name')] };
    if (!id) {
      rules.username = [V.required('Username'), v => (/^[A-Za-z0-9_]{3,30}$/.test(v) ? '' : 'Username: 3-30 letters, numbers or _')];
      rules.password = [V.required('Password'), strong];
    } else if ($form.find('[name=password]').val()) {
      rules.password = [strong];
    }
    if (!validateForm($form, rules)) return;
    const data = { full_name: $form.find('[name=full_name]').val().trim(), role: $form.find('[name=role]').val(), password: $form.find('[name=password]').val() };
    if (!id) data.username = $form.find('[name=username]').val().trim();
    api(id ? 'PUT' : 'POST', id ? '/api/users/' + id : '/api/users', data)
      .done(r => { dlg.close(); toast(r.message); load(); })
      .fail(xhr => toast(errMsg(xhr), false));
  });
});
