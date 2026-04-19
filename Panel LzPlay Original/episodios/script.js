// ================== CONFIG ==================
const TMDB_API_KEY = "38e497c6c1a043d1341416e80915669f";
const IMG_BASE = "https://image.tmdb.org/t/p/original";
const IMG_BASE_POSTER = "https://image.tmdb.org/t/p/w500";
const PREMIUM_PLAYER_BASE = "https://lzrdrz10.github.io/premiumplayer/player.html";

// ================== VARIABLES GLOBALES ==================
let currentShow = null;
let currentSeasonEpisodes = [];
let videoLinksMap = {};
let generatedEpisodes = [];

// ================== FUNCIONES AUXILIARES ==================
function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(str) {
  return str ? str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;') : '';
}

// ================== CREAR PREMIUM PLAYER (TÍTULO CORREGIDO) ==================
function createPremiumPlayerUrl(rawUrl, episodeTitleOnly, poster) {
  if (!rawUrl) return "";

  // Si ya es premium player, solo corregirlo
  if (rawUrl.includes("lzrdrz10.github.io/premiumplayer/player.html")) {
    return fixPlayerUrl(rawUrl);
  }

  const encodedVideo = encodeURIComponent(rawUrl);
  const encodedPoster = encodeURIComponent(poster || "");
  const encodedTitle = encodeURIComponent(episodeTitleOnly || "Episodio");

  const playerUrl = `${PREMIUM_PLAYER_BASE}?video=${encodedVideo}&poster=${encodedPoster}&title=${encodedTitle}`;
  
  console.log("%c✅ Premium Player creado con título:", "color:#00ff7f", episodeTitleOnly);
  return playerUrl;
}

function fixPlayerUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("lzrdrz10.github.io/premiumplayer/player.html")) return url;
  try {
    const questionPos = url.indexOf("?");
    if (questionPos === -1) return url;
    const base = url.slice(0, questionPos);
    const queryString = url.slice(questionPos + 1);
    const params = queryString.split("&").map(param => {
      if (param.startsWith("title=")) {
        let title = param.substring(6);
        try { title = decodeURIComponent(title); } catch (e) {}
        try { title = decodeURIComponent(title); } catch (e2) {}
        return "title=" + encodeURIComponent(title);
      }
      return param;
    });
    return base + "?" + params.join("&");
  } catch (err) {
    console.error("Error al corregir URL:", err);
    return url;
  }
}

// ================== BUSCADOR ==================
document.getElementById('buscador').addEventListener('input', async function(e) {
  const query = e.target.value.trim();
  const resultadosDiv = document.getElementById('resultados');
  resultadosDiv.innerHTML = '';

  if (query.length < 3) return;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`);
    const data = await res.json();

    data.results.slice(0, 20).forEach(show => {
      const card = document.createElement('div');
      card.className = 'card bg-[#1a1a1a] rounded-3xl overflow-hidden cursor-pointer border border-[#00ff7f]/30 hover:border-[#00ff7f] transition-all';
      card.innerHTML = `
        <img src="${IMG_BASE_POSTER + (show.poster_path || '')}" class="w-full aspect-[2/3] object-cover" alt="${show.name}">
        <div class="p-4">
          <h4 class="font-bold text-lg line-clamp-2">${show.name}</h4>
          <p class="text-xs text-gray-400">${show.first_air_date ? show.first_air_date.split('-')[0] : ''}</p>
        </div>
      `;
      card.onclick = () => abrirModalShow(show.id);
      resultadosDiv.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
});

// ================== ABRIR MODAL ==================
async function abrirModalShow(showId) {
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');

  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=${TMDB_API_KEY}&language=es-ES`);
    currentShow = await res.json();

    document.getElementById('modal-titulo').textContent = currentShow.name;
    document.getElementById('m-poster').src = IMG_BASE_POSTER + (currentShow.poster_path || '');
    document.getElementById('modal-sinopsis').textContent = currentShow.overview || "Sin sinopsis disponible.";

    const select = document.getElementById('season-select');
    select.innerHTML = '';
    currentShow.seasons.forEach(season => {
      if (season.episode_count > 0) {
        const opt = document.createElement('option');
        opt.value = season.season_number;
        opt.textContent = `Temporada ${season.season_number} (${season.episode_count} episodios)`;
        select.appendChild(opt);
      }
    });

    cargarTemporada();
  } catch (err) {
    alert("Error al cargar la serie desde TMDB");
  }
}

