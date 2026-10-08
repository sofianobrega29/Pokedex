
const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");

if (btnMenu && menu) {
    btnMenu.addEventListener("click", () => {
        menu.classList.toggle("recolhida");
    });
}

// --- INTEGRAÇÃO DA API E FUNCIONALIDADES DO DIGIMON ---
const API_URL = "https://digi-api.com/api/v1/digimon";
let digimonAtual = 1;
const total_digimons_estimado = 1422;  //limite aproximado para função "Me Surpreenda"

const nome = document.getElementById("nome");
const imagem = document.getElementById("imagem");
const tipo = document.getElementById("tipo");
const nivel = document.getElementById("nivel");
const atributo = document.getElementById("atributo");
const descricao = document.getElementById("descricao");
const habilidades = document.getElementById("habilidades");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const searchInput = document.getElementById("search-input");
const btnSearch = document.getElementById("btn-search");
const btnRandom = document.getElementById("btn-random");
const conteudoMain = document.querySelector(".conteudo");


async function buscarDigimon(id) {

    try {

        const resposta = await fetch(`${API_URL}/${id}`);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const digimon = await resposta.json();
        digimonAtual = digimon.id; 

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
            habilidades.textContent = digimon.skills?.map(item => item.skill).join("; ") || "Nenhuma habilidade cadastrada.";
        }

        exibirCardNaHome(digimon);

    } catch (erro) {
        console.error("Erro na busca:", erro);
        exibirMensagemSemResultado(termoOuId);
    }

}

function exibirCardNaHome(digimon) {
    if (!conteudoMain || nome) return;

    conteudoMain.innerHTML = `
    <div class="caixa">
        <a href="card.html?id=${digimon.id}">
                <img src="${digimon.images?.[0]?.href || ''}" alt="${digimon.name}">
                <h3>${digimon.name}</h3>
            </a>
        </div>
    `;
}

function exibirMensagemSemResultado(termo) {
    if (nome) {
        nome.textContent = "não encontrado";
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
                <p>Não encontramos resultados para "<strong>${termo}</strong>". Tente novamente!</p>
            </div>
        `;
    }
}


function meSurpreenda() {
    const idAleatorio = Math.floor(Math.random() * total_digimons_estimado) + 1;
    buscarDigimon(idAleatorio);
}

// evento de busca (clique e enter)
if (btnSearch && searchInput) {
    btnSearch.addEventListener("click", () => {
        const termo = searchInput.ariaValueMax.trim().toLowerCase();
        if (termo) buscarDigimon(termo);
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const termo = searchInput.ariaValueMax.trim().toLowerCase();
            if (termo) buscarDigimon (termo);
        }
    });
}

if (btnRandom) {
    btnRandom.addEventListener("click", meSurpreenda);
}

if (btnAnterior && btnProximo) {
    btnAnterior.addEventListener("click", () => {
        if (digimonAtual > 1) {
            digimonAtual--;
            buscarDigimon(digimonAtual);
        }
    });

    btnProximo.addEventListener("click", () => {
        digimonAtual++;
        buscarDigimon(digimonAtual);
    });
}

//inicialização 
const urlParams = new URLSearchParams(window.location.search);
const idUrl = urlParams.get("id");

if (idUrl) {
    digimonAtual = parseInt(idUrl, 10);
}
buscarDigimon(digimonAtual);