 const PREMIUM_PLAYER_BASE = "https://lzrdrz10.github.io/premiumplayer/player.html";
   
    // ================== ELEMENTOS ==================
    const modal = document.getElementById("modal");
    const modalTitulo = document.getElementById("modal-titulo");
    const videoLink = document.getElementById("videoLink");
    const downloadLinkInput = document.getElementById("downloadLink");
    const platformsContainer = document.getElementById("platforms-container");
    const tagsContainer = document.getElementById("tags-container");
    const newTagInput = document.getElementById("new-tag");
    const addTagBtn = document.getElementById("add-tag-btn");
    const publicarBtn = document.getElementById("publicarBtn");
    const animacion = document.getElementById("animacionPublicar");
    const progreso = document.getElementById("progreso");

    let seleccionado = null;
    let currentTags = [];
    let selectedPlatforms = [];
    let generatedCode = "";

    const availablePlatforms = [
      "Sin Plataforma", "Prime Video", "Apple TV", "HBO Max", "Disney", "Disney JR", "Pixar", "Netflix", "Apple tv",
      "Fox", "Paramount", "Sony", "Sony Animations", "Universal", "Warner Bros", "Marvel", "Marvel JR", "Lego", "DC Comics", "LionsGate",
      "Navidad", "DreamWorks", "Cine Cristiano", "Cartoon Networks", "Nickelodeon", "Vix", "K-Drama", "Anime"
    ];

    // ================== AUTO-FIX PREMIUM PLAYER ==================
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
        const fixedUrl = base + "?" + params.join("&");
        if (fixedUrl !== url) console.log("%c✅ Enlace premiumplayer corregido", "color:#00ff7f;font-weight:bold", fixedUrl);
        return fixedUrl;
      } catch (err) {
        console.error("Error al corregir URL:", err);
        return url;
      }
    }

    videoLink.addEventListener("input", () => { videoLink.value = fixPlayerUrl(videoLink.value); });
    videoLink.addEventListener("paste", () => { setTimeout(() => { videoLink.value = fixPlayerUrl(videoLink.value); }, 10); });

    // ================== SIMPLIFICAR TÍTULOS (para títulos alternativos) ==================
    function simplifyTitle(title) {
      let noAccents = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      let variants = [noAccents];
      let noHyphen = noAccents.replace(/-/g, '');
      if (noHyphen !== noAccents) variants.push(noHyphen);
      let withSpace = noAccents.replace(/-/g, ' ');
      if (withSpace !== noAccents) variants.push(withSpace);
      if (title.includes(':')) {
        let afterColon = title.split(':')[1].trim();
        let simpAfter = afterColon.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        variants.push(simpAfter);
        let cleanAfter = simpAfter.replace(/[¿?¡!]/g, '').trim();
        if (cleanAfter !== simpAfter) variants.push(cleanAfter);
      }
      let noSpecial = noAccents.replace(/[^a-z0-9 ]/g, '');
      if (noSpecial !== noAccents) variants.push(noSpecial);
      let singularVariants = [];
      variants.forEach(v => {
        let words = v.split(' ');
        let newWords = words.map(w => (w.length > 2 && w.endsWith('s')) ? w.slice(0, -1) : w);
        let sing = newWords.join(' ');
        if (sing !== v) singularVariants.push(sing);
      });
      variants.push(...singularVariants);
      let pluralVariants = [];
      variants.forEach(v => {
        let words = v.split(' ');
        let newWords = words.map(w => (w.length > 2 && !w.endsWith('s')) ? w + 's' : w);
        let plur = newWords.join(' ');
        if (plur !== v) pluralVariants.push(plur);
      });
      variants.push(...pluralVariants);
      let individualWords = new Set();
      variants.forEach(v => {
        v.split(' ').forEach(word => {
          if (word.length > 1) {
            individualWords.add(word);
            if (word.length > 2 && word.endsWith('s')) individualWords.add(word.slice(0, -1));
            else if (word.length > 2) individualWords.add(word + 's');
          }
        });
      });
      variants.push(...individualWords);
      return [...new Set(variants)];
    }

    // ================== PLATAFORMAS Y GÉNEROS ==================
    function renderPlatforms() {
      platformsContainer.innerHTML = "";
      availablePlatforms.forEach(plataforma => {
        const chip = document.createElement("div");
        chip.className = `chip px-6 py-3 rounded-full text-sm font-medium cursor-pointer border border-[#00ff7f]/30 ${selectedPlatforms.includes(plataforma) ? 'chip-active' : 'bg-[#1a1a1a]'}`;
        chip.textContent = plataforma;
        chip.onclick = () => {
          if (selectedPlatforms.includes(plataforma)) selectedPlatforms = selectedPlatforms.filter(p => p !== plataforma);
          else selectedPlatforms.push(plataforma);
          renderPlatforms();
        };
        platformsContainer.appendChild(chip);
      });
    }

    function renderTags() {
      tagsContainer.innerHTML = "";
      currentTags.forEach((tag, i) => {
        const chip = document.createElement("div");
        chip.className = "chip flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#1a1a1a] cursor-pointer";
        chip.innerHTML = `${tag} <span class="text-red-400 text-xl">×</span>`;
        chip.onclick = (e) => { if (e.target.tagName === "SPAN") { currentTags.splice(i, 1); renderTags(); } };
        tagsContainer.appendChild(chip);
      });
    }

    addTagBtn.onclick = () => {
      const val = newTagInput.value.trim();
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        renderTags();
        newTagInput.value = "";
      }
    };

    // ================== ABRIR MODAL MANUAL ==================
    function openManualModal() {
      modal.classList.remove("hidden");
      modal.classList.add("flex");

      // Limpiar todo
      document.getElementById("manual-titulo").value = "";
      document.getElementById("manual-year").value = "";
      document.getElementById("manual-original").value = "";
      document.getElementById("manual-sinopsis").value = "";
      document.getElementById("manual-duration").value = "120";
      document.getElementById("manual-release").value = "";
      document.getElementById("manual-trailer").value = "";
      document.getElementById("manual-tmdb-id").value = "";
      document.getElementById("manual-backdrop").value = "";
      document.getElementById("manual-poster").value = "";
      document.getElementById("manual-poster-preview").src = "https://via.placeholder.com/300x450/111/00ff7f?text=POSTER";

      videoLink.value = "";
      downloadLinkInput.value = "";

      selectedPlatforms = ["Sin Plataforma"];
      currentTags = [];
      renderPlatforms();
      renderTags();

      modalTitulo.textContent = "Nueva Película - Ingresa los datos manualmente";

      // Reset a modo formulario
      document.getElementById('form-area').classList.remove('hidden');
      document.getElementById('success-area').classList.add('hidden');
      seleccionado = null;
    }

    // ================== GENERAR CÓDIGO (100% MANUAL) ==================
    publicarBtn.onclick = () => {
      if (!document.getElementById("manual-titulo").value.trim()) {
        alert("❌ Por favor ingresa al menos el título de la película");
        return;
      }
      animacion.classList.remove("hidden");
      progreso.style.width = "0%";
      let percent = 0;
      const int = setInterval(() => {
        percent += 18 + Math.random() * 15;
        if (percent > 100) percent = 100;
        progreso.style.width = percent + "%";
        if (percent >= 100) {
          clearInterval(int);
          generarCodigo();
        }
      }, 90);
    };

    function generarCodigo() {
      // === RECOGER TODOS LOS DATOS MANUALES ===
      const titulo = document.getElementById("manual-titulo").value.trim();
      const year = document.getElementById("manual-year").value.trim() || "—";
      const originalTitle = document.getElementById("manual-original").value.trim() || titulo;
      const sinopsis = document.getElementById("manual-sinopsis").value.trim() || "Sin sinopsis";
      const runtime = parseInt(document.getElementById("manual-duration").value) || 120;
      const releaseDate = document.getElementById("manual-release").value || "";
      const trailerId = document.getElementById("manual-trailer").value.trim() || "__ID_YOUTUBE__";
      const tmdbId = document.getElementById("manual-tmdb-id").value.trim() || "0";
      const poster = document.getElementById("manual-poster").value.trim() || "https://via.placeholder.com/300x450/111/00ff7f?text=NO+POSTER";
      const backdrop = document.getElementById("manual-backdrop").value.trim() || poster;

      // Crear objeto seleccionado igual que antes
      seleccionado = {
        id: parseInt(tmdbId) || 0,
        titulo: titulo,
        year: year,
        poster: poster,
        backdrop: backdrop,
        sinopsis: sinopsis,
        originalTitle: originalTitle,
        runtime: runtime,
        voto: 0,
        releaseDate: releaseDate,
        trailerId: trailerId
      };

      // Títulos alternativos (usa la misma lógica inteligente)
      let altList = new Set([titulo, originalTitle, `${titulo} (${year})`]);
      simplifyTitle(titulo).forEach(s => altList.add(s));
      if (originalTitle !== titulo) simplifyTitle(originalTitle).forEach(s => altList.add(s));
      seleccionado.alternativeTitles = [...new Set([...altList, ...'abcdefghijklmnopqrstuvwxyz'.split(''), seleccionado.id.toString()])];

      // === GENERAR EL CÓDIGO (igual que antes) ===
      const plataformasStr = selectedPlatforms.length ? selectedPlatforms.join(",") : "Sin Plataforma";
      const categorias = `${plataformasStr},Movie,${currentTags.join(",")}`;
     
      let rawVideoInput = videoLink.value.trim();
      let videoUrl = "__ENLACE_DE_VIDEO__";
      if (rawVideoInput) {
        if (rawVideoInput.includes("lzrdrz10.github.io/premiumplayer/player.html")) {
          videoUrl = fixPlayerUrl(rawVideoInput);
        } else {
          const posterHorizontal = seleccionado.backdrop || seleccionado.poster;
          const encodedVideo = encodeURIComponent(rawVideoInput);
          const encodedPoster = encodeURIComponent(posterHorizontal);
          const encodedTitle = encodeURIComponent(seleccionado.titulo);
          videoUrl = `${PREMIUM_PLAYER_BASE}?video=${encodedVideo}&poster=${encodedPoster}&title=${encodedTitle}`;
          console.log("%c✅ Premium Player auto-generado", "color:#00ff7f;font-weight:bold", videoUrl);
        }
      }

      const titulosAlternos = seleccionado.alternativeTitles.join('\n');
      const durationStr = seleccionado.runtime ? `${seleccionado.runtime} minutes` : "120 minutes";
      const genresStr = currentTags.join(", ");

      generatedCode = `
<div data-post-type="movie" hidden>
  <img src="${seleccionado.poster}"/>
  <p id="tmdb-synopsis">${seleccionado.sinopsis}</p>
</div>
<!--more-->
<div class="headline is-small mb-4">
  <h2 class="headline__title">Información</h2>
</div>
<ul class="post-details mb-4"
  data-youtube-id="${seleccionado.trailerId}"
  data-backdrop="${seleccionado.backdrop}"
  data-player-backdrop="${seleccionado.backdrop}"
  data-imdb="${seleccionado.voto.toFixed(1)}">
  <li data="${seleccionado.titulo}"><span>Título</span>${seleccionado.titulo}</li>
  <li data-original-title="${originalTitle}"><span>Título original</span>${originalTitle}</li>
  <li data-duration="${durationStr}"><span>Duración</span>${durationStr}</li>
  <li data-year="${seleccionado.year}"><span>Año</span>${seleccionado.year}</li>
  <li data-release-date="${seleccionado.releaseDate}"><span>Fecha de lanzamiento:</span>${seleccionado.releaseDate}</li>
  <li data-genres="${genresStr}"><span>Géneros</span>${genresStr}</li>
</ul>
<div class="plyer-node" data-selected-lang="lat"></div>
<div class="plyer-node" data-selected-lang="sub"></div>
<script>
  const _SV_LINKS = [
    {
        lang: "lat",
        name: "🔥SERVER VIP🔥 ",
        quality: "HD",
        url: "${videoUrl}",
        tagVideo: false
    }
  ]
<\/script>
<!-- TÍTULOS ALTERNATIVOS -->
<p style="display:none;">
${seleccionado.year}
${titulosAlternos}
</p>
<!--EXTRAS DATOS
${seleccionado.titulo}
${seleccionado.year},${categorias},
-->`.trim();

      // Mostrar pantalla de éxito
      animacion.classList.add("hidden");
      document.getElementById('form-area').classList.add('hidden');
      document.getElementById('success-area').classList.remove('hidden');
    }

    // ================== FUNCIONES DEL ÉXITO ==================
    function copyGeneratedCode() {
      if (!generatedCode) return;
      navigator.clipboard.writeText(generatedCode).then(() => {
        const btn = document.getElementById('copy-success-btn');
        const original = btn.innerHTML;
        btn.innerHTML = "✅ COPIADO AL PORTAPAPELES!";
        btn.style.background = "#00ff7f";
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = "";
        }, 2200);
      });
    }

    function downloadGeneratedCode() {
      if (!generatedCode) return;
      const blob = new Blob([generatedCode], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (seleccionado ? seleccionado.titulo.replace(/[^a-z0-9]/gi, "_") : "pelicula") + ".html";
      a.click();
    }

    function previewGeneratedCode() {
      if (!generatedCode) return;
      const win = window.open();
      win.document.write(generatedCode);
      win.document.close();
    }

    function resetModalForNewMovie() {
      // Resetea el formulario y vuelve al modo manual
      openManualModal();
    }

    // ================== AUXILIARES ==================
    function cerrarModal() {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarModal(); });

    // ================== PREVIEW EN VIVO DEL POSTER ==================
    function initLivePreview() {
      const posterInput = document.getElementById('manual-poster');
      const posterPreview = document.getElementById('manual-poster-preview');
      posterInput.addEventListener('input', () => {
        posterPreview.src = posterInput.value.trim() || "https://via.placeholder.com/300x450/111/00ff7f?text=POSTER";
      });

      // Título en vivo en el header del modal
      const tituloInput = document.getElementById('manual-titulo');
      tituloInput.addEventListener('input', () => {
        if (tituloInput.value.trim()) {
          modalTitulo.textContent = tituloInput.value.trim();
        }
      });
    }

    // ================== INICIO ==================
    window.onload = () => {
      initLivePreview();
      console.log("%c✅ PANEL LZPLAY MANUAL listo - Ahora todo es manual. ¡Disfruta!", "color:#00ff7f; font-size:18px");
    };
 