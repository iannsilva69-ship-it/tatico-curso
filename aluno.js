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
    const { data, error } = await supabaseClient
        .from("perfis")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

    if (error) {
        console.error("Erro ao carregar perfil:", error);
        return null;
    }

    return data;
}


// ==========================================
// CARREGAR CURSOS
// ==========================================

async function carregarCursos(perfil) {

    const lista = document.getElementById("listaCursos");

    const { data: matriculas, error } = await supabaseClient
        .from("matriculas")
        .select(`
            id,
            status,
            data_fim,
            curso_id,
            cursos (
                id,
                nome,
                descricao,
                imagem
            )
        `)
        .eq("usuario_id", perfil.id)
        .eq("status", "ativo");

    if (error) {
        console.error("ERRO AO CARREGAR CURSOS:", error);

        lista.innerHTML =
            "<p>Não foi possível carregar seus cursos.</p>";

        return;
    }

    if (!matriculas || matriculas.length === 0) {
        lista.innerHTML =
            "<p>Você ainda não possui cursos ativos.</p>";

        return;
    }

    lista.innerHTML = "";

    for (const matricula of matriculas) {

        const curso = matricula.cursos;

        if (!curso) continue;

        // ==========================================
        // MÓDULOS DO CURSO
        // ==========================================

        const { data: modulos, error: erroModulos } =
            await supabaseClient
                .from("modulos")
                .select("id")
                .eq("curso_id", curso.id);

        if (erroModulos) {
            console.error("Erro ao carregar módulos:", erroModulos);
            continue;
        }

        const moduloIds = (modulos || []).map(modulo => modulo.id);

        let totalAulas = 0;
        let aulasConcluidas = 0;

        // ==========================================
        // AULAS
        // ==========================================

        if (moduloIds.length > 0) {

            const { data: aulas, error: erroAulas } =
                await supabaseClient
                    .from("aulas")
                    .select("id")
                    .in("modulo_id", moduloIds);

            if (erroAulas) {
                console.error("Erro ao carregar aulas:", erroAulas);
            } else {

                totalAulas = aulas ? aulas.length : 0;

                // ==========================================
                // PROGRESSO
                // ==========================================

                if (totalAulas > 0) {

                    const aulaIds = aulas.map(aula => aula.id);

                    const { data: progresso, error: erroProgresso } =
                        await supabaseClient
                            .from("progresso_aulas")
                            .select("aula_id, concluida")
                            .eq("usuario_id", perfil.id)
                            .in("aula_id", aulaIds);

                    if (erroProgresso) {
                        console.error(
                            "Erro ao carregar progresso:",
                            erroProgresso
                        );
                    } else {

                        aulasConcluidas = (progresso || [])
                            .filter(item => item.concluida === true)
                            .length;
                    }
                }
            }
        }

        // ==========================================
        // PORCENTAGEM
        // ==========================================

        let porcentagem = 0;

        if (totalAulas > 0) {
            porcentagem = Math.round(
                (aulasConcluidas / totalAulas) * 100
            );
        }

        // ==========================================
        // CARD DO CURSO
        // ==========================================

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            ${
                curso.imagem
                    ? `
                        <img
                            src="${curso.imagem}"
                            alt="${curso.nome}"
                            style="
                                width:100%;
                                max-height:180px;
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
                ${curso.descricao || ""}
            </p>

            <p>
                <strong>📊 Seu progresso:</strong>
                ${porcentagem}%
            </p>

            <div style="
                width:100%;
                height:12px;
                background:#ddd;
                border-radius:10px;
                overflow:hidden;
                margin:10px 0;
            ">

                <div style="
                    width:${porcentagem}%;
                    height:100%;
                    background:#d4af37;
                    transition:width 0.3s ease;
                "></div>

            </div>

            <p>
                ${aulasConcluidas} de ${totalAulas}
                aulas concluídas
            </p>

            ${
                matricula.data_fim
                    ? `
                        <p>
                            <strong>Acesso até:</strong>
                            ${new Date(
                                matricula.data_fim
                            ).toLocaleDateString("pt-BR")}
                        </p>
                    `
                    : ""
            }

            <button
                onclick="window.location.href='curso.html?id=${curso.id}'"
            >
                Acessar Curso
            </button>

        `;

        lista.appendChild(card);
    }
}


// ==========================================
// CARREGAR SIMULADOS
// ==========================================

async function carregarSimulados() {

    const lista = document.getElementById("listaSimulados");

    const { data: simulados, error } = await supabaseClient
        .from("simulados")
        .select(`
            id,
            titulo,
            descricao,
            link_pdf
        `)
        .eq("ativo", true)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Erro ao carregar simulados:", error);

        lista.innerHTML =
            "<p>Não foi possível carregar os simulados.</p>";

        return;
    }

    if (!simulados || simulados.length === 0) {

        lista.innerHTML =
            "<p>Nenhum simulado disponível no momento.</p>";

        return;
    }

    lista.innerHTML = "";

    simulados.forEach(simulado => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <h3>📝 ${simulado.titulo}</h3>

            <p>
                ${simulado.descricao || ""}
            </p>

            <button
                onclick="window.open('${simulado.link_pdf}', '_blank')"
            >
                📄 Abrir Simulado
            </button>

        `;

        lista.appendChild(card);
    });
}


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logout")
    .addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    });


// ==========================================
// INICIAR
// ==========================================

async function iniciarAluno() {

    const user = await verificarUsuario();

    if (!user) return;

    const perfil = await carregarPerfil(user);

    if (!perfil) return;

    await carregarCursos(perfil);

    await carregarSimulados();
}

iniciarAluno();
