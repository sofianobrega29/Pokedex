// javascript/script.js

// --- 1. Controle do Menu Lateral ---
const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");

if (btnMenu && menu) {
    btnMenu.addEventListener("click", () => {
        menu.classList.toggle("recolhida");
    });
}

// --- 2. Configurações Globais e Elementos da Interface ---
const API_URL = "https://digi-api.com/api/v1/digimon";
let digimonAtual = 1;

// Elementos da Detalhada (card.html)
const nome = document.getElementById("nome");
const imagem = document.getElementById("imagem");
const tipo = document.getElementById("tipo");
const nivel = document.getElementById("nivel");
const atributo = document.getElementById("atributo");
const descricao = document.getElementById("descricao");
const habilidades = document.getElementById("habilidades");

// Botões de Navegação (Pessoa 3)
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

// Elementos de Busca e Surpresa (Pessoa 4)
const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("bnt-search");
const btnRandom = document.getElementById("btn-random");
const conteudoMain = document.querySelector(".conteudo");

// --- 3. Função para Renderizar o Digimon Encontrado ---
function renderizarDigimon(digimon) {
    digimonAtual = digimon.id;

    // Se estiver na página de detalhes (card.html)
    if (nome) nome.textContent = `${digimon.name} #Nº${digimon.id}`;
    if (imagem) {
        imagem.src = digimon.images?.[0]?.href || "";
        imagem.alt = digimon.name;
    }
    if (tipo) tipo.textContent = digimon.types?.[0]?.type || "-";
    if (nivel) nivel.textContent = digimon.levels?.[0]?.level || "-";
    if (atributo) atributo.textContent = digimon.attributes?.[0]?.attribute || "-";
    if (descricao) {
        descricao.textContent = digimon.descriptions?.[0]?.description || "Descrição não disponível.";
    }
    if (habilidades) {
        habilidades.textContent = Array.isArray(digimon.skills)
            ? digimon.skills.map(s => s.skill).join("; ")
            : (digimon.skills || "Nenhuma habilidade cadastrada.");
    }

    // Se estiver na Home (index.html), atualiza o Cartão principal
    if (conteudoMain && !nome) {
        conteudoMain.innerHTML = `
            <div class="caixa">
                <a href="card.html?id=${digimon.id}">
                    <img src="${digimon.images?.[0]?.href || ''}" alt="${digimon.name}">
                    <h3>${digimon.name}</h3>
                </a>
            </div>
        `;
    }
}

// --- 4. Mensagem para Buscas sem Resultados ---
function exibirMensagemSemResultado(termo) {
    if (nome) {
        nome.textContent = "Não encontrado";
        if (imagem) imagem.src = "";
        if (tipo) tipo.textContent = "-";
        if (nivel) nivel.textContent = "-";
        if (atributo) atributo.textContent = "-";
        if (descricao) descricao.textContent = `Nenhum Digimon encontrado para "${termo}".`;
        if (habilidades) habilidades.textContent = "-";
    }

    if (conteudoMain && !nome) {
        conteudoMain.innerHTML = `
            <div class="mensagem-erro">
                <h3>Nenhum Digimon encontrado</h3>
                <p>Não encontramos resultados para "<strong>${termo}</strong>". Tente buscar por nomes como <em>Agumon</em>, <em>Gabumon</em> ou por ID.</p>
            </div>
        `;
    }
}

// --- 5. Implementação da Busca (API DAPI com Fallback Local) ---
async function buscarDigimon(termoOuId) {
    const termo = termoOuId.toString().trim().toLowerCase();

    // Primeiro tenta buscar no Array de Dados de Exemplo (Busca Local)
    const buscaLocal = (typeof digimonsExemplo !== "undefined") ? digimonsExemplo.find(d => 
        d.name.toLowerCase().includes(termo) || d.id.toString() === termo
    ) : null;

    if (buscaLocal) {
        renderizarDigimon(buscaLocal);
        return;
    }

    // Se não achar localmente, tenta na API externa
    try {
        const resposta = await fetch(`${API_URL}/${termo}`);
        if (!resposta.ok) throw new Error("Não encontrado na API");

        const digimonApi = await resposta.json();
        renderizarDigimon(digimonApi);
    } catch (erro) {
        console.warn("Erro ao buscar na API:", erro);
        exibirMensagemSemResultado(termoOuId);
    }
}

// --- 6. Implementação do Botão Me Surpreenda ---
function meSurpreenda() {
    // Sorteia entre os itens locais de exemplo ou IDs aleatórios da API
    if (typeof digimonsExemplo !== "undefined" && digimonsExemplo.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * digimonsExemplo.length);
        renderizarDigimon(digimonsExemplo[indiceAleatorio]);
    } else {
        const idAleatorio = Math.floor(Math.random() * 100) + 1;
        buscarDigimon(idAleatorio);
    }
    if (searchInput) searchInput.value = "";
}

// --- 7. Event Listeners e Conexões ---

// Busca por Botão ou Enter
if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", () => {
        if (searchInput.value.trim()) buscarDigimon(searchInput.value.trim());
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && searchInput.value.trim()) {
            buscarDigimon(searchInput.value.trim());
        }
    });
}

// Botão Surpresa
if (btnRandom) {
    btnRandom.addEventListener("click", meSurpreenda);
}

// Navegação Anterior e Próximo (Pessoa 3)
if (btnAnterior) {
    btnAnterior.addEventListener("click", () => {
        if (digimonAtual > 1) {
            digimonAtual--;
            buscarDigimon(digimonAtual);
        }
    });
}

if (btnProximo) {
    btnProximo.addEventListener("click", () => {
        digimonAtual++;
        buscarDigimon(digimonAtual);
    });
}

// --- 8. Inicialização da Página ---
const urlParams = new URLSearchParams(window.location.search);
const idUrl = urlParams.get("id");

if (idUrl) {
    digimonAtual = parseInt(idUrl, 10);
}

buscarDigimon(digimonAtual);