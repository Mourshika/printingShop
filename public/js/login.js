$(function () {
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    const $f = $(this);
    $('#loginError').text('');
    if (!validateForm($f, { username: [V.required('Username')], password: [V.required('Password')] })) return;
    const $btn = $f.find('button').prop('disabled', true).text('Signing in...');
    api('POST', '/api/auth/login', {
      username: $f.find('[name=username]').val().trim(),
      password: $f.find('[name=password]').val()
    })
      .done(() => (location.href = '/admin/dashboard.html'))
      .fail(xhr => $('#loginError').text(errMsg(xhr)))
      .always(() => $btn.prop('disabled', false).text('Login'));
  });
});
