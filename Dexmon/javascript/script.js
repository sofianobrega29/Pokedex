// javascript/script.js

const API_URL = "https://digi-api.com/api/v1/digimon";

let digimonAtual = 1;
let controleBusca = 0;
let listaOrdenadaCache = [];
let listaExibidaAtual = [];
let ordemCrescente = true;
let exibindoFavoritos = false;

const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("bnt-search");
const btnRandom = document.getElementById("bnt-random");
const btnOrdenarAlfabetica = document.getElementById("btn-ordenar-alfabetica");
const btnFavoritos = document.getElementById("btn-favoritos");
const listaDigimons = document.getElementById("lista-digimons");

const nome = document.getElementById("nome");
const imagem = document.getElementById("imagem");
const tipo = document.getElementById("tipo");
const nivel = document.getElementById("nivel");
const atributo = document.getElementById("atributo");
const descricao = document.getElementById("descricao");
const habilidades = document.getElementById("habilidades");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

// Garante que o fundo da área da imagem acompanhe o card tanto no modo claro quanto no escuro
function injetarEstilosFundoImagem() {
    if (document.getElementById("estilo-fundo-imagem-tema")) return;

    const style = document.createElement("style");
    style.id = "estilo-fundo-imagem-tema";
    style.textContent = `
        body:not(.tema-escuro) .imagem-card {
            background-color: #ffffff !important;
        }
        body.tema-escuro .imagem-card {
            background-color: transparent !important;
        }
        body.tema-escuro .imagem-card img,
        body.tema-escuro .imagem-digimon img {
            border-radius: 12px;
        }
    `;
    document.head.appendChild(style);
}

injetarEstilosFundoImagem();

// Cache de imagens com fundo branco removido para o Modo Noturno
const cacheImagensTransparentes = new Map();

