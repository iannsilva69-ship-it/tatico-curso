// ==============================
// CARREGAR ÁREA DO ALUNO
// ==============================

async function carregarAluno() {

    // Verificar usuário logado
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }


    // Mostrar e-mail
    document.getElementById("usuarioEmail").textContent =
        "Você está conectado como: " + user.email;


    // Buscar perfil
    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("id, nome")
            .eq("auth_user_id", user.id)
            .single();


    if (erroPerfil || !perfil) {

        document.getElementById("cursos").innerHTML = `
            <p>Perfil do aluno não encontrado.</p>
        `;

        return;
    }


    // ==============================
    // BUSCAR MATRÍCULAS
    // ==============================

    const { data: matriculas, error: erroMatriculas } =
        await supabaseClient
            .from("matriculas")
            .select(`
                id,
                status,
                data_vencimento,
                cursos (
                    id,
                    nome,
                    descricao,
                    imagem
                )
            `)
            .eq("usuario_id", perfil.id)
            .eq("status", "ativo");


    if (erroMatriculas) {

        console.error(erroMatriculas);

        document.getElementById("cursos").innerHTML = `
            <p>Não foi possível carregar seus cursos.</p>
        `;

        return;
    }


    // ==============================
    // ÁREA DOS CURSOS
    // ==============================

    const areaCursos =
        document.getElementById("cursos");


    if (!matriculas || matriculas.length === 0) {

        areaCursos.innerHTML = `
            <p>
                Você ainda não possui cursos ativos.
            </p>
        `;

        return;
    }


    areaCursos.innerHTML = "";


    // ==============================
    // CRIAR CARDS
    // ==============================

    matriculas.forEach(function (matricula) {

        const curso = matricula.cursos;


        if (!curso) return;


        const card =
            document.createElement("div");

        card.className =
            "course-card";


        card.innerHTML = `

            ${
                curso.imagem
                ? `
                    <img
                        src="${curso.imagem}"
                        alt="${curso.nome}"
                        style="
                            width:100%;
                            max-height:200px;
                            object-fit:cover;
                            border-radius:10px;
                            margin-bottom:15px;
                        "
                    >
                `
                : ""
            }


            <h3>
                ${curso.nome}
            </h3>


            <p>
                ${curso.descricao || "Curso disponível para você."}
            </p>


            ${
                matricula.data_vencimento
                ? `
                    <p>
                        📅 Acesso até:
                        ${matricula.data_vencimento}
                    </p>
                `
                : ""
            }


            <button
                type="button"
                class="btn-acessar-curso"
            >
                📚 Acessar curso
            </button>

        `;


        // ==============================
        // BOTÃO ACESSAR CURSO
        // ==============================

        card
            .querySelector(".btn-acessar-curso")
            .addEventListener(
                "click",
                function () {

                    abrirCurso(curso.id);

                }
            );


        areaCursos.appendChild(card);

    });

}


// ==============================
// ABRIR CURSO
// ==============================

function abrirCurso(cursoId) {

    window.location.href =
        "curso.html?id=" + cursoId;

}


// ==============================
// SAIR
// ==============================

document
    .getElementById("sair")
    .addEventListener(
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

carregarAluno();
