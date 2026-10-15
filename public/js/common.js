/* Shared helpers: AJAX wrapper, toast, escaping, admin shell */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) { return 'Rs. ' + Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); }

function api(method, url, data) {
  return $.ajax({
    url, method, dataType: 'json', contentType: 'application/json',
    data: data ? JSON.stringify(data) : undefined
  }).fail(xhr => { if (xhr.status === 401 && !url.includes('/auth/login')) location.href = '/login.html'; });
}

function errMsg(xhr) {
  const j = xhr.responseJSON;
  if (j && j.errors && j.errors.length) return j.errors.map(e => e.msg).join(' | ');
  return (j && j.message) || 'Something went wrong. Please try again.';
}

function toast(msg, ok = true) {
  const $t = $('#toast');
  $t.removeClass('ok err').addClass(ok ? 'ok' : 'err').text(msg).stop(true, true).fadeIn(200).delay(2800).fadeOut(400);
}

/* ----- client-side validation helpers (DOM updates) ----- */
function setError($input, msg) {
  $input.addClass('invalid');
  let $e = $input.next('.field-error');
  if (!$e.length) $e = $('<div class="field-error"></div>').insertAfter($input);
  $e.text(msg);
}
function clearErrors($form) {
  $form.find('.invalid').removeClass('invalid');
  $form.find('.field-error').text('');
}
// rules: { fieldName: [(value) => errorMessageOrEmpty, ...] }
function validateForm($form, rules) {
  clearErrors($form);
  let ok = true;
  Object.keys(rules).forEach(name => {
    const $f = $form.find(`[name="${name}"]`);
    for (const rule of rules[name]) {
      const msg = rule($f.val().trim());
      if (msg) { setError($f, msg); ok = false; break; }
    }
  });
  return ok;
}
const V = {
  required: label => v => (v ? '' : `${label} is required`),
  phone: v => (/^[0-9+\-\s]{7,20}$/.test(v) ? '' : 'Enter a valid phone number'),
  email: v => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address'),
  positive: label => v => (Number(v) > 0 ? '' : `${label} must be greater than 0`),
  minLen: (n, label) => v => (v.length >= n ? '' : `${label} must be at least ${n} characters`)
};

/* ----- Admin shell: sidebar + auth check ----- */
function initAdmin(active) {
  api('GET', '/api/auth/me').done(res => {
    const u = res.user;
    const links = [
      ['dashboard', 'Dashboard'], ['orders', 'Orders'], ['customers', 'Customers'],
      ['services', 'Services & Pricing'], ['reports', 'Reports']
    ];
    if (u.role === 'admin') links.push(['staff', 'Staff Users']);
    const nav = links.map(([k, t]) => `<a href="/admin/${k}.html" class="${k === active ? 'active' : ''}">${t}</a>`).join('');
    $('#sidebar').html(`
      <a class="brand" href="/admin/dashboard.html">EMORA DIGITAL</a>
      <nav aria-label="Admin menu">${nav}<a href="/" target="_blank">View public site</a></nav>
      <div class="user-box">Signed in as<br><strong>${esc(u.full_name)}</strong> (${esc(u.role)})<br>
        <button id="logoutBtn" class="btn small secondary" style="margin-top:.6rem">Logout</button></div>`);
    $('#logoutBtn').on('click', () => api('POST', '/api/auth/logout').always(() => (location.href = '/login.html')));
    window.currentUser = u;
    $(document).trigger('admin:ready', [u]);
  });
  $('.menu-toggle').on('click', () => $('#sidebar').slideToggle(150).toggleClass('open'));
}
