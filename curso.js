async function carregarCurso() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();

    if (erroUsuario || !user) {
        window.location.href = "login.html";
        return;
    }

    const parametros =
        new URLSearchParams(window.location.search);

    const cursoId =
        parametros.get("id");

    if (!cursoId) {
        const nomeCurso =
            document.getElementById("nomeCurso");

        if (nomeCurso) {
            nomeCurso.textContent =
                "Curso não encontrado.";
        }

        return;
    }

    // ==============================
    // PERFIL
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
    // MATRÍCULA
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
            "Erro matrícula:",
            erroMatricula
        );
        return;
    }

    if (!matricula) {
        alert(
            "Você não possui acesso a este curso."
        );

        window.location.href =
            "aluno.html";

        return;
    }

    // ==============================
    // CURSO
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
            "Erro curso:",
            erroCurso
        );

        return;
    }

    const nomeCurso =
        document.getElementById("nomeCurso");

    if (nomeCurso) {
        nomeCurso.textContent =
            curso.nome;
    }

    const descricaoCurso =
        document.getElementById(
            "descricaoCurso"
        );

    if (descricaoCurso) {
        descricaoCurso.textContent =
            curso.descricao ||
            "Conteúdo do curso.";
    }

    // ==============================
    // MÓDULOS
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
            "Erro módulos:",
            erroModulos
        );

        const area =
            document.getElementById(
                "modulos"
            );

        if (area) {
            area.innerHTML =
                "<p>Não foi possível carregar os módulos.</p>";
        }

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

    // ==============================
    // PROGRESSO
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
            "Erro progresso:",
            erroProgresso
        );
    }

    let totalAulas = 0;
    let aulasConcluidas = 0;

    // ==============================
    // ÁREA DO PROGRESSO
    // ==============================

    let areaProgresso =
        document.getElementById(
            "progressoCurso"
        );

    if (!areaProgresso) {

        areaProgresso =
            document.createElement("div");

        areaProgresso.id =
            "progressoCurso";

        areaProgresso.style.cssText = `
            background:#111827;
            color:white;
            padding:20px;
            border-radius:12px;
            margin-bottom:25px;
            border:1px solid #a67c32;
        `;

        areaProgresso.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                margin-bottom:10px;
            ">
                <strong>
                    📊 Seu progresso
                </strong>

                <span id="porcentagemProgresso">
                    0%
                </span>
            </div>

            <div style="
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
                        transition:width .3s;
                    "
                ></div>
            </div>
        `;

        areaModulos.parentNode.insertBefore(
            areaProgresso,
            areaModulos
        );
    }

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

    if (!modulos || modulos.length === 0) {

        areaModulos.innerHTML =
            "<p>Este curso ainda não possui conteúdo.</p>";

        return;
    }

    // ==============================
    // PERCORRER MÓDULOS
    // ==============================

    for (const modulo of modulos) {

        const bloco =
            document.createElement("div");

        bloco.className =
            "course-card";

        const tituloModulo =
            document.createElement("h3");

        tituloModulo.textContent =
            modulo.nome;

        bloco.appendChild(
            tituloModulo
        );

        const areaAulas =
            document.createElement("div");

        areaAulas.textContent =
            "Carregando aulas...";

        bloco.appendChild(
            areaAulas
        );

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
            .select(
                "id,titulo,link_youtube,link_pdf,link_questoes,link_slide,ordem"
            )
            .eq("modulo_id", modulo.id)
            .order("ordem", {
                ascending: true
            });

        if (erroAulas) {

            console.error(
                "Erro aulas:",
                erroAulas
            );

            areaAulas.textContent =
                "Erro ao carregar as aulas.";

            continue;
        }

        if (!aulas || aulas.length === 0) {

            areaAulas.textContent =
                "Nenhuma aula cadastrada.";

            continue;
        }

        areaAulas.innerHTML = "";

        // ==============================
        // PERCORRER AULAS
        // ==============================

        aulas.forEach(function (aula) {

            totalAulas++;

            const registro =
                (progresso || []).find(
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
            // AULA
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

            const titulo =
                document.createElement("strong");

            titulo.textContent =
                (concluida ? "✅ " : "📖 ") +
                aula.titulo;

            aulaDiv.appendChild(
                titulo
            );

            // ==============================
            // LINKS
            // ==============================

            const links =
                document.createElement("div");

            links.style.marginTop =
                "15px";

            function criarLink(
                texto,
                url,
                cor
            ) {

                if (!url) {
                    return;
                }

                const link =
                    document.createElement("a");

                link.href =
                    url;

                link.target =
                    "_blank";

                link.rel =
                    "noopener noreferrer";

                link.textContent =
                    texto;

                link.style.cssText =
                    "display:inline-block;" +
                    "background:" + cor + ";" +
                    "color:white;" +
                    "padding:10px 15px;" +
                    "border-radius:7px;" +
                    "text-decoration:none;" +
                    "font-weight:bold;" +
                    "margin-right:8px;" +
                    "margin-bottom:8px;";

                links.appendChild(
                    link
                );
            }

            criarLink(
                "▶️ Assistir videoaula",
                aula.link_youtube,
                "#111827"
            );

            criarLink(
                "📄 Abrir PDF",
                aula.link_pdf,
                "#6b7280"
            );

            criarLink(
                "📝 Questões da aula",
                aula.link_questoes,
                "#a67c32"
            );

            criarLink(
                "📊 Abrir slides",
                aula.link_slide,
                "#6b7280"
            );

            aulaDiv.appendChild(
                links
            );

            // ==============================
            // CONCLUSÃO
            // ==============================

            const botaoConclusao =
                document.createElement("button");

            botaoConclusao.type =
                "button";

            botaoConclusao.textContent =
                concluida
                    ? "✅ Aula concluída"
                    : "☑️ Marcar como concluída";

            botaoConclusao.style.cssText =
                "background:" +
                (
                    concluida
                        ? "#a67c32"
                        : "#111827"
                ) +
                ";color:white;" +
                "padding:10px 15px;" +
                "border:none;" +
                "border-radius:7px;" +
                "cursor:pointer;" +
                "font-weight:bold;" +
                "margin-top:8px;";

            aulaDiv.appendChild(
                botaoConclusao
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

                        concluida =
                            false;

                        aulasConcluidas--;

                        botaoConclusao.textContent =
                            "☑️ Marcar como concluída";

                        botaoConclusao.style.background =
                            "#111827";

                    } else {

                        const {
                            error
                        } = await supabaseClient
                            .from("progresso_aulas")
                            .upsert(
                                {
                                    usuario_id:
                                        perfil.id,

                                    aula_id:
                                        aula.id,

                                    concluida:
                                        true
                                },
                                {
                                    onConflict:
                                        "usuario_id,aula_id"
                                }
                            );

                        if (error) {

                            console.error(error);

                            alert(
                                "Não foi possível salvar o progresso."
                            );

                            botaoConclusao.disabled =
                                false;

                            return;
                        }

                        concluida =
                            true;

                        aulasConcluidas++;

                        botaoConclusao.textContent =
                            "✅ Aula concluída";

                        botaoConclusao.style.background =
                            "#a67c32";
                    }

                    titulo.textContent =
                        (concluida ? "✅ " : "📖 ") +
                        aula.titulo;

                    atualizarProgresso();

                    botaoConclusao.disabled =
                        false;
                }
            );

            // ==============================
            // IA DA AULA
            // ==============================

            if (aula.link_pdf) {

                const areaIA =
                    document.createElement("div");

                areaIA.style.cssText = `
                    margin-top:25px;
                    padding:20px;
                    background:#ffffff;
                    border:1px solid #e5e7eb;
                    border-radius:10px;
                `;

                const tituloIA =
                    document.createElement("strong");

                tituloIA.textContent =
                    "🤖 Tire sua dúvida sobre esta aula";

                tituloIA.style.display =
                    "block";

                tituloIA.style.marginBottom =
                    "10px";

                areaIA.appendChild(
                    tituloIA
                );

                const descricaoIA =
                    document.createElement("p");

                descricaoIA.textContent =
                    "Pergunte sobre o conteúdo do PDF desta aula.";

                descricaoIA.style.cssText =
                    "margin-bottom:12px;color:#374151;";

                areaIA.appendChild(
                    descricaoIA
                );

                const campoPergunta =
                    document.createElement("textarea");

                campoPergunta.placeholder =
                    "Digite sua dúvida sobre o conteúdo desta aula...";

                campoPergunta.rows =
                    4;

                campoPergunta.style.cssText = `
                    width:100%;
                    padding:12px;
                    border:1px solid #d1d5db;
                    border-radius:8px;
                    resize:vertical;
                    font-family:inherit;
                    margin-bottom:10px;
                `;

                areaIA.appendChild(
                    campoPergunta
                );

                const botaoIA =
                    document.createElement("button");

                botaoIA.type =
                    "button";

                botaoIA.textContent =
                    "🤖 Perguntar à IA";

                botaoIA.style.cssText = `
                    background:#111827;
                    color:white;
                    padding:10px 15px;
                    border:none;
                    border-radius:7px;
                    cursor:pointer;
                    font-weight:bold;
                `;

                areaIA.appendChild(
                    botaoIA
                );

                const areaResposta =
                    document.createElement("div");

                areaResposta.style.marginTop =
                    "15px";

                areaIA.appendChild(
                    areaResposta
                );

                aulaDiv.appendChild(
                    areaIA
                );

                // ==============================
                // PERGUNTAR À IA
                // ==============================

                botaoIA.addEventListener(
                    "click",
                    async function () {

                        const pergunta =
                            campoPergunta.value.trim();

                        if (!pergunta) {

                            alert(
                                "Digite sua dúvida primeiro."
                            );

                            return;
                        }

                        botaoIA.disabled =
                            true;

                        botaoIA.textContent =
                            "🤖 Consultando...";

                        areaResposta.innerHTML = `
                            <p>
                                Aguarde, estou analisando o material da aula...
                            </p>
                        `;

                        try {

                            let pdfUrl =
                                aula.link_pdf;

                            // ==============================
                            // GOOGLE DRIVE
                            // ==============================

                            if (
                                pdfUrl.includes(
                                    "drive.google.com/file/d/"
                                )
                            ) {

                                const partes =
                                    pdfUrl.split(
                                        "/file/d/"
                                    );

                                if (
                                    partes.length > 1
                                ) {

                                    const idArquivo =
                                        partes[1]
                                            .split("/")[0]
                                            .split("?")[0];

                                    pdfUrl =
                                        "https://drive.google.com/uc?export=download&id=" +
                                        idArquivo;
                                }
                            }

                            // ==============================
                            // CHAMAR IA
                            // ==============================

                            const resposta =
                                await fetch(
                                    "https://fhglftfemicijeguwcre.supabase.co/functions/v1/ia-duvidas",
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",

                                            "apikey":
                                                SUPABASE_KEY
                                        },

                                        body:
                                            JSON.stringify({
                                                pergunta:
                                                    pergunta,

                                                pdfUrl:
                                                    pdfUrl
                                            })
                                    }
                                );

                            const dados =
                                await resposta.json();

                            if (!resposta.ok) {

                                throw new Error(
                                    dados.erro ||
                                    "Erro ao consultar IA."
                                );
                            }

                            // ==============================
                            // RESPOSTA
                            // ==============================

                            areaResposta.innerHTML =
                                "";

                            const caixa =
                                document.createElement("div");

                            caixa.style.cssText = `
                                padding:20px;
                                background:#f3f4f6;
                                border-left:4px solid #a67c32;
                                border-radius:8px;
                            `;

                            const tituloResposta =
                                document.createElement("strong");

                            tituloResposta.textContent =
                                "🤖 Resposta da IA";

                            const texto =
                                document.createElement("p");

                            texto.textContent =
                                dados.resposta || "";

                            texto.style.cssText = `
                                white-space:pre-wrap;
                                line-height:1.7;
                                margin-top:12px;
                                color:#111827;
                            `;

                            caixa.appendChild(
                                tituloResposta
                            );

                            caixa.appendChild(
                                texto
                            );

                            areaResposta.appendChild(
                                caixa
                            );

                        } catch (erro) {

                            console.error(
                                "Erro ao consultar IA:",
                                erro
                            );

                            areaResposta.innerHTML = `
                                <p style="
                                    color:#b91c1c;
                                ">
                                    Não foi possível consultar a IA.
                                    Tente novamente.
                                </p>
                            `;

                        } finally {

                            botaoIA.disabled =
                                false;

                            botaoIA.textContent =
                                "🤖 Perguntar à IA";
                        }
                    }
                );
            }

            areaAulas.appendChild(
                aulaDiv
            );

        });
    }

    atualizarProgresso();
}


// ==============================
// BOTÃO SAIR
// ==============================

const botaoSair =
    document.getElementById("sair");

if (botaoSair) {

    botaoSair.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";
        }
    );
}


// ==============================
// INICIAR
// ==============================

carregarCurso();
