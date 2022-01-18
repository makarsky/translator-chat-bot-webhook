window.onload = function () {
  let query = window.location.search;

  if (!query) {
    query = '?start=organic';
  }

  Array.from(document.querySelectorAll('a.telegram')).forEach((l) => {
    // eslint-disable-next-line no-param-reassign
    l.href += query;
  });
};