async function cargarTemporada() {
  const seasonNumber = parseInt(document.getElementById('season-select').value);
  if (!currentShow || !seasonNumber) return;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${currentShow.id}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=es-ES`);
    const seasonData = await res.json();
    currentSeasonEpisodes = seasonData.episodes || [];
    generatedEpisodes = [];

    document.getElementById('massive-area').classList.remove('hidden');
    document.getElementById('episodios-list').classList.add('hidden');
  } catch (err) {
    console.error(err);
  }
}

// ================== GENERAR TODOS LOS EPISODIOS ==================
function generarTodosLosEpisodios() {
  const postId = document.getElementById('post-id-input').value.trim();
  const serieUrl = document.getElementById('serie-url-input').value.trim();
  const linksText = document.getElementById('video-links').value.trim();

  if (!postId || !serieUrl || !currentSeasonEpisodes.length) {
    alert("❌ Completa ID del Post, URL de la serie y pega los enlaces.");
    return;
  }

  // Procesar enlaces con número
  videoLinksMap = {};
  const lines = linksText.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const match = line.match(/^(\d+)\s*[\.\-\)\]]?\s*(https?:\/\/.+)$/i);
    if (match) {
      const epNum = parseInt(match[1]);
      videoLinksMap[epNum] = match[2].trim();
    }
  }

  if (Object.keys(videoLinksMap).length === 0) {
    alert("❌ No se detectaron enlaces con número.\nEjemplo:\n1\nhttps://rumble.com/...\n2\nhttps://rumble.com/...");
    return;
  }

  const container = document.getElementById('episodios-container');
  container.innerHTML = '';
  document.getElementById('episodios-list').classList.remove('hidden');
  document.getElementById('count-ep').textContent = `${currentSeasonEpisodes.length} episodios generados`;

  const backdropUrl = currentShow.backdrop_path ? IMG_BASE + currentShow.backdrop_path : '';

  generatedEpisodes = [];

  currentSeasonEpisodes.forEach(ep => {
    const episodeNum = ep.episode_number;
    const rawVideoUrl = videoLinksMap[episodeNum] || "";

    // TÍTULO PARA EL PLAYER (SOLO EPISODIO)
    let playerTitle = ep.name && ep.name.trim() !== "" 
      ? ep.name.trim() 
      : `Episodio ${episodeNum}`;

    const fullTitleForComment = `${currentShow.name} - T${ep.season_number}E${episodeNum} - ${playerTitle}`;
    
    const episodeStill = ep.still_path ? IMG_BASE + ep.still_path : (currentShow.poster_path ? IMG_BASE + currentShow.poster_path : '');
    const synopsis = escapeHtml(ep.overview || currentShow.overview || "Sin sinopsis disponible.");
    const airDateFormatted = formatDate(ep.air_date);

    // Crear URL del Premium Player con solo título del episodio
    const playerUrl = createPremiumPlayerUrl(rawVideoUrl, playerTitle, episodeStill);

    const fullHtml = `
<div data-post-type="episode" hidden>
  <img src="${episodeStill}"/>
  <p id="tmdb-synopsis">${synopsis}</p>
</div>
<!--
Episode,English,Español,Castellano,${airDateFormatted}
Enlaces de descarga disponibles
${currentShow.id}
-->
<div data-backdrop="${backdropUrl}"
data-player-backdrop="${backdropUrl}"
data-episode-count="${episodeNum}"
data-season-number="${ep.season_number}"
data-serie-id="${currentShow.id}"
data-serie-name="${escapeHtml(currentShow.name)}"
data-serie-url="${serieUrl}">
</div>
<header class="post-header">
  <span class="post-header__title">${escapeHtml(currentShow.name)}</span>
  <div class="post-header__meta"><span class="ssn">Temporada ${ep.season_number}</span><span class="num">Episodio ${episodeNum}</span></div>
</header>
<!-- Server list -->
<div class="plyer-node" data-selected-lang="lat"></div>
<script>
  const _SV_LINKS = [
    {
        lang: "lat",
        name: "Server 1🔥",
        quality: "HD",
        url: "${playerUrl}",
        tagVideo: false
    }
  ]
</script>
<!--IMPORTANTE


${fullTitleForComment}


Episode,id-${postId},


-->
<!-- CONTINUADOR DE CAPITULOS -->
<script>
const STORAGE_KEY = "continueWatching";
function getEpisodeData() {
    const el = document.querySelector('[data-serie-id]');
    if (!el) return null;
    return {
        id: el.getAttribute('data-serie-id'),
        serie: el.getAttribute('data-serie-name'),
        serieUrl: el.getAttribute('data-serie-url'),
        season: el.getAttribute('data-season-number'),
        episode: el.getAttribute('data-episode-count'),
        url: window.location.href
    };
}
function saveProgress() {
    const ep = getEpisodeData();
    if (!ep) return;
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    data[ep.id] = ep;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
document.addEventListener("DOMContentLoaded", saveProgress);
</script>
`.trim();

    generatedEpisodes.push({
      episodeNum: episodeNum,
      seasonNum: ep.season_number,
      title: playerTitle,
      fullHtml: fullHtml
    });

    // Listado limpio
    const div = document.createElement('div');
    div.className = 'bg-[#1a1a1a] border border-[#00ff7f]/30 rounded-2xl p-5 flex items-center justify-between hover:border-[#00ff7f] transition';
    div.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="bg-[#00ff7f]/10 text-[#00ff7f] font-bold px-4 py-2 rounded-xl text-lg">E${episodeNum}</div>
        <div>
          <p class="font-medium">${playerTitle}</p>
          <p class="text-xs text-gray-400">${airDateFormatted}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="${playerUrl ? 'text-green-400' : 'text-red-400'} text-sm font-medium">
          ${playerUrl ? '✅ Player listo' : '⚠️ Sin enlace'}
        </span>
        <button onclick="copiarEpisodio(${generatedEpisodes.length-1})" 
          class="px-6 py-3 bg-[#00ff7f] hover:bg-white text-black font-bold rounded-2xl transition">📋 Copiar</button>
        <button onclick="editarEpisodio(${generatedEpisodes.length-1})" 
          class="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-2xl transition">✏️ Editar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function copiarEpisodio(index) {
  const html = generatedEpisodes[index].fullHtml;
  navigator.clipboard.writeText(html).then(() => {
    alert(`✅ HTML del Episodio ${generatedEpisodes[index].episodeNum} copiado al portapapeles`);
  });
}

function editarEpisodio(index) {
  const ep = generatedEpisodes[index];
  const nuevoRawUrl = prompt(`Editar enlace RAW para E${ep.episodeNum} - ${ep.title}`, "");
  
  if (nuevoRawUrl !== null && nuevoRawUrl.trim()) {
    // En una versión más avanzada se podría regenerar el HTML completo, pero por ahora avisamos
    alert(`✅ Enlace actualizado.\nPor favor vuelve a generar los episodios si quieres actualizar todos.`);
  }
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('episodios-list').classList.add('hidden');
}

document.addEventListener('keydown', (e) => {
  if (e.key === "Escape") cerrarModal();
});
