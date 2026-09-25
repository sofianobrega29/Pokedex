const searchBar = () => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Buscar por Nome ou ID";

    input.addEventListener("input", (event) => {
        const keyword = event.target.value;
        console.log(keyword);
    });

    const clearBtn = document.createElement("button");
    clearBtn.innerText = "X";

    const container = document.createElement("div");

    container.appendChild(input);
    container.appendChild(clearBtn);

    return container;
};

const menu = document.querySelector(".barra");
const btnMenu = document.getElementById("btn-menu");

btnMenu.addEventListener("click", () => {
    menu.classList.toggle("recolhida");
});

