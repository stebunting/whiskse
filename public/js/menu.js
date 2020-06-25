$(() => {
  // Display cake cutting diagrams
  $('.view-cake-image').click(function callback() {
    const img = $(this).attr('id');
    const imgHtml = `<img class="cake-guide" src="/images/cake-cutting-guide-${img}.jpg" alt="Cake Cutting Guide" />`;
    $('#cakeCuttingImg').html(imgHtml);
  });
});
