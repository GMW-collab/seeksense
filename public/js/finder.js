// "Find support" guide. Shows the suggestion that matches the selected
// option. Nothing is stored, sent or added to the URL.
(function () {
  'use strict';
  var form = document.querySelector('[data-finder]');
  var output = document.querySelector('[data-finder-result]');
  var templates = document.querySelector('[data-finder-templates]');
  if (!form || !output || !templates) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  form.addEventListener('change', function (event) {
    var input = event.target;
    if (!input || input.name !== 'situation') return;
    var source = templates.querySelector('[data-result="' + input.value + '"]');
    if (!source) return;
    var clone = source.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(function (el) {
      el.id = 'live-' + el.id;
    });
    var heading = clone.querySelector('h3');
    if (heading) clone.setAttribute('aria-labelledby', heading.id);
    var label = clone.querySelector('.eyebrow');
    if (label) label.textContent = 'Suggested for you';
    output.replaceChildren(clone);
    output.hidden = false;
  });
})();
