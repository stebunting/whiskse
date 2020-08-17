/* global ejs */
const template = `<%
data.forEach((item, index) => {
  if (index % 3 === 0) { %>
<div class="row latest-instagram"><% } %>
  <a href="<%=item.permalink %>" target="_blank" rel="external">
    <img class="instagram-thumb" src="<%=item.media_url %>" alt="<%=item.caption %>" />
  </a><%
  if (index % 3 === 2) { %>
</div><% }
}); %>`;
const container = document.getElementById('instagram-container');

// Get Instagram images
fetch('https://whisk-management.herokuapp.com/user/instagram')
  .then((response) => response.json())
  .then((data) => {
    container.innerHTML = ejs.render(template, { data });
  });
