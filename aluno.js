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
    // PROCESSAR CADA CURSO
    // ==============================

    for (const matricula of matriculas) {

        const curso = matricula.cursos;

        if (!curso) continue;

        // ==============================
        // BUSCAR MÓDULOS DO CURSO
        // ==============================

        const { data: modulos, error: erroModulos } =
            await supabaseClient
                .from("modulos")
                .select("id")
                .eq("curso_id", curso.id);

        if (erroModulos) {
            console.error(erroModulos);
        }

        const idsModulos =
            modulos
                ? modulos.map(modulo => modulo.id)
                : [];

        let totalAulas = 0;
        let aulasConcluidas = 0;

        // ==============================
        // BUSCAR AULAS
        // ==============================

        if (idsModulos.length > 0) {

            const { data: aulas, error: erroAulas } =
                await supabaseClient
                    .from("aulas")
                    .select("id")
                    .in("modulo_id", idsModulos);

            if (erroAulas) {
                console.error(erroAulas);
            }

            if (aulas && aulas.length > 0) {

                totalAulas = aulas.length;

                const idsAulas =
                    aulas.map(aula => aula.id);

                // ==============================
                // BUSCAR PROGRESSO DO ALUNO
                // ==============================

                const { data: progresso, error: erroProgresso } =
                    await supabaseClient
                        .from("progresso_aulas")
                        .select("aula_id, concluida")
                        .eq("usuario_id", perfil.id)
                        .in("aula_id", idsAulas);

                if (erroProgresso) {
                    console.error(erroProgresso);
                }

                if (progresso) {

                    aulasConcluidas =
                        progresso.filter(
                            item => item.concluida === true
                        ).length;
                }
            }
        }

        // ==============================
        // CALCULAR PERCENTUAL
        // ==============================

        let percentual = 0;

        if (totalAulas > 0) {

            percentual =
                Math.round(
                    (aulasConcluidas / totalAulas) * 100
                );
        }

        // ==============================
        // CRIAR CARD
        // ==============================

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

            <h3>${curso.nome}</h3>

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

            <div style="
                margin-top:20px;
                margin-bottom:20px;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:8px;
                    font-weight:bold;
                ">

                    <span>📊 Seu progresso</span>

                    <span>
                        ${percentual}%
                    </span>

                </div>

                <div style="
                    width:100%;
                    height:12px;
                    background:#ddd;
                    border-radius:10px;
                    overflow:hidden;
                ">

                    <div style="
                        width:${percentual}%;
                        height:100%;
                        background:linear-gradient(
                            90deg,
                            #b8860b,
                            #d4af37
                        );
                        border-radius:10px;
                        transition:width 0.4s ease;
                    "></div>

                </div>

                <p style="
                    margin-top:8px;
                    font-size:14px;
                ">
                    ${aulasConcluidas} de ${totalAulas}
                    aulas concluídas
                </p>

            </div>

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
    }
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
