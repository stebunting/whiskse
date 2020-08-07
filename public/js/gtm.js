// Google Tag Manager
(function gtm(win, doc, script, layer, id) {
  win[layer] = win[layer] || [];
  win[layer].push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });
  const f = doc.getElementsByTagName(script)[0];
  const j = doc.createElement(script);
  const dl = layer !== 'dataLayer' ? `&l=${layer}` : '';
  j.async = true;
  j.src = `https://www.googletagmanager.com/gtm.js?id=${id}${dl}`;
  f.parentNode.insertBefore(j, f);
}(window, document, 'script', 'dataLayer', 'GTM-N8LRXL9'));
