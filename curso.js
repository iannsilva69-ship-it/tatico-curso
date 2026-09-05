// ==============================
// CARREGAR CURSO
// ==============================

async function carregarCurso() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();

    if (erroUsuario || !user) {
        window.location.href = "login.html";
        return;
    }

    // ==============================
    // PEGAR ID DO CURSO
    // ==============================

    const parametros =
        new URLSearchParams(window.location.search);

    const cursoId =
        parametros.get("id");

    if (!cursoId) {

        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";

        return;
    }

    // ==============================
    // BUSCAR PERFIL DO ALUNO
    // ==============================

    const { data: perfil } =
        await supabaseClient
            .from("perfis")
            .select("id")
            .eq("auth_user_id", user.id)
            .single();

    if (!perfil) {

        window.location.href =
            "aluno.html";

        return;
    }

    // ==============================
    // VERIFICAR MATRÍCULA
    // ==============================

    const { data: matricula } =
        await supabaseClient
            .from("matriculas")
            .select("id")
            .eq("usuario_id", perfil.id)
            .eq("curso_id", cursoId)
            .eq("status", "ativo")
            .maybeSingle();

    if (!matricula) {

        alert(
            "Você não possui acesso a este curso."
        );

        window.location.href =
            "aluno.html";

        return;
    }

    // ==============================
    // BUSCAR CURSO
    // ==============================

    const {
        data: curso,
        error: erroCurso
    } = await supabaseClient
        .from("cursos")
        .select("id, nome, descricao")
        .eq("id", cursoId)
        .single();

    if (erroCurso || !curso) {

        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";

        return;
    }

    document.getElementById("nomeCurso").textContent =
        curso.nome;

    document.getElementById("descricaoCurso").textContent =
        curso.descricao ||
        "Conteúdo do curso.";

    // ==============================
    // BUSCAR MÓDULOS
    // ==============================

    const {
        data: modulos,
        error: erroModulos
    } = await supabaseClient
        .from("modulos")
        .select("id, nome, ordem")
        .eq("curso_id", cursoId)
        .order("ordem", {
            ascending: true
        });

    if (erroModulos) {

        console.error(erroModulos);

        document.getElementById("modulos").textContent =
            "Não foi possível carregar os módulos.";

        return;
    }

    const areaModulos =
        document.getElementById("modulos");

    if (!modulos || modulos.length === 0) {

        areaModulos.innerHTML = `
            <p>
                Este curso ainda não possui conteúdo cadastrado.
            </p>
        `;

        return;
    }

    // ==============================
    // CONTADORES DE PROGRESSO
    // ==============================

    let totalAulas = 0;

    let aulasConcluidas = 0;

    // ==============================
    // BUSCAR PROGRESSO DO ALUNO
    // ==============================

    const {
        data: progresso,
        error: erroProgresso
    } = await supabaseClient
        .from("progresso_aulas")
        .select("aula_id, concluida")
        .eq("usuario_id", perfil.id);

    if (erroProgresso) {

        console.error(
            "Erro ao buscar progresso:",
            erroProgresso
        );
    }

    // ==============================
    // ÁREA DO PROGRESSO
    // ==============================

    const areaProgresso =
        document.createElement("div");

    areaProgresso.id =
        "progressoCurso";

    areaProgresso.style.cssText = `
        background: #111827;
        color: white;
        padding: 25px;
        border-radius: 14px;
        margin-bottom: 35px;
        border: 1px solid #a67c32;
    `;

    areaProgresso.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:12px;
            gap:15px;
            flex-wrap:wrap;
        ">

            <strong>
                📊 Seu progresso
            </strong>

            <span id="porcentagemProgresso">
                0%
            </span>

        </div>

        <div style="
            width:100%;
            height:12px;
            background:#374151;
            border-radius:20px;
            overflow:hidden;
        ">

            <div
                id="barraProgresso"
                style="
                    width:0%;
                    height:100%;
                    background:#a67c32;
                    transition:width 0.4s ease;
                "
            ></div>

        </div>
    `;

    areaModulos.parentNode.insertBefore(
        areaProgresso,
        areaModulos
    );

    // ==============================
    // ATUALIZAR PROGRESSO
    // ==============================

    function atualizarProgresso() {

        if (totalAulas === 0) {
            return;
        }

        const porcentagem =
            Math.round(
                (aulasConcluidas / totalAulas) * 100
            );

        document.getElementById(
            "porcentagemProgresso"
        ).textContent =
            porcentagem + "%";

        document.getElementById(
            "barraProgresso"
        ).style.width =
            porcentagem + "%";
    }

    // ==============================
    // CARREGAR MÓDULOS
    // ==============================

    areaModulos.innerHTML = "";

    for (const modulo of modulos) {

        const bloco =
            document.createElement("div");

        bloco.className =
            "course-card";

        bloco.innerHTML = `

            <h3>
                ${modulo.nome}
            </h3>

            <div id="modulo-${modulo.id}">
                Carregando aulas...
            </div>

        `;

        areaModulos.appendChild(
            bloco
        );

        // ==============================
        // BUSCAR AULAS
        // ==============================

        const {
            data: aulas,
            error: erroAulas
        } = await supabaseClient
            .from("aulas")
            .select(`
                id,
                titulo,
                link_youtube,
                link_pdf,
                link_questoes,
                link_slide,
                ordem
            `)
            .eq("modulo_id", modulo.id)
            .order("ordem", {
                ascending: true
            });

        const areaAulas =
            document.getElementById(
                `modulo-${modulo.id}`
            );

        if (erroAulas) {

            console.error(erroAulas);

            areaAulas.textContent =
                "Erro ao carregar as aulas.";

            continue;
        }

        if (!aulas || aulas.length === 0) {

            areaAulas.innerHTML =
                "<p>Nenhuma aula cadastrada.</p>";

            continue;
        }
