window.addEventListener('load', () => {
    $search = document.querySelector('#search');
    $myList = document.querySelector('#fav_list');

    favouritesListeners();
    renderFavourites();

    $search.addEventListener('submit', e => {
        e.preventDefault();
        query = document.querySelector('#search__query').value
        searchSongs(query.trim())
    });
});

const favouritesListeners = () => {
    document.querySelector('.toggle__fav').addEventListener('click', () => {
        if (getComputedStyle($myList).right !== '-400px') return hideFavList();
        showFavList();
        closeFavListBtnListener();
    });
}

const hideFavList = () => $myList.style.right = '-400px';
const showFavList = () => $myList.style.right = '0';
const closeFavListBtnListener = () => document.querySelector('#close_fav_list').addEventListener('click', hideFavList);

const saveCache = (key, values) => localStorage.setItem(key, JSON.stringify(values))

const getFavourites = () => JSON.parse(localStorage.getItem(':FAVOURITES:'));
const saveFavourites = favs => localStorage.setItem(':FAVOURITES:', JSON.stringify(favs));
const deleteFavourite = id => {
    favs = getFavourites();

    if (!favs) return;

    saveFavourites(favs.filter(el => el.id != id));
};

const renderFavList = () => new DOMRender('#fav_list')

const checkCache = (key) => !!localStorage.getItem(key);
const getCacheData = (key) => JSON.parse(localStorage.getItem(key));

const clearCardsAndMessages = () => {
    document.querySelector('#cards').innerHTML = '';
    document.querySelector('#messages').innerHTML = '';
};

const renderEmptyMessage = () => new DOMRender()
    .renderElement('#messages', "<p class=\"message\">No results, but we still love you <3</p>");

const addBtnFavListeners = () => document.querySelectorAll('.card__fav_btn')
    .forEach(el => el.addEventListener('click', addToFavourites));

const searchSongs = (query) => {

    if (checkCache(query)) return renderResults(getCacheData(query));
    if (query.length == 0) return renderEmptyMessage;

    fetch(`${API_SEARCH_URL.replace(':query:', encodeURI(query))}`)
        .then(res => res.json())
        .then(json => {
            const results = json.response.hits.map(el => el.result);

            saveCache(query, results);

            if (results.length == 0) {
                clearCardsAndMessages();
                renderEmptyMessage();
                return;
            }

            renderResults(results);

        }).catch(console.error);
};

const createCard = song => {
    const title = song.title.replace(/\n/, ' ');
    return card_template.replace(/:title:/g, title.length > 15 ? `${title.substr(0, 12)}...` : title)
        .replace(/:complete_title:/g, title)
        .replace(/:id:/g, song.id)
        .replace(/:cover:/g, song.song_art_image_thumbnail_url)
        .replace(/:url:/g, song.url)
        .replace(/:author:/g, song.primary_artist.name);
};

function renderResults(results, start = 0, end = 9) {
    clearCardsAndMessages();
    renderLoader();

    DRender = new DOMRender('#cards');
    results = results.splice(start, end)


    results.forEach(renderCards)
    removeLoader();

    addBtnFavListeners();
}

const renderCards = song => new DOMRender('#cards', createCard(song)).renderElement();

const renderLoader = () => new DOMRender('#cards', '<div class="loader"></div>').renderElement();

const removeLoader = () => document.querySelector('.loader').parentElement.removeChild(document.querySelector('.loader'));


const createFavElement = song => {
    const title = song.title.replace(/\n/, ' ');
    return (fav_list_card_template
        .replace(/:cover:/g, song.cover)
        .replace(/:title:/g, title.length > 15 ? `${title.substr(0, 12)}...` : title)
        .replace(/:complete_title:/g, song.title)
        .replace(/:id:/g, song.id)
        .replace(/:url:/g, song.url)
        .replace(/:author:/g, song.author)
    );
};

const animateToggleListButton = () => {
    document.querySelector('.toggle__fav').classList.add('hop')
    const el = document.querySelector('.toggle__fav')
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el)
    favouritesListeners();
};

const clearFavList = () => document.querySelector('#fav_cards').innerHTML = '';

const renderFavElement = song => new DOMRender('#fav_cards', createFavElement(song)).renderElement();

const renderFavourites = () => {
    const favs = getFavourites();
    if (!favs) return;
    clearFavList();
    getFavourites().forEach(renderFavElement);
    addDeleteFavListener();
};


const addDeleteFavListener = () => document.querySelectorAll('.fav__card__delete')
    .forEach(el => el.addEventListener('click', deleteFavHandler));

const deleteFavHandler = e => {
    let element = e.target.classList.contains('fas') ? e.target.parentElement : e.target;
    deleteFavourite(element.dataset.id);
    renderFavourites()
};

const getRenderedSongData = function (element) {

    const id = element.dataset.id;
    let song_info = element.parentElement.previousElementSibling.firstChild.nextElementSibling.innerHTML;
    const author = song_info.match(/By:(\s\w+)/)[1];
    const url = song_info.match(/href="(.*)"/)[1];
    song_info = element.parentElement.previousElementSibling.previousElementSibling.innerHTML;

    const title = song_info.match(/alt="(.*)"/)[1];
    const cover = song_info.match(/src="(.*)"\salt/)[1];

    return { id, title, author, url, cover }
}

const addToFavourites = e => {

    let element;

    if (e.target.classList.contains('btn')) {
        element = e.target
    } else if (e.target.classList.contains('fas')) {
        element = e.target.parentElement
    }

    let favs = getFavourites();
    let newFav = getRenderedSongData(element);
    if (favs) {

        if (!favs.find(element => element.id == newFav.id)) {
            favs.push(newFav)
        }

    } else {
        favs = [newFav]
    }

    saveFavourites(favs);
    renderFavourites();
    animateToggleListButton();
}

const card_template = `
<div class="card">
<div class="card-header">
  <span class="card__title" title=":complete_title:" >:title:</span>
  <img class="card__cover" src=":cover:" alt=":complete_title:">
</div>
<div class="card-body">
  <div class="song-info"><p>By: :author:</p><p><a href=":url:">See lyrics...</a></p></div>
</div>
<div class="card__actions">
  <button class="card__fav_btn btn" data-id=":id:"><i class="fas fa-heart"></i></button>
</div>
`

const fav_list_card_template = `
<div class="fav__card" title=":complete_title:">
<a href=":url:" class="fav__card__link">
  <img class="fav__card__cover" src=":cover:" alt=":title:">
  <div class="fav__card__content">
    <div class="fav__card__title">:title:</div>
    <div class="fav__card__author">:author:</div>
  </div>
</a>
<button class="fav__card__delete" data-id=":id:">
  <i class="fas fa-minus-circle"></i>
</button>
</div>>
`;

const API_SEARCH_URL = 'https://api.genius.com/search?q=:query:&access_token=avxOODrHly0a3Jj1EBzgB0TIR-Rfcp_-laLDd5Zk5DMlslsVhuuu44jdezrvQVJo'