function removerFundoBrancoImagem(imgElement) {
    if (!imgElement || !imgElement.src) return;

    const urlOriginal = imgElement.dataset.originalSrc || imgElement.src;
    if (!urlOriginal || urlOriginal.startsWith("data:")) return;

    imgElement.dataset.originalSrc = urlOriginal;

    if (!document.body.classList.contains("tema-escuro")) {
        if (imgElement.src !== urlOriginal) {
            imgElement.src = urlOriginal;
        }
        return;
    }

    if (cacheImagensTransparentes.has(urlOriginal)) {
        const cached = cacheImagensTransparentes.get(urlOriginal);
        if (cached && imgElement.src !== cached) {
            imgElement.src = cached;
        }
        return;
    }

    const tempImg = new Image();
    tempImg.crossOrigin = "Anonymous";

    tempImg.onload = () => {
        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = tempImg.naturalWidth || tempImg.width;
            canvas.height = tempImg.naturalHeight || tempImg.height;

            ctx.drawImage(tempImg, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Torna pixels brancos / quase brancos transparentes
                if (r > 240 && g > 240 && b > 240) {
                    data[i + 3] = 0;
                } else if (r > 220 && g > 220 && b > 220) {
                    const media = (r + g + b) / 3;
                    const fator = (245 - media) / 25;
                    data[i + 3] = Math.max(0, Math.min(255, Math.round(data[i + 3] * fator)));
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const dataUrl = canvas.toDataURL("image/png");
            cacheImagensTransparentes.set(urlOriginal, dataUrl);

            if (document.body.classList.contains("tema-escuro")) {
                imgElement.src = dataUrl;
            }
        } catch {
            cacheImagensTransparentes.set(urlOriginal, null);
        }
    };

    tempImg.onerror = () => {
        cacheImagensTransparentes.set(urlOriginal, null);
    };

    tempImg.src = urlOriginal;
}

function atualizarTodasImagensTema() {
    document.querySelectorAll(".imagem-card img, #imagem").forEach(img => {
        removerFundoBrancoImagem(img);
    });
}

// Observa novas imagens carregadas na lista para aplicar o recorte no modo noturno
const observadorImagens = new MutationObserver(() => {
    if (document.body.classList.contains("tema-escuro")) {
        atualizarTodasImagensTema();
    }
});

if (listaDigimons) {
    observadorImagens.observe(listaDigimons, { childList: true, subtree: true });
}

// Menu lateral
if (btnMenu && menu) {
    btnMenu.addEventListener("click", () => {
        menu.classList.toggle("recolhida");
    });
}

// Ordenar Digimons de A-Z ou Z-A
function ordernarDigimonsAlfabeticamente(lista, crescente = true) {
    return [...lista].sort((a, b) => {
        const comparacao = (a.name || "").localeCompare(b.name || "", "pt-BR", {
            sensitivity: "base"
        });
        return crescente ? comparacao : -comparacao;
    });
}

// Evento do Botão de Ordem Alfabética
if (btnOrdenarAlfabetica) {
    btnOrdenarAlfabetica.addEventListener("click", () => {
        if (!listaDigimons || listaExibidaAtual.length === 0) return;

        ordemCrescente = !ordemCrescente;

        const listaReordenada = ordernarDigimonsAlfabeticamente(
            listaExibidaAtual,
            ordemCrescente
        );

        listaExibidaAtual = listaReordenada;
        listaDigimons.innerHTML = listaReordenada
            .map(criarCardDigimon)
            .join("");

        const icone = ordemCrescente ? "fa-arrow-down-a-z" : "fa-arrow-up-z-a";
        const texto = ordemCrescente ? "Ordem: A-Z" : "Ordem: Z-A";
        btnOrdenarAlfabetica.innerHTML = `<i class="fa-solid ${icone}"></i><span>${texto}</span>`;
    });
}

// Funções auxiliares de Favoritos (localStorage)
function obterFavoritos() {
    try {
        return JSON.parse(localStorage.getItem("digimonsFavoritos")) || [];
    } catch {
        return [];
    }
}

function salvarFavoritos(lista) {
    localStorage.setItem("digimonsFavoritos", JSON.stringify(lista));
}

function estaFavoritado(id) {
    return obterFavoritos().some(item => Number(item.id) === Number(id));
}

function alternarFavorito(digimon) {
    const favoritos = obterFavoritos();
    const indice = favoritos.findIndex(item => Number(item.id) === Number(digimon.id));

    if (indice >= 0) {
        favoritos.splice(indice, 1);
    } else {
        favoritos.push({
            id: digimon.id,
            name: digimon.name,
            image: digimon.images?.[0]?.href || digimon.image || "",
            images: digimon.images || []
        });
    }

    salvarFavoritos(favoritos);
    return indice < 0;
}

// Obter descrição direta da API
function obterDescricao(digimon) {
    const descricoes = digimon.descriptions || [];

    if (descricoes.length === 0) {
        return "Descrição não disponível.";
    }

    const ingles = descricoes.find(item => {
        const idioma = typeof item.language === "string"
            ? item.language
            : [item.language?.language, item.language?.code, item.language?.name].filter(Boolean).join(" ");
        return /en|english/i.test(idioma);
    });

    return ingles?.description || descricoes[0]?.description || "Descrição não disponível.";
}

// Mostrar detalhes do Digimon com botão de Favoritar + resumo com "Ver mais..."
function renderizarDigimon(digimon) {
    digimonAtual = digimon.id;

    if (nome) {
        nome.innerHTML = "";

        const spanTitulo = document.createElement("span");
        spanTitulo.textContent = `${digimon.name} Nº ${digimon.id}`;

        const btnFav = document.createElement("button");
        btnFav.type = "button";
        btnFav.id = "btn-favoritar-digimon";
        btnFav.className = "btn-favoritar-digimon";

        const atualizarVisualBotaoFavorito = () => {
            const ativo = estaFavoritado(digimon.id);
            btnFav.classList.toggle("favoritado", ativo);
            btnFav.innerHTML = ativo ? "&#10084; Favoritado" : "&#9825; Favoritar";
            btnFav.title = ativo ? "Remover dos favoritos" : "Adicionar aos favoritos";
        };

        atualizarVisualBotaoFavorito();

        btnFav.addEventListener("click", () => {
            alternarFavorito(digimon);
            atualizarVisualBotaoFavorito();
        });

        nome.appendChild(spanTitulo);
        nome.appendChild(btnFav);
    }

    if (imagem) {
        const urlFoto = digimon.images?.[0]?.href || "";
        imagem.dataset.originalSrc = urlFoto;
        imagem.src = urlFoto;
        imagem.alt = digimon.name;
        removerFundoBrancoImagem(imagem);
    }

    if (tipo) tipo.textContent = digimon.types?.[0]?.type || "-";
    if (nivel) nivel.textContent = digimon.levels?.[0]?.level || "-";
    if (atributo) atributo.textContent = digimon.attributes?.[0]?.attribute || "-";

    if (descricao) {
        const textoCompleto = obterDescricao(digimon);
        const limiteCaracteres = 180;

        if (textoCompleto.length > limiteCaracteres) {
            const textoResumido = textoCompleto.slice(0, limiteCaracteres).trim() + "... ";
            let expandido = false;

            const atualizarTextoDescricao = () => {
                descricao.innerHTML = "";

                const spanTexto = document.createElement("span");
                spanTexto.textContent = expandido ? textoCompleto + " " : textoResumido;

                const btnVerMais = document.createElement("span");
                btnVerMais.className = "btn-ver-mais";
                btnVerMais.role = "button";
                btnVerMais.tabIndex = 0;
                btnVerMais.textContent = expandido ? "Ver menos" : "Ver mais...";

                const alternar = () => {
                    expandido = !expandido;
                    atualizarTextoDescricao();
                };

                btnVerMais.addEventListener("click", alternar);
                btnVerMais.addEventListener("keypress", e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        alternar();
                    }
                });

                descricao.appendChild(spanTexto);
                descricao.appendChild(btnVerMais);
            };

            atualizarTextoDescricao();
        } else {
            descricao.textContent = textoCompleto;
        }
    }

    if (habilidades) {
        const listaHabilidades = (digimon.skills || []).map(s => s.skill);
        habilidades.textContent = listaHabilidades.length
            ? listaHabilidades.join("; ")
            : "Nenhuma habilidade cadastrada.";
    }

    if (listaDigimons && !nome) {
        listaExibidaAtual = [digimon];
        listaDigimons.innerHTML = criarCardDigimon(digimon);
    }
}

