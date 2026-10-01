
const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");

if (btnMenu && menu) {
    btnMenu.addEventListener("click", () => {
        menu.classList.toggle("recolhida");
    });
}


const API_URL = "https://digi-api.com/api/v1/digimon";

let digimonAtual = 1;

const nome = document.getElementById("nome");
const imagem = document.getElementById("imagem");
const tipo = document.getElementById("tipo");
const nivel = document.getElementById("nivel");
const atributo = document.getElementById("atributo");
const descricao = document.getElementById("descricao");
const habilidades = document.getElementById("habilidades");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");


async function buscarDigimon(id) {

    try {

        const resposta = await fetch(`${API_URL}/${id}`);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const digimon = await resposta.json();

        console.log(digimon);

        nome.textContent = `${digimon.name} #Nº${digimon.id}`;

        imagem.src = digimon.images[0].href;
        imagem.alt = digimon.name;

        tipo.textContent =
            digimon.types?.[0]?.type || "-";

        nivel.textContent =
            digimon.levels?.[0]?.level || "-";

        atributo.textContent =
            digimon.attributes?.[0]?.attribute || "-";

        descricao.textContent =
            digimon.descriptions?.[0]?.description ||
            "Descrição não disponível.";

        habilidades.textContent =
            digimon.skills?.map(item => item.skill).join("; ") ||
            "Nenhuma habilidade cadastrada.";

    } catch (erro) {

        console.error(erro);

        nome.textContent = "Erro";
        imagem.src = "";
        tipo.textContent = "-";
        nivel.textContent = "-";
        atributo.textContent = "-";
        descricao.textContent = "Não foi possível carregar o Digimon.";
        habilidades.textContent = "-";
    }
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


    buscarDigimon(digimonAtual);
}


