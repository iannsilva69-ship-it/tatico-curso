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

        areaAulas.innerHTML = "";

        // ==============================
        // CRIAR AULAS
        // ==============================

        aulas.forEach(function (aula) {

            totalAulas++;

            const registroProgresso =
                progresso?.find(
                    function (item) {
                        return item.aula_id === aula.id;
                    }
                );

            const concluida =
                registroProgresso?.concluida === true;

            if (concluida) {
                aulasConcluidas++;
            }

            const aulaDiv =
                document.createElement("div");

            aulaDiv.style.marginTop =
                "20px";

            aulaDiv.style.padding =
                "20px";

            aulaDiv.style.border =
                "1px solid #e5e7eb";

            aulaDiv.style.borderRadius =
                "10px";

            aulaDiv.style.background =
                "#f8fafc";

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
            // BOTÃO CONCLUSÃO
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

            const botao =
                aulaDiv.querySelector(
                    ".botao-conclusao"
                );

            botao.addEventListener(
                "click",
                async function () {

                    botao.disabled = true;

                    // ==============================
                    // DESMARCAR CONCLUSÃO
                    // ==============================

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

                            botao.disabled =
                                false;

                            return;
                        }

                        aulasConcluidas--;

                        botao.textContent =
                            "☑️ Marcar como concluída";

                        botao.style.background =
                            "#111827";

                        botao.disabled =
                            false;

                        atualizarProgresso();

                        return;
                    }

                    // ==============================
                    // SALVAR CONCLUSÃO
                    // ==============================

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

                        botao.disabled =
                            false;

                        return;
                    }

                    aulasConcluidas++;

                    botao.textContent =
                        "✅ Aula concluída";

                    botao.style.background =
                        "#a67c32";

                    botao.disabled =
                        false;

                    atualizarProgresso();

                }
            );

        });

    }

    // ==============================
    // ATUALIZAR PROGRESSO INICIAL
    // ==============================

    atualizarProgresso();

    // ==============================
    // IA - TIRAR DÚVIDAS
    // ==============================

    const botaoIA =
        document.getElementById("perguntarIA");

    const campoPerguntaIA =
        document.getElementById("perguntaIA");

    const areaRespostaIA =
        document.getElementById("respostaIA");


    if (botaoIA && campoPerguntaIA && areaRespostaIA) {

        botaoIA.addEventListener(
            "click",
            async function () {

                const pergunta =
                    campoPerguntaIA.value.trim();

                if (!pergunta) {

                    alert(
                        "Digite sua dúvida primeiro."
                    );

                    return;
                }


                botaoIA.disabled = true;

                botaoIA.textContent =
                    "🤖 Consultando a IA...";


                areaRespostaIA.innerHTML = `
                    <p>
                        Aguarde, estou analisando sua dúvida...
                    </p>
                `;


                try {

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

                                body: JSON.stringify({

                                    pergunta:
                                        pergunta,

                                    contexto:
                                        `
                                        Curso:
                                        ${curso.nome}

                                        Módulo:
                                        Conteúdo da aula.

                                        Use somente o material
                                        disponibilizado para esta aula.
                                        `
                                })
                            }
                        );


                    const dados =
                        await resposta.json();


                    if (!resposta.ok) {

                        throw new Error(
                            dados.erro ||
                            "Erro ao consultar a IA."
                        );
                    }


                    areaRespostaIA.innerHTML = `
                        <div style="
                            margin-top:20px;
                            padding:20px;
                            background:#f3f4f6;
                            border-left:4px solid #a67c32;
                            border-radius:8px;
                        ">

                            <strong>
                                🤖 Resposta da IA
                            </strong>

                            <p style="
                                white-space:pre-wrap;
                                line-height:1.7;
                                margin-top:12px;
                            ">
                                ${dados.resposta}
                            </p>

                        </div>
                    `;

                } catch (erro) {

                    console.error(
                        "Erro ao consultar IA:",
                        erro
                    );

                    areaRespostaIA.innerHTML = `
                        <p style="color:#b91c1c;">
                            Não foi possível consultar a IA.
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
