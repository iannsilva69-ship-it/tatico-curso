// ==========================================
// VERIFICAR USUÁRIO
// ==========================================

async function verificarUsuario() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}


// ==========================================
// CARREGAR PERFIL
// ==========================================

async function carregarPerfil(user) {

    const {
        data,
        error
    } = await supabaseClient
        .from("perfis")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

    if (error) {

        console.error(
            "Erro ao carregar perfil:",
            error
        );

        return null;
    }

    return data;
}


// ==========================================
// VERIFICAR TESTE GRÁTIS
// ==========================================

async function verificarTesteGratis(perfil) {

    const agora = new Date().toISOString();

    const {
        data,
        error
    } = await supabaseClient
        .from("testes_gratis")
        .select("*")
        .eq("usuario_id", perfil.id)
        .eq("ativo", true)
        .gt("data_fim", agora)
        .maybeSingle();

    if (error) {

        console.error(
            "Erro ao verificar teste grátis:",
            error
        );

        return null;
    }

    return data;
}


// ==========================================
// CARREGAR CURSOS
// ==========================================

async function carregarCursos(perfil) {

    const lista =
        document.getElementById("listaCursos");

    if (!lista) {
        return;
    }


    // ==========================================
    // VERIFICAR TESTE GRÁTIS
    // ==========================================

    const testeGratis =
        await verificarTesteGratis(perfil);


    // ==========================================
    // BUSCAR MATRÍCULAS
    // ==========================================

    const {
        data: matriculas,
        error: erroMatriculas
    } = await supabaseClient
        .from("matriculas")
        .select("*")
        .eq("usuario_id", perfil.id)
        .eq("status", "ativo");


    if (erroMatriculas) {

        console.error(
            "ERRO AO CARREGAR MATRÍCULAS:",
            erroMatriculas
        );

        lista.innerHTML = `
            <p>
                Não foi possível carregar seus cursos.
            </p>
        `;

        return;
    }


    // ==========================================
    // CURSOS MATRICULADOS
    // ==========================================

    const cursosMatriculados =
        matriculas || [];


    const idsCursosMatriculados =
        cursosMatriculados
            .map(matricula => matricula.id_curso)
            .filter(id => id);


    // ==========================================
    // SEM MATRÍCULA E SEM TESTE
    // ==========================================

    if (
        cursosMatriculados.length === 0 &&
        !testeGratis
    ) {

        lista.innerHTML = `
            <p>
                Você ainda não possui cursos ativos.
            </p>
        `;

        return;
    }


    lista.innerHTML = "";


    // ==========================================
    // BUSCAR CURSOS
    // ==========================================

    let cursos = [];


    // ==========================================
    // DURANTE O TESTE GRÁTIS
    // ==========================================

    if (testeGratis) {

        const {
            data: cursosAtivos,
            error: erroCursos
        } = await supabaseClient
            .from("cursos")
            .select("*")
            .eq("ativo", true)
            .order("id", {
                ascending: true
            });


        if (erroCursos) {

            console.error(
                "Erro ao carregar cursos:",
                erroCursos
            );

            lista.innerHTML = `
                <p>
                    Não foi possível carregar seus cursos.
                </p>
            `;

            return;
        }


        cursos =
            cursosAtivos || [];

    } else {

        // ==========================================
        // CURSOS MATRICULADOS
        // ==========================================

        for (
            const matricula
            of cursosMatriculados
        ) {

            // CORREÇÃO:
            // a tabela usa id_curso

            const cursoId =
                matricula.id_curso;


            if (!cursoId) {
                continue;
            }


            const {
                data: curso,
                error: erroCurso
            } = await supabaseClient
                .from("cursos")
                .select("*")
                .eq("id", cursoId)
                .single();


            if (erroCurso || !curso) {

                console.error(
                    "Erro ao carregar curso:",
                    erroCurso
                );

                continue;
            }


            cursos.push(curso);
        }
    }


    // ==========================================
    // NENHUM CURSO
    // ==========================================

    if (cursos.length === 0) {

        lista.innerHTML = `
            <p>
                Nenhum curso disponível no momento.
            </p>
        `;

        return;
    }


    // ==========================================
    // EVITAR DUPLICADOS
    // ==========================================

    const cursosUnicos = [];

    const idsJaAdicionados =
        new Set();


    for (
        const curso
        of cursos
    ) {

        if (
            !idsJaAdicionados.has(curso.id)
        ) {

            idsJaAdicionados.add(curso.id);

            cursosUnicos.push(curso);
        }
    }


    // ==========================================
    // CADA CURSO
    // ==========================================

    for (
        const curso
        of cursosUnicos
    ) {

        // ==========================================
        // MATRÍCULA DESTE CURSO
        // ==========================================

        const matricula =
            cursosMatriculados.find(
                item =>
                    item.id_curso === curso.id
            );


        // ==========================================
        // BUSCAR MÓDULOS
        // ==========================================

        const {
            data: modulos,
            error: erroModulos
        } = await supabaseClient
            .from("modulos")
            .select("id")
            .eq("curso_id", curso.id);


        if (erroModulos) {

            console.error(
                "Erro ao carregar módulos:",
                erroModulos
            );

            continue;
        }


        const moduloIds =
            (modulos || [])
                .map(
                    modulo => modulo.id
                );


        let totalAulas = 0;

        let aulasConcluidas = 0;


        // ==========================================
        // BUSCAR AULAS
        // ==========================================

        if (moduloIds.length > 0) {

            const {
                data: aulas,
                error: erroAulas
            } = await supabaseClient
                .from("aulas")
                .select("id")
                .in(
                    "modulo_id",
                    moduloIds
                );


            if (erroAulas) {

                console.error(
                    "Erro ao carregar aulas:",
                    erroAulas
                );

            } else {

                totalAulas =
                    aulas
                        ? aulas.length
                        : 0;


                // ==========================================
                // BUSCAR PROGRESSO
                // ==========================================

                if (totalAulas > 0) {

                    const aulaIds =
                        aulas.map(
                            aula => aula.id
                        );


                    const {
                        data: progresso,
                        error: erroProgresso
                    } = await supabaseClient
                        .from("progresso_aulas")
                        .select(
                            "aula_id, concluida"
                        )
                        .eq(
                            "usuario_id",
                            perfil.id
                        )
                        .in(
                            "aula_id",
                            aulaIds
                        );


                    if (erroProgresso) {

                        console.error(
                            "Erro ao carregar progresso:",
                            erroProgresso
                        );

                    } else {

                        aulasConcluidas =
                            (progresso || [])
                                .filter(
                                    item =>
                                        item.concluida === true
                                )
                                .length;
                    }
                }
            }
        }


        // ==========================================
        // CALCULAR PORCENTAGEM
        // ==========================================

        let porcentagem = 0;


        if (totalAulas > 0) {

            porcentagem =
                Math.round(
                    (
                        aulasConcluidas /
                        totalAulas
                    ) * 100
                );
        }


        // ==========================================
        // INFORMAÇÃO DO ACESSO
        // ==========================================

        let informacaoAcesso = "";


        // CORREÇÃO:
        // a tabela usa data_vencimento

        if (
            matricula &&
            matricula.data_vencimento
        ) {

            informacaoAcesso = `
                <p>
                    <strong>
                        Acesso até:
                    </strong>

                    ${new Date(
                        matricula.data_vencimento
                    ).toLocaleDateString(
                        "pt-BR"
                    )}
                </p>
            `;

        } else if (testeGratis) {

            informacaoAcesso = `
                <p>
                    <strong>
                        🎁 Teste grátis até:
                    </strong>

                    ${new Date(
                        testeGratis.data_fim
                    ).toLocaleDateString(
                        "pt-BR"
                    )}
                </p>
            `;
        }


        // ==========================================
        // CARD DO CURSO
        // ==========================================

        const card =
            document.createElement("div");


        card.className = "card";


        card.innerHTML = `

            ${
                curso.imagem
                    ? `
                        <img
                            src="${curso.imagem}"
                            alt="${curso.nome}"
                        >
                    `
                    : `
                        <div
                            style="
                                width:100%;
                                aspect-ratio:16 / 8;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                background:#151B25;
                                color:#C8A355;
                                font-weight:800;
                                font-size:18px;
                            "
                        >
                            TÁTICOS CURSO
                        </div>
                    `
            }


            <div>

                ${
                    testeGratis && !matricula
                        ? `
                            <div
                                style="
                                    display:inline-block;
                                    margin-bottom:10px;
                                    padding:6px 10px;
                                    border-radius:20px;
                                    background:#d4af37;
                                    color:#080a0f;
                                    font-size:12px;
                                    font-weight:700;
                                "
                            >
                                🎁 TESTE GRÁTIS
                            </div>
                        `
                        : ""
                }


                <h3>
                    ${curso.nome}
                </h3>


                <p>
                    ${curso.descricao || ""}
                </p>


                <p>
                    <strong>
                        📊 Seu progresso:
                    </strong>

                    ${porcentagem}%
                </p>


                <div
                    style="
                        width:100%;
                        height:12px;
                        background:#ddd;
                        border-radius:10px;
                        overflow:hidden;
                        margin:10px 0;
                    "
                >

                    <div
                        style="
                            width:${porcentagem}%;
                            height:100%;
                            background:#d4af37;
                            transition:width 0.3s ease;
                        "
                    ></div>

                </div>


                <p>
                    ${aulasConcluidas}
                    de
                    ${totalAulas}
                    aulas concluídas
                </p>


                ${informacaoAcesso}


                <button
                    onclick="
                        window.location.href =
                        'curso.html?id=${curso.id}'
                    "
                >
                    Acessar Curso
                </button>

            </div>
        `;


        lista.appendChild(card);
    }
}


