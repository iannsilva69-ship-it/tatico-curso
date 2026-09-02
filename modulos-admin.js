// ==============================
// VERIFICAR SÓCIO
// ==============================

async function verificarSocio() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return false;
    }

    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("tipo, status")
            .eq("auth_user_id", user.id)
            .single();

    if (erroPerfil || !perfil) {
        window.location.href = "login.html";
        return false;
    }

    if (
        !["socio", "sócio"].includes(
            (perfil.tipo || "").toLowerCase()
        ) ||
        (perfil.status || "").toLowerCase() !== "ativo"
    ) {

        alert("Acesso permitido somente para sócios.");

        window.location.href = "aluno.html";

        return false;
    }

    return true;
}


// ==============================
// PEGAR ID DO CURSO
// ==============================

const parametros =
    new URLSearchParams(window.location.search);

const cursoId =
    parametros.get("id");


// ==============================
// CARREGAR CURSO
// ==============================

async function carregarCurso() {

    if (!cursoId) {

        document.getElementById("nomeCurso").textContent =
            "Curso não informado";

        return;
    }

    const { data: curso, error } =
        await supabaseClient
            .from("cursos")
            .select("id, nome")
            .eq("id", cursoId)
            .single();

    if (error || !curso) {

        console.error(error);

        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado";

        return;
    }

    document.getElementById("nomeCurso").textContent =
        curso.nome || "Curso";
}


// ==============================
// CARREGAR MÓDULOS
// ==============================

async function carregarModulos() {

    const autorizado =
        await verificarSocio();

    if (!autorizado) return;

    await carregarCurso();

    if (!cursoId) return;

    const area =
        document.getElementById("listaModulos");

    const { data: modulos, error } =
        await supabaseClient
            .from("modulos")
            .select("id, nome, ordem")
            .eq("curso_id", cursoId)
            .order("ordem", {
                ascending: true
            });

    if (error) {

        console.error(error);

        area.innerHTML = `
            <p>Erro ao carregar os módulos.</p>
        `;

        return;
    }


    if (!modulos || modulos.length === 0) {

        area.innerHTML = `
            <p>
                Nenhum módulo cadastrado ainda.
            </p>
        `;

        return;
    }


    area.innerHTML = "";


    modulos.forEach(function (modulo) {

        const card =
            document.createElement("div");

        card.className =
            "course-card";


        card.innerHTML = `

            <h3>
                ${modulo.ordem}. ${modulo.nome}
            </h3>

            <p>
                Módulo ${modulo.ordem}
            </p>

            <button
                type="button"
                class="btn-aulas"
            >
                🎓 Gerenciar aulas
            </button>

        `;


        area.appendChild(card);


        // ==============================
        // BOTÃO GERENCIAR AULAS
        // ==============================

        const botaoAulas =
            card.querySelector(".btn-aulas");

        botaoAulas.addEventListener(
            "click",
            function () {

                window.location.href =
                    "aulas-admin.html?id=" + modulo.id;

            }
        );

    });

}


// ==============================
// ABRIR NOVO MÓDULO
// ==============================

document.getElementById("novoModulo").addEventListener(
    "click",
    function () {

        document.getElementById(
            "formularioModulo"
        ).style.display = "block";

        document.getElementById(
            "nomeModulo"
        ).focus();

    }
);


// ==============================
// CANCELAR
// ==============================

document.getElementById("cancelarModulo").addEventListener(
    "click",
    function () {

        document.getElementById(
            "formularioModulo"
        ).style.display = "none";

        document.getElementById(
            "moduloForm"
        ).reset();

        document.getElementById(
            "ordemModulo"
        ).value = 1;

    }
);


// ==============================
// SALVAR MÓDULO
// ==============================

document.getElementById("moduloForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const mensagem =
            document.getElementById(
                "mensagemModulo"
            );


        const nome =
            document.getElementById(
                "nomeModulo"
            ).value.trim();


        const ordem =
            document.getElementById(
                "ordemModulo"
            ).value;


        if (!cursoId) {

            mensagem.textContent =
                "Curso não informado.";

            return;
        }


        mensagem.textContent =
            "Salvando módulo...";


        const { error } =
            await supabaseClient
                .from("modulos")
                .insert({

                    curso_id: cursoId,

                    nome: nome,

                    ordem: ordem

                });


        if (error) {

            console.error(error);

            mensagem.textContent =
                "Erro ao salvar o módulo.";

            return;
        }


        mensagem.textContent =
            "Módulo criado com sucesso!";


        document.getElementById(
            "moduloForm"
        ).reset();


        document.getElementById(
            "ordemModulo"
        ).value = 1;


        setTimeout(function () {

            document.getElementById(
                "formularioModulo"
            ).style.display = "none";

            mensagem.textContent = "";

            carregarModulos();

        }, 1000);

    }
);


// ==============================
// SAIR
// ==============================

document.getElementById("sair").addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

    }
);


// ==============================
// INICIAR
// ==============================

carregarModulos();