// Criar card
function criarCardDigimon(digimon) {
    const foto = digimon.images?.[0]?.href || digimon.image || "";

    return `
        <a class="caixa" href="card.html?id=${digimon.id}">
            <div class="imagem-card">
                <img src="${foto}" alt="${digimon.name}" loading="lazy">
            </div>
            <h3>${digimon.name}</h3>
            <span class="numero-card">Nº ${digimon.id}</span>
        </a>
    `;
}

// Obter TODOS os Digimons da API e ordenar de A-Z
async function obterListaOrdenada() {
    if (listaOrdenadaCache.length > 0) {
        return listaOrdenadaCache;
    }

    const resposta = await fetch(`${API_URL}?page=0&pageSize=2000`);

    if (!resposta.ok) {
        throw new Error("Erro ao carregar digimons.");
    }

    const dados = await resposta.json();
    let todosDigimons = dados.content || dados.data || [];

    const totalPaginas = dados.pageable?.totalPages || 1;
    if (totalPaginas > 1) {
        const promessasPaginas = [];
        for (let pagina = 1; pagina < totalPaginas; pagina++) {
            promessasPaginas.push(
                fetch(`${API_URL}?page=${pagina}&pageSize=${todosDigimons.length}`)
                    .then(res => res.ok ? res.json() : null)
            );
        }

        const resultados = await Promise.all(promessasPaginas);
        resultados.forEach(pag => {
            if (pag?.content) {
                todosDigimons = todosDigimons.concat(pag.content);
            }
        });
    }

    listaOrdenadaCache = ordernarDigimonsAlfabeticamente(todosDigimons, true);
    return listaOrdenadaCache;
}