// ==========================================
// CARREGAR SIMULADOS
// ==========================================

async function carregarSimulados() {

    const lista =
        document.getElementById(
            "listaSimulados"
        );


    if (!lista) {
        return;
    }


    const {
        data: simulados,
        error
    } = await supabaseClient
        .from("simulados")
        .select(
            "id, titulo, descricao, link_pdf"
        )
        .eq("ativo", true)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Erro ao carregar simulados:",
            error
        );

        lista.innerHTML = `
            <p>
                Não foi possível carregar os simulados.
            </p>
        `;

        return;
    }


    if (
        !simulados ||
        simulados.length === 0
    ) {

        lista.innerHTML = `
            <p>
                Nenhum simulado disponível no momento.
            </p>
        `;

        return;
    }


    lista.innerHTML = "";


    simulados.forEach(
        simulado => {

            const card =
                document.createElement("div");


            card.className =
                "card";


            card.innerHTML = `

                <h3>
                    📝 ${simulado.titulo}
                </h3>


                <p>
                    ${simulado.descricao || ""}
                </p>


                <button
                    onclick="
                        window.open(
                            '${simulado.link_pdf}',
                            '_blank'
                        )
                    "
                >
                    📄 Abrir Simulado
                </button>

            `;


            lista.appendChild(card);
        }
    );
}


// ==========================================
// LOGOUT
// ==========================================

const botaoLogout =
    document.getElementById("logout");


if (botaoLogout) {

    botaoLogout.addEventListener(
        "click",
        async function () {

            await supabaseClient
                .auth
                .signOut();

            window.location.href =
                "login.html";
        }
    );
}


// ==========================================
// INICIAR ÁREA DO ALUNO
// ==========================================

async function iniciarAluno() {

    const user =
        await verificarUsuario();


    if (!user) {
        return;
    }


    const perfil =
        await carregarPerfil(user);


    if (!perfil) {
        return;
    }


    // ==========================================
    // MOSTRAR NOME DO ALUNO
    // ==========================================

    const nomeAluno =
        perfil.nome ||
        user.user_metadata?.nome ||
        "Aluno";


    const tituloBoasVindas =
        document.querySelector(
            ".boas-vindas h2"
        );


    if (tituloBoasVindas) {

        tituloBoasVindas.innerHTML =
            `Olá, ${nomeAluno}! 👋`;
    }


    // ==========================================
    // CARREGAR CONTEÚDO
    // ==========================================

    await carregarCursos(
        perfil
    );


    await carregarSimulados();
}


// ==========================================
// INICIAR
// ==========================================

iniciarAluno();
