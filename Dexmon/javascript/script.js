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

// Mostrar detalhes do Digimon com resumo + "Ver mais..." natural no texto
function renderizarDigimon(digimon) {
    digimonAtual = digimon.id;

    if (nome) nome.textContent = `${digimon.name} Nº ${digimon.id}`;

    if (imagem) {
        imagem.src = digimon.images?.[0]?.href || "";
        imagem.alt = digimon.name;
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

// Funções auxiliares de Favoritos (localStorage)
function obterFavoritos() {
    try {
        return JSON.parse(localStorage.getItem("digimonsFavoritos")) || [];
    } catch {
        return [];
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
}

if (btnNoturno) {
    btnNoturno.addEventListener("click", () => {
        document.body.classList.toggle("tema-escuro");
        const temaAtivo = document.body.classList.contains("tema-escuro");
        localStorage.setItem("tema", temaAtivo ? "escuro" : "claro");
    });
}

// Configurações
const btnConfiguracoes = document.getElementById("btn-configuracoes");
const painelConfiguracoes = document.getElementById("painel-configuracoes");
const fecharConfiguracoes = document.getElementById("fechar-configuracoes");

if (btnConfiguracoes && painelConfiguracoes) {
    btnConfiguracoes.addEventListener("click", () => {
        painelConfiguracoes.style.display = "flex";
    });
}

if (fecharConfiguracoes && painelConfiguracoes) {
    fecharConfiguracoes.addEventListener("click", () => {
        painelConfiguracoes.style.display = "none";
    });
}

if (painelConfiguracoes) {
    painelConfiguracoes.addEventListener("click", e => {
        if (e.target === painelConfiguracoes) {
            painelConfiguracoes.style.display = "none";
        }
    });
}

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