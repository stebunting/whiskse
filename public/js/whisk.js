const serverRoot = 'https://whisk-management.herokuapp.com';

// Generate HTML script for 1 Instagram image
function generateInstagramEntry(item) {
  const html = `<a href="${item.permalink}" target="_blank" rel="external"><img class="instagram_thumb" src="${item.media_url}" alt="${item.caption}" /></a>`;
  return html;
}

$(() => {
  // Get Instagram images
  $.ajax({
    method: 'get',
    url: `${serverRoot}/user/instagram`
  }).then((data) => {
    // Display latest Instagram images to page
    let html = '';

    for (let i = 0; i < data.length; i += 1) {
      if (i % 3 === 0) {
        html += '<div class="row latest-instagram">';
      }

      html += generateInstagramEntry(data[i]);

      if (i % 3 === 2) {
        html += '</div>';
      }
    }
    $(html).insertAfter('#instagram-images-header');
  });

  // Display cake cutting diagrams
  $('.view-cake-image').click(function callback() {
    const img = $(this).attr('id');
    const imgHtml = `<img class="cake-guide" src="/images/cake-cutting-guide-${img}.jpg" alt="Cake Cutting Guide" />`;
    $('#cakeCuttingImg').html(imgHtml);
  });
});
