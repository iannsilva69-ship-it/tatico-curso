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

    const parametros = new URLSearchParams(
        window.location.search
    );

    const cursoId = parametros.get("id");

    if (!cursoId) {
        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";
        return;
    }

    // ==============================
    // BUSCAR PERFIL
    // ==============================

    const {
        data: perfil,
        error: erroPerfil
    } = await supabaseClient
        .from("perfis")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

    if (erroPerfil || !perfil) {
        window.location.href = "aluno.html";
        return;
    }

    // ==============================
    // VERIFICAR MATRÍCULA
    // ==============================

    const {
        data: matricula,
        error: erroMatricula
    } = await supabaseClient
        .from("matriculas")
        .select("id")
        .eq("usuario_id", perfil.id)
        .eq("curso_id", cursoId)
        .eq("status", "ativo")
        .maybeSingle();

    if (erroMatricula) {
        console.error(
            "Erro ao verificar matrícula:",
            erroMatricula
        );
    }

    if (!matricula) {
        alert("Você não possui acesso a este curso.");
        window.location.href = "aluno.html";
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
        console.error(
            "Erro ao carregar curso:",
            erroCurso
        );

        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";

        return;
    }

    document.getElementById("nomeCurso").textContent =
        curso.nome;

    const descricao =
        document.getElementById("descricaoCurso");

    if (descricao) {
        descricao.textContent =
            curso.descricao || "Conteúdo do curso.";
    }

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
        console.error(
            "Erro ao carregar módulos:",
            erroModulos
        );

        document.getElementById("modulos").innerHTML = `
            <p>
                Não foi possível carregar os módulos.
            </p>
        `;

        return;
    }

    const areaModulos =
        document.getElementById("modulos");

    if (!areaModulos) {
        console.error(
            "Elemento #modulos não encontrado."
        );
        return;
    }

    if (!modulos || modulos.length === 0) {

        areaModulos.innerHTML = `
            <p>
                Este curso ainda não possui conteúdo cadastrado.
            </p>
        `;

        return;
    }

    // ==============================
    // BUSCAR PROGRESSO
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
    // CONTADORES
    // ==============================

    let totalAulas = 0;
    let aulasConcluidas = 0;

    // ==============================
    // ÁREA DO PROGRESSO
    // ==============================

    const areaProgresso =
        document.createElement("div");

    areaProgresso.id =
        "progressoCurso";

    areaProgresso.style.cssText = `
        background:#111827;
        color:white;
        padding:25px;
        border-radius:14px;
        margin-bottom:35px;
        border:1px solid #a67c32;
    `;

    areaProgresso.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:12px;
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

        const texto =
            document.getElementById(
                "porcentagemProgresso"
            );

        const barra =
            document.getElementById(
                "barraProgresso"
            );

        if (texto) {
            texto.textContent =
                porcentagem + "%";
        }

        if (barra) {
            barra.style.width =
                porcentagem + "%";
        }
    }

    // ==============================
    // LIMPAR MÓDULOS
    // ==============================

    areaModulos.innerHTML = "";

    // ==============================
    // PERCORRER MÓDULOS
    // ==============================

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

        if (!areaAulas) {
            continue;
        }

        if (erroAulas) {

            console.error(
                "Erro ao carregar aulas:",
                erroAulas
            );

            areaAulas.innerHTML = `
                <p>
                    Erro ao carregar as aulas.
                </p>
            `;

            continue;
        }

        if (!aulas || aulas.length === 0) {

            areaAulas.innerHTML = `
                <p>
                    Nenhuma aula cadastrada.
                </p>
            `;

            continue;
        }

        areaAulas.innerHTML = "";

        // ==============================
        // PERCORRER AULAS
        // ==============================

        aulas.forEach(function (aula) {

            totalAulas++;

            const registro =
                progresso?.find(
                    function (item) {
                        return item.aula_id === aula.id;
                    }
                );

            let concluida =
                registro?.concluida === true;

            if (concluida) {
                aulasConcluidas++;
            }

            // ==============================
            // DIV DA AULA
            // ==============================

            const aulaDiv =
                document.createElement("div");

            aulaDiv.style.cssText = `
                margin-top:20px;
                padding:20px;
                border:1px solid #e5e7eb;
                border-radius:10px;
                background:#f8fafc;
            `;

            let conteudo = `

                <strong>
                    ${concluida ? "✅" : "📖"}
                    ${aula.titulo}
                </strong>

            `;

            // ==============================
            // VÍDEO
            // ==============================

            if (aula.link_youtube) {

                conteudo += `

                    <br><br>

                    <a
                        href="${aula.link_youtube}"
                        target="_blank"
                        style="
                            display:inline-block;
                            background:#111827;
                            color:white;
                            padding:10px 15px;
                            border-radius:7px;
                            text-decoration:none;
                            font-weight:bold;
                            margin-right:8px;
                            margin-bottom:8px;
                        "
                    >
                        ▶️ Assistir videoaula
                    </a>

                `;
            }

            // ==============================
            // PDF DA AULA
            // ==============================

            if (aula.link_pdf) {

                conteudo += `

                    <a
                        href="${aula.link_pdf}"
                        target="_blank"
                        style="
                            display:inline-block;
                            background:#e5e7eb;
                            color:#374151;
                            padding:10px 15px;
                            border-radius:7px;
                            text-decoration:none;
                            font-weight:bold;
                            margin-right:8px;
                            margin-bottom:8px;
                        "
                    >
                        📄 Abrir PDF
                    </a>

                `;
            }

            // ==============================
            // PDF DE QUESTÕES
            // ==============================

            if (aula.link_questoes) {

                conteudo += `

                    <a
                        href="${aula.link_questoes}"
                        target="_blank"
                        style="
                            display:inline-block;
                            background:#a67c32;
                            color:white;
                            padding:10px 15px;
                            border-radius:7px;
                            text-decoration:none;
                            font-weight:bold;
                            margin-right:8px;
                            margin-bottom:8px;
                        "
                    >
                        📝 Questões da aula
                    </a>

                `;
            }

            // ==============================
            // SLIDES
            // ==============================

            if (aula.link_slide) {

                conteudo += `

                    <a
                        href="${aula.link_slide}"
                        target="_blank"
                        style="
                            display:inline-block;
                            background:#e5e7eb;
                            color:#374151;
                            padding:10px 15px;
                            border-radius:7px;
                            text-decoration:none;
                            font-weight:bold;
                            margin-right:8px;
                            margin-bottom:8px;
                        "
                    >
                        📊 Abrir slides
                    </a>

                `;
            }

            // ==============================
            // BOTÃO DE CONCLUSÃO
            // ==============================

            conteudo += `

                <br><br>

                <button
                    type="button"
                    class="botao-conclusao"
                    style="
                        background:${concluida ? "#a67c32" : "#111827"};
                        color:white;
                        padding:10px 15px;
                        border:none;
                        border-radius:7px;
                        cursor:pointer;
                        font-weight:bold;
                    "
                >
                    ${
                        concluida
                        ? "✅ Aula concluída"
                        : "☑️ Marcar como concluída"
                    }
                </button>

            `;

            aulaDiv.innerHTML =
                conteudo;

            areaAulas.appendChild(
                aulaDiv
            );

            // ==============================
            // BOTÃO CONCLUSÃO
            // ==============================

            const botaoConclusao =
                aulaDiv.querySelector(
                    ".botao-conclusao"
                );

            botaoConclusao.addEventListener(
                "click",
                async function () {

                    botaoConclusao.disabled =
                        true;

                    if (concluida) {

                        const {
                            error
                        } = await supabaseClient
                            .from("progresso_aulas")
                            .update({
                                concluida: false
                            })
                            .eq(
                                "usuario_id",
                                perfil.id
                            )
                            .eq(
                                "aula_id",
                                aula.id
                            );

                        if (error) {

                            console.error(error);

                            alert(
                                "Não foi possível alterar o progresso."
                            );

                            botaoConclusao.disabled =
                                false;

                            return;
                        }

                        concluida = false
             
