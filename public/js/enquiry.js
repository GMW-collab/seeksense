// Enquiry form enhancement: inline validation messages and submission
// without a page reload. The server validates everything again; without
// JavaScript the form posts normally and the server redirects.
(function () {
  'use strict';
  var form = document.querySelector('[data-enquiry-form]');
  if (!form) return;

  var started = form.querySelector('[data-started]');
  if (started) started.value = String(Date.now());

  var errorBox = form.querySelector('[data-form-error]');
  var success = document.querySelector('[data-form-success]');
  var submit = form.querySelector('[data-submit]');
  var spinner = form.querySelector('[data-spinner]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var labels = {
    name: 'Your name',
    email: 'Email address',
    phone: 'Phone number',
    interest: 'What are you interested in?',
    message: 'Message',
    consent: 'Privacy notice confirmation',
  };

  // Character counter
  form.querySelectorAll('[data-counted]').forEach(function (field) {
    var counter = form.querySelector('[data-counter-for="' + field.name + '"]');
    var max = Number(field.getAttribute('maxlength'));
    var update = function () {
      if (!counter) return;
      var left = max - field.value.length;
      counter.textContent = left < 200 ? left + ' characters remaining' : '';
    };
    field.addEventListener('input', update);
    update();
  });

  function clearErrors() {
    form.querySelectorAll('[data-error-for]').forEach(function (el) {
      el.textContent = '';
    });
    form.querySelectorAll('.field--error').forEach(function (el) {
      el.classList.remove('field--error');
    });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    errorBox.hidden = true;
    errorBox.replaceChildren();
  }

  function showErrors(errors) {
    var keys = Object.keys(errors);
    var heading = document.createElement('h2');
    heading.textContent = 'There is a problem';
    var list = document.createElement('ul');
    keys.forEach(function (key) {
      var field = form.querySelector('[data-field="' + key + '"]');
      var input = form.elements.namedItem(key);
      var target = form.querySelector('[data-error-for="' + key + '"]');
      if (field) field.classList.add('field--error');
      if (input && input.setAttribute) input.setAttribute('aria-invalid', 'true');
      if (target) target.textContent = errors[key];
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + key;
      link.textContent = (labels[key] || key) + ': ' + errors[key];
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var el = document.getElementById(key);
        if (el) el.focus();
      });
      item.appendChild(link);
      list.appendChild(item);
    });
    errorBox.replaceChildren(heading, list);
    errorBox.hidden = false;
    errorBox.focus();
  }

  function showMessage(title, html) {
    var heading = document.createElement('h2');
    heading.textContent = title;
    var body = document.createElement('div');
    body.innerHTML = html; // static, trusted markup defined in this file only
    errorBox.replaceChildren(heading, body);
    errorBox.hidden = false;
    errorBox.focus();
  }

  function localCheck() {
    var errors = {};
    var data = new FormData(form);
    if (!String(data.get('name') || '').trim()) errors.name = 'Enter your name';
    var email = String(data.get('email') || '').trim();
    if (!email) errors.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      errors.email = 'Enter an email address in the correct format, like name@example.com';
    if (!data.get('interest')) errors.interest = 'Choose what you are interested in';
    if (data.get('consent') !== 'yes') errors.consent = 'Confirm you have read the privacy notice';
    return errors;
  }

  function setBusy(busy) {
    form.setAttribute('aria-busy', String(busy));
    submit.disabled = busy;
    spinner.hidden = !busy;
    submitLabel.textContent = busy ? 'Sending' : 'Send enquiry';
  }

  var fallbackEmail = (document.querySelector('a[href^="mailto:"]') || {}).href || '';
  var fallback =
    '<p>Your details have not been saved. Please email us instead' +
    (fallbackEmail
      ? ' at <a href="' +
        fallbackEmail.replace(/"/g, '') +
        '">' +
        fallbackEmail.replace(/^mailto:/, '').replace(/[<>&"]/g, '') +
        '</a>'
      : '') +
    '.</p>';

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();
    var errors = localCheck();
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }
    var payload = {};
    new FormData(form).forEach(function (value, key) {
      payload[key] = value;
    });
    setBusy(true);
    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            return { status: response.status, body: body };
          });
      })
      .then(function (result) {
        setBusy(false);
        if (result.status === 200 && result.body.ok) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
        } else if (result.status === 400 && result.body.errors) {
          showErrors(result.body.errors);
        } else if (result.status === 429) {
          showMessage('Too many attempts', '<p>Please wait a few minutes and try again.</p>' + fallback);
        } else if (result.status === 503) {
          showMessage('Online enquiries are not available right now', fallback);
        } else {
          showMessage('Something went wrong', fallback);
        }
      })
      .catch(function () {
        setBusy(false);
        showMessage('We could not send your enquiry', '<p>Please check your connection and try again.</p>' + fallback);
      });
  });
})();
