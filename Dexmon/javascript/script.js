// javascript/script.js


// javascript/script.js


const API_URL = "https://digi-api.com/api/v1/digimon";
const TRADUCAO_URL = "https://api.mymemory.translated.net/get";

let digimonAtual = 1;
let controleBusca = 0;

const cacheTraducoes = {};

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

// Decodificar caracteres especiais
function decodificarTexto(texto) {
    const elemento = document.createElement("textarea");
    elemento.innerHTML = texto;
    return elemento.value;
}

// Traduzir qualquer texto da API
async function traduzirTexto(texto) {
    if (!texto) return "-";

    if (cacheTraducoes[texto]) {
        return cacheTraducoes[texto];
    }

    cacheTraducoes[texto] = (async () => {
        try {
            const parametros = new URLSearchParams({
                q: texto,
                langpair: "en|pt-BR"
            });

            const resposta = await fetch(
                `${TRADUCAO_URL}?${parametros}`
            );

            if (!resposta.ok) {
                throw new Error("Erro no serviço de tradução.");
            }

            const dados = await resposta.json();

            if (dados.responseStatus !== 200) {
                throw new Error("Tradução indisponível.");
            }

            return decodificarTexto(
                dados.responseData.translatedText
            );

        } catch (erro) {
            console.error("Erro na tradução:", erro);
            return texto;
        }
    })();

    return cacheTraducoes[texto];
}

// Obter descrição em português
async function obterDescricao(digimon) {
    const descricoes = digimon.descriptions || [];

    if (descricoes.length === 0) {
        return "Descrição não disponível.";
    }

    function identificarIdioma(item) {
        const idioma = item.language;

        if (typeof idioma === "string") {
            return idioma;
        }

        return [
            idioma?.language,
            idioma?.code,
            idioma?.name
        ].filter(Boolean).join(" ");
    }

    // Procurar descrição em português
    const portugues = descricoes.find(item =>
        /pt|portuguese|português/i.test(identificarIdioma(item))
    );

    if (portugues) {
        return portugues.description;
    }

    // Procurar descrição em inglês
    const ingles = descricoes.find(item =>
        /en|english|inglês/i.test(identificarIdioma(item))
    );

    const original =
        ingles?.description ||
        descricoes[0]?.description;

    return await traduzirTexto(original);
}

// Mostrar detalhes do Digimon
async function renderizarDigimon(digimon, busca) {
    digimonAtual = digimon.id;

    // Nomes próprios são preservados
    if (nome) nome.textContent = `${digimon.name} Nº ${digimon.id}`;

    if (imagem) {
        imagem.src = digimon.images?.[0]?.href || "";
        imagem.alt = digimon.name;
    }

    if (tipo) tipo.textContent = "Traduzindo...";
    if (nivel) nivel.textContent = "Traduzindo...";
    if (atributo) atributo.textContent = "Traduzindo...";
    if (descricao) descricao.textContent = "Traduzindo...";
    if (habilidades) habilidades.textContent = "Traduzindo...";

    // Traduzir todas as informações simultaneamente
    const [tipoPT, nivelPT, atributoPT, descricaoPT, habilidadesPT] =
        await Promise.all([
            traduzirTexto(digimon.types?.[0]?.type || "-"),

            traduzirTexto(digimon.levels?.[0]?.level || "-"),

            traduzirTexto(digimon.attributes?.[0]?.attribute || "-"),

            obterDescricao(digimon),

            Promise.all(
                (digimon.skills || []).map(s =>
                    traduzirTexto(s.skill)
                )
            )
        ]);

    // Impedir que uma busca antiga sobrescreva a atual
    if (busca !== controleBusca) return;

    if (tipo) tipo.textContent = tipoPT;
    if (nivel) nivel.textContent = nivelPT;
    if (atributo) atributo.textContent = atributoPT;
    if (descricao) descricao.textContent = descricaoPT;
    if (habilidades) {
        habilidades.textContent = habilidadesPT.length
            ? habilidadesPT.join("; ")
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

    const busca = ++controleBusca;

    try {
        const resposta = await fetch(
            `${API_URL}/${encodeURIComponent(termo)}`
        );

        if (!resposta.ok) {
            throw new Error("Digimon não encontrado.");
        }

        const digimon = await resposta.json();

        if (busca !== controleBusca) return;

        await renderizarDigimon(digimon, busca);

    } catch (erro) {
        console.error(erro);

        if (busca !== controleBusca) return;

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

            if (descricao) {
                descricao.textContent = "Digimon não encontrado.";
            }
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

// Botão Digimon aleatório
const btnDigimonAleatorio =
    document.getElementById("btn-digimon-aleatorio");

if (btnDigimonAleatorio) {
    btnDigimonAleatorio.addEventListener("click", async () => {
        btnDigimonAleatorio.disabled = true;
        btnDigimonAleatorio.innerHTML = "Sorteando...";

        try {
            const resposta = await fetch(`${API_URL}?page=0&pageSize=100`);

            if (!resposta.ok) {
                throw new Error("Erro ao carregar Digimons.");
            }

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
