// The page slide (see main.css) only plays for clicks on the header nav.
// Every other navigation, including back/forward, loads without it.
let navClick = false;
document.addEventListener('click', (e) => {
  navClick = !!e.target.closest('.site-header nav a');
});
// Only reset when the page comes back from the back/forward cache. A plain pageshow also fires
// when the first load finishes, which can land after a quick nav click and wipe the flag.
addEventListener('pageshow', (e) => { if (e.persisted) navClick = false; });
addEventListener('pageswap', (e) => {
  if (!navClick) e.viewTransition?.skipTransition();
});