// Carregar TODOS os Digimons na tela inicial em Ordem Alfabética
async function carregarDigimonsAleatorios() {
    if (!listaDigimons) return;

    exibindoFavoritos = false;
    ordemCrescente = true;

    if (btnOrdenarAlfabetica) {
        btnOrdenarAlfabetica.innerHTML = `<i class="fa-solid fa-arrow-down-a-z"></i><span>Ordem: A-Z</span>`;
    }

    listaDigimons.innerHTML = `
        <p class="carregando">Carregando todos os Digimons...</p>
    `;

    try {
        const todosOrdenados = await obterListaOrdenada();

        if (todosOrdenados.length === 0) {
            throw new Error("Digimons insuficientes.");
        }

        listaExibidaAtual = todosOrdenados;

        listaDigimons.innerHTML = todosOrdenados
            .map(criarCardDigimon)
            .join("");

    } catch (erro) {
        console.error(erro);

        listaDigimons.innerHTML = `
            <div class="mensagem-erro">
                <h3>Não foi possível carregar os Digimons</h3>
                <p>Verifique sua conexão com a internet.</p>
                <button class="botao-tentar" onclick="carregarDigimonsAleatorios()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

function mostrarFavoritos() {
    if (!listaDigimons) {
        window.location.href = "index.html?favoritos=1";
        return;
    }

    exibindoFavoritos = true;
    ordemCrescente = true;

    if (btnOrdenarAlfabetica) {
        btnOrdenarAlfabetica.innerHTML = `<i class="fa-solid fa-arrow-down-a-z"></i><span>Ordem: A-Z</span>`;
    }

    const favoritos = ordernarDigimonsAlfabeticamente(obterFavoritos(), true);
    listaExibidaAtual = favoritos;

    if (favoritos.length === 0) {
        listaDigimons.innerHTML = `
            <div class="mensagem-erro">
                <h3>Nenhum favorito ainda</h3>
                <p>Abra o cartão de um Digimon e clique em "Favoritar" para salvá-lo aqui.</p>
                <button class="botao-tentar" onclick="carregarDigimonsAleatorios()">
                    Ver todos os Digimons (A–Z)
                </button>
            </div>
        `;
        return;
    }

    listaDigimons.innerHTML = favoritos
        .map(criarCardDigimon)
        .join("");
}

if (btnFavoritos) {
    btnFavoritos.addEventListener("click", mostrarFavoritos);
}

// Buscar Digimon
async function buscarDigimon(termoOuId) {
    const termo = termoOuId.toString().trim();

    if (!termo) return;

    const busca = ++controleBusca;

    try {
        if (listaDigimons && !nome && isNaN(Number(termo))) {
            const lista = await obterListaOrdenada();
            const filtrados = ordernarDigimonsAlfabeticamente(
                lista.filter(d =>
                    d.name.toLowerCase().includes(termo.toLowerCase())
                ),
                ordemCrescente
            );

            if (filtrados.length > 0) {
                listaExibidaAtual = filtrados;
                listaDigimons.innerHTML = filtrados
                    .map(criarCardDigimon)
                    .join("");
                return;
            }
        }

        const resposta = await fetch(`${API_URL}/${encodeURIComponent(termo)}`);

        if (!resposta.ok) {
            throw new Error("Digimon não encontrado.");
        }

        const digimon = await resposta.json();

        if (busca !== controleBusca) return;

        renderizarDigimon(digimon);

    } catch (erro) {
        console.error(erro);

        if (busca !== controleBusca) return;

        if (listaDigimons && !nome) {
            listaExibidaAtual = [];
            listaDigimons.innerHTML = `
                <div class="mensagem-erro">
                    <h3>Digimon não encontrado</h3>
                    <p>Tente pesquisar por outro nome ou ID.</p>
                </div>
            `;
        }

        if (nome) {
            nome.textContent = "Não encontrado";
            if (descricao) {
                descricao.textContent = "Digimon não encontrado.";
            }
        }
    }
}

// Me Surpreenda
function meSurpreenda() {
    buscarDigimon(Math.floor(Math.random() * 1400) + 1);

    if (searchInput) {
        searchInput.value = "";
    }
}

// Eventos da busca
if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", () => {
        buscarDigimon(searchInput.value);
    });

    searchInput.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            buscarDigimon(searchInput.value);
        }
    });
}

if (btnRandom) {
    btnRandom.addEventListener("click", meSurpreenda);
}

// Navegação entre Digimons
if (btnAnterior) {
    btnAnterior.addEventListener("click", () => {
        if (digimonAtual > 1) {
            buscarDigimon(digimonAtual - 1);
        }
    });
}

if (btnProximo) {
    btnProximo.addEventListener("click", () => {
        buscarDigimon(digimonAtual + 1);
    });
}

// Inicialização
const urlParams = new URLSearchParams(window.location.search);
const idUrl = urlParams.get("id");
const abrirFavoritosUrl = urlParams.get("favoritos");

if (idUrl) {
    digimonAtual = parseInt(idUrl, 10);
}

if (nome) {
    buscarDigimon(digimonAtual);
} else if (listaDigimons) {
    if (abrirFavoritosUrl === "1") {
        mostrarFavoritos();
    } else {
        carregarDigimonsAleatorios();
    }
}

// Botão início
const btnInicio = document.getElementById("btn-inicio");

if (btnInicio) {
    btnInicio.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

// Tema noturno
const btnNoturno = document.getElementById("btn-noturno");

if (localStorage.getItem("tema") === "escuro") {
    document.body.classList.add("tema-escuro");
    atualizarTodasImagensTema();
}

if (btnNoturno) {
    btnNoturno.addEventListener("click", () => {
        document.body.classList.toggle("tema-escuro");
        const temaAtivo = document.body.classList.contains("tema-escuro");
        localStorage.setItem("tema", temaAtivo ? "escuro" : "claro");
        atualizarTodasImagensTema();
    });
}

// Configurações (garante o texto completo incluindo "Objetivo" em TODAS as páginas)
function garantirPainelConfiguracoes() {
    let painel = document.getElementById("painel-configuracoes");

    const conteudoCompletoHTML = `
        <div class="conteudo-configuracoes" style="position:relative; width:400px; max-width:85%; max-height:85vh; overflow-y:auto; padding:30px; background-color:white; border-radius:15px; text-align:center; color:#0b2238; box-shadow:0 10px 30px rgba(0,0,0,0.4);">
            <button id="fechar-configuracoes" class="fechar-configuracoes" style="position:absolute; top:10px; right:12px; border:none; background:none; font-size:20px; font-weight:bold; color:#0b2238; cursor:pointer;">X</button>

            <h2 style="margin:0 0 14px; color:#0b2238; font-size:1.5rem;">Sobre o Dexmon</h2>
            <p style="margin:0; line-height:1.5; font-size:0.95rem; color:#1a202c;">
                Sobre o projeto - Digimon Explorer <br>
                É um site interativo desenvolvido para pesquisar e conhecer o universo dos Digimons. Explore informações, características, evoluções e curiosidades de diversas criaturas digitais em um ambiente simples, intuitivo e funcional.
                <br><br>
                <strong>Equipe:</strong><br>
                - Shara Jayane<br>
                - Maria Clara<br>
                - Sofia Sabina<br>
                - Nataniel Lucena
                <br><br>
                <strong>Informações acadêmicas:</strong><br>
                Instituição: IFRN – Campus Caicó<br>
                Curso: Técnico em Informática para Internet<br>
                Turma: 2º ano<br>
                Professor: Dr. Thales Aguiar
                <br><br>
                <strong>Objetivo:</strong><br>
                Aplicar os conhecimentos de desenvolvimento web na criação de uma plataforma de pesquisa organizada, acessível e interativa.
            </p>
        </div>
    `;

    if (!painel) {
        const modalHTML = `
            <div id="painel-configuracoes" class="painel-configuracoes" style="display:none; position:fixed; inset:0; background-color:rgba(0,0,0,0.7); justify-content:center; align-items:center; z-index:9999;">
                ${conteudoCompletoHTML}
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        painel = document.getElementById("painel-configuracoes");
    } else {
        painel.style.zIndex = "9999";
        painel.innerHTML = conteudoCompletoHTML;
    }

    return painel;
}

