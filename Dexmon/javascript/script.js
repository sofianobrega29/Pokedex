// javascript/script.js

const API_URL = "https://digi-api.com/api/v1/digimon";

let digimonAtual = 1;

const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("bnt-search");
const btnRandom = document.getElementById("bnt-random");
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

// Mostrar detalhes do Digimon
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
        descricao.textContent =
            digimon.descriptions?.[0]?.description ||
            "Descrição não disponível.";
    }

    if (habilidades) {
        habilidades.textContent = Array.isArray(digimon.skills)
            ? digimon.skills.map(s => s.skill).join("; ")
            : "Nenhuma habilidade cadastrada.";
    }

    if (listaDigimons && !nome) {
        listaDigimons.innerHTML = criarCardDigimon(digimon);
    }
}

// Criar card
function criarCardDigimon(digimon) {
    const foto = digimon.images?.[0]?.href || "";

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

// Embaralhar Digimons
function embaralharDigimons(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}

// Carregar 8 Digimons aleatórios
async function carregarDigimonsAleatorios() {
    if (!listaDigimons) return;

    listaDigimons.innerHTML = `
        <p class="carregando">Carregando Digimons...</p>
    `;

    try {
        const resposta = await fetch(`${API_URL}?page=0&pageSize=100`);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar Digimons.");
        }

        const dados = await resposta.json();
        const disponiveis = dados.content || dados.data || [];

        if (disponiveis.length < 8) {
            throw new Error("Digimons insuficientes.");
        }

        const embaralhados = embaralharDigimons(disponiveis);
        const selecionados = embaralhados.slice(0, 8);

        const detalhes = await Promise.all(
            selecionados.map(async item => {
                if (item.images?.[0]?.href) return item;

                const id = item.id ?? item.href?.split("/").pop();

                const resposta = await fetch(`${API_URL}/${id}`);

                if (!resposta.ok) {
                    throw new Error("Erro ao buscar Digimon.");
                }

                return await resposta.json();
            })
        );

        listaDigimons.innerHTML = detalhes
            .map(criarCardDigimon)
            .join("");

    } catch (erro) {
        console.error(erro);

        listaDigimons.innerHTML = `
            <div class="mensagem-erro">
                <h3>Não foi possível carregar os Digimons</h3>
                <p>Verifique sua conexão com a internet.</p>
                <button class="botao-tentar"
                    onclick="carregarDigimonsAleatorios()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Buscar Digimon
async function buscarDigimon(termoOuId) {
    const termo = termoOuId.toString().trim();

    if (!termo) return;

    try {
        const resposta = await fetch(
            `${API_URL}/${encodeURIComponent(termo)}`
        );

        if (!resposta.ok) {
            throw new Error("Digimon não encontrado.");
        }

        const digimon = await resposta.json();

        renderizarDigimon(digimon);

    } catch (erro) {
        console.error(erro);

        if (listaDigimons && !nome) {
            listaDigimons.innerHTML = `
                <div class="mensagem-erro">
                    <h3>Digimon não encontrado</h3>
                    <p>Tente pesquisar por outro nome ou ID.</p>
                </div>
            `;
        }

        if (nome) {
            nome.textContent = "Não encontrado";
            if (descricao) descricao.textContent = "Digimon não encontrado.";
        }
    }
}

// Me Surpreenda
function meSurpreenda() {
    buscarDigimon(Math.floor(Math.random() * 100) + 1);

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

if (idUrl) {
    digimonAtual = parseInt(idUrl, 10);
}

if (nome) {
    buscarDigimon(digimonAtual);
} else if (listaDigimons) {
    carregarDigimonsAleatorios();
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

        const temaAtivo =
            document.body.classList.contains("tema-escuro");

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

const btnDigimonAleatorio = document.getElementById("btn-digimon-aleatorio");

if (btnDigimonAleatorio) {
    btnDigimonAleatorio.addEventListener("click", async () => {
        btnDigimonAleatorio.disabled = true;
        btnDigimonAleatorio.innerHTML = "Sorteando...";

        try {
            const resposta = await fetch(`${API_URL}?page=0&pageSize=100`);
            const dados = await resposta.json();

            const digimons = dados.content || dados.data || [];

            if (digimons.length === 0) {
                throw new Error("Nenhum Digimon encontrado.");
            }

            const aleatorio = digimons[
                Math.floor(Math.random() * digimons.length)
            ];

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