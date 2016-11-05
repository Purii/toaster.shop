(function() {
    const toggleNavigationElms = document.getElementsByClassName('togglenavigation');
    for(let elm of toggleNavigationElms) {
      elm.addEventListener('click', () => document.body.classList.toggle('show-nav'))
    }
}());