document.addEventListener("DOMContentLoaded", garantirPainelConfiguracoes);
garantirPainelConfiguracoes();

document.addEventListener("click", e => {
    const painel = garantirPainelConfiguracoes();

    if (e.target.id === "fechar-configuracoes" || e.target === painel) {
        painel.style.display = "none";
        return;
    }

    const clicouPorId = e.target.closest("#btn-configuracoes");
    const itemMenu = e.target.closest(".menu-item, button, a, div");
    const clicouPorTexto =
        itemMenu &&
        itemMenu.textContent &&
        itemMenu.textContent.trim().toLowerCase() === "configurações";

    if (clicouPorId || clicouPorTexto) {
        e.preventDefault();
        painel.style.display = "flex";
    }
});

// Botão Digimon aleatório
const btnDigimonAleatorio = document.getElementById("btn-digimon-aleatorio");

if (btnDigimonAleatorio) {
    btnDigimonAleatorio.addEventListener("click", async () => {
        btnDigimonAleatorio.disabled = true;
        btnDigimonAleatorio.innerHTML = "Sorteando...";

        try {
            const listaCompleta = await obterListaOrdenada();

            if (listaCompleta.length === 0) {
                throw new Error("Nenhum Digimon encontrado.");
            }

            const aleatorio = listaCompleta[Math.floor(Math.random() * listaCompleta.length)];
            window.location.href = `card.html?id=${aleatorio.id}`;

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível sortear um Digimon.");

            btnDigimonAleatorio.disabled = false;
            btnDigimonAleatorio.innerHTML =
                '<i class="fa-solid fa-dice"></i> Encontrar Digimon Aleatório';
        }
    });
}