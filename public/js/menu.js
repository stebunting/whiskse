// Display cake cutting diagrams
const links = document.getElementsByClassName('view-cake-image');
for (let i = 0; i < links.length; i += 1) {
  links[i].addEventListener('click', () => {
    document.getElementById('cake-cutting-image')
      .innerHTML = `<img class="cake-guide" src="/images/cake-cutting-guide-${links[i].id}.jpg" alt="Cake Cutting Guide" />`;
  });
}
