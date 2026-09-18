const params = new URLSearchParams(window.location.search);
const cursoId = params.get("id");

const areaCurso = document.getElementById("areaCurso");
const modulosContainer = document.getElementById("modulos");

let perfil = null;
let curso = null;
let matricula = null;
let testeGratis = null;
let progresso = [];
let aulasDoCurso = [];

// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function iniciar() {
    try {
        if (!cursoId) {
            alert("Curso não informado.");
            window.location.href = "aluno.html";
            return;
        }

        // -------------------------------------------------
        // USUÁRIO LOGADO
        // -------------------------------------------------

        const {
            data: { user },
            error: erroUsuario
        } = await supabaseClient.auth.getUser();

        if (erroUsuario || !user) {
            window.location.href = "login.html";
            return;
        }

        // -------------------------------------------------
        // PERFIL
        // -------------------------------------------------

        const {
            data: perfilData,
            error: erroPerfil
        } = await supabaseClient
            .from("perfis")
            .select("*")
            .eq("auth_user_id", user.id)
            .maybeSingle();

        if (erroPerfil || !perfilData) {
            alert("Perfil do usuário não encontrado.");
            return;
        }

        perfil = perfilData;

        // -------------------------------------------------
        // MATRÍCULA
        // -------------------------------------------------

        const {
            data: matriculaData,
            error: erroMatricula
        } = await supabaseClient
            .from("matriculas")
            .select("*")
            .eq("usuario_id", perfil.id)
            .eq("curso_id", cursoId)
            .eq("status", "ativo")
            .maybeSingle();

        if (erroMatricula) {
            console.error("Erro ao verificar matrícula:", erroMatricula);
        }

        matricula = matriculaData;

        // -------------------------------------------------
        // TESTE GRÁTIS
        // -------------------------------------------------

        const agora = new Date().toISOString();

        const {
            data: testeData,
            error: erroTeste
        } = await supabaseClient
            .from("testes_gratis")
            .select("id, data_inicio, data_fim, ativo")
            .eq("usuario_id", perfil.id)
            .eq("ativo", true)
            .gt("data_fim", agora)
            .maybeSingle();

        if (erroTeste) {
            console.error("Erro ao verificar teste grátis:", erroTeste);
        }

        testeGratis = testeData;

        // -------------------------------------------------
        // VERIFICAR ACESSO
        // -------------------------------------------------

        if (!matricula && !testeGratis) {
            alert(
                "Seu período de teste grátis terminou. Para continuar estudando, adquira o curso."
            );

            window.location.href =
                "curso-publico.html?id=" + cursoId;

            return;
        }

        // -------------------------------------------------
        // CURSO
        // -------------------------------------------------

        const {
            data: cursoData,
            error: erroCurso
        } = await supabaseClient
            .from("cursos")
            .select("*")
            .eq("id", cursoId)
            .single();

        if (erroCurso || !cursoData) {
            console.error("Erro ao carregar curso:", erroCurso);
            alert("Não foi possível carregar o curso.");
            return;
        }

        curso = cursoData;

        // -------------------------------------------------
        // CABEÇALHO DO CURSO
        // -------------------------------------------------

        renderizarCabecalho();

        // -------------------------------------------------
        // MÓDULOS
        // -------------------------------------------------

        const {
            data: modulos,
            error: erroModulos
        } = await supabaseClient
            .from("modulos")
            .select("id, nome, ordem")
            .eq("curso_id", cursoId)
            .order("ordem", { ascending: true });

        if (erroModulos) {
            console.error("Erro ao carregar módulos:", erroModulos);
            return;
        }

        // -------------------------------------------------
        // BUSCAR TODAS AS AULAS PELO RPC
        // -------------------------------------------------

        const {
            data: aulas,
            error: erroAulas
        } = await supabaseClient.rpc(
            "buscar_aulas_curso",
            {
                p_curso_id: cursoId
            }
        );

        if (erroAulas) {
            console.error(
                "Erro ao carregar aulas:",
                erroAulas
            );

            modulosContainer.innerHTML = `
                <div class="course-card">
                    <p>
                        Não foi possível carregar as aulas.
                    </p>
                </div>
            `;

            return;
        }

        aulasDoCurso = aulas || [];

        // -------------------------------------------------
        // ORGANIZAR AULAS POR MÓDULO
        // -------------------------------------------------

        const aulasPorModulo = {};

        aulasDoCurso.forEach(function (aula) {
            if (!aulasPorModulo[aula.modulo_id]) {
                aulasPorModulo[aula.modulo_id] = [];
            }

            aulasPorModulo[aula.modulo_id].push(aula);
        });

        // -------------------------------------------------
        // PROGRESSO
        // -------------------------------------------------

        const {
            data: progressoData,
            error: erroProgresso
        } = await supabaseClient
            .from("progresso_aulas")
            .select("aula_id, concluida")
            .eq("usuario_id", perfil.id);

        if (erroProgresso) {
            console.error(
                "Erro ao carregar progresso:",
                erroProgresso
            );
        }

        progresso = progressoData || [];

        // -------------------------------------------------
        // RENDERIZAR MÓDULOS
        // -------------------------------------------------

        modulosContainer.innerHTML = "";

        let totalAulas = 0;
        let aulasConcluidas = 0;

        const estaNoTeste =
            !!testeGratis && !matricula;

        (modulos || []).forEach(function (modulo) {

            const aulas = aulasPorModulo[modulo.id] || [];

            if (estaNoTeste) {
                totalAulas += aulas.filter(
                    function (aula) {
                        return aula.liberada === true;
                    }
                ).length;
            } else {
                totalAulas += aulas.length;
            }

            aulas.forEach(function (aula) {

                if (estaNoTeste && !aula.liberada) {
                    return;
                }

                const concluida = progresso.some(
                    function (item) {
                        return (
                            Number(item.aula_id) === Number(aula.id) &&
                            item.concluida === true
                        );
                    }
                );

                if (concluida) {
                    aulasConcluidas++;
                }
            });

            const moduloDiv = document.createElement("div");

            moduloDiv.className = "course-card";
            moduloDiv.style.marginBottom = "20px";

            const tituloModulo = document.createElement("h3");

            tituloModulo.textContent =
                modulo.nome || "Módulo";

            tituloModulo.style.marginBottom = "20px";

            moduloDiv.appendChild(tituloModulo);

            // ---------------------------------------------
            // AULAS
            // ---------------------------------------------

            if (aulas.length === 0) {

                const vazio = document.createElement("p");

                vazio.textContent =
                    "Nenhuma aula cadastrada neste módulo.";

                vazio.style.opacity = "0.7";

                moduloDiv.appendChild(vazio);

            } else {

                aulas.forEach(function (aula) {

                    const aulaLiberada =
                        aula.liberada === true;

                    const concluida = progresso.some(
                        function (item) {
                            return (
                                Number(item.aula_id) === Number(aula.id) &&
                                item.concluida === true
                            );
                        }
                    );

                    // -----------------------------------------
                    // AULA BLOQUEADA
                    // -----------------------------------------

                    if (!aulaLiberada) {

                        const bloqueio =
                            document.createElement("div");

                        bloqueio.style.background =
                            "#f3f4f6";

                        bloqueio.style.border =
                            "1px solid #d1d5db";

                        bloqueio.style.borderRadius =
                            "10px";

                        bloqueio.style.padding =
                            "16px";

                        bloqueio.style.marginBottom =
                            "12px";

                        bloqueio.style.color =
                            "#1f2937";

                        bloqueio.innerHTML = `
                            <div style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                margin-bottom:8px;
                            ">
                                <span style="
                                    font-size:20px;
                                ">🔒</span>

                                <strong style="
                                    color:#1f2937;
                                    font-size:16px;
                                ">
                                    ${escapeHtml(
                                        aula.titulo || "Aula"
                                    )}
                                </strong>
                            </div>

                            <p style="
                                margin:0 0 12px 0;
                                color:#4b5563;
                                line-height:1.5;
                            ">
                                Esta aula está bloqueada durante o
                                período de teste grátis.
                                Ela será liberada mediante a
                                aquisição do curso.
                            </p>

                            <a
                                href="curso-publico.html?id=${cursoId}"
                                style="
                                    display:inline-block;
                                    background:#c8a355;
                                    color:#080a0f;
                                    padding:10px 15px;
                                    border-radius:8px;
                                    text-decoration:none;
                                    font-weight:700;
                                "
                            >
                                💳 Quero liberar o curso
                            </a>
                        `;

                        moduloDiv.appendChild(bloqueio);

                        return;
                    }

                    // -----------------------------------------
                    // AULA LIBERADA
                    // -----------------------------------------

                    const aulaDiv =
                        document.createElement("div");

                    aulaDiv.style.background =
                        "#f3f4f6";

                    aulaDiv.style.border =
                        "1px solid #d1d5db";

                    aulaDiv.style.borderRadius =
                        "10px";

                    aulaDiv.style.padding =
                        "16px";

                    aulaDiv.style.marginBottom =
                        "12px";

                    aulaDiv.style.color =
                        "#1f2937";

                    // -----------------------------------------
                    // TÍTULO
                    // -----------------------------------------

                    const tituloAula =
                        document.createElement("strong");

                    tituloAula.textContent =
                        aula.titulo || "Aula";

                    tituloAula.style.display =
                        "block";

                    tituloAula.style.color =
                        "#1f2937";

                    tituloAula.style.fontSize =
                        "16px";

                    tituloAula.style.marginBottom =
                        "12px";

                    aulaDiv.appendChild(tituloAula);

                    // -----------------------------------------
                    // YOUTUBE
                    // -----------------------------------------

                    if (aula.link_youtube) {

                        const linkYoutube =
                            document.createElement("a");

                        linkYoutube.href =
                            aula.link_youtube;

                        linkYoutube.target =
                            "_blank";

                        linkYoutube.rel =
                            "noopener noreferrer";

                        linkYoutube.textContent =
                            "▶ Assistir aula";

                        linkYoutube.style.display =
                            "inline-block";

                        linkYoutube.style.marginRight =
                            "10px";

                        linkYoutube.style.marginBottom =
                            "8px";

                        linkYoutube.style.color =
                            "#111827";

                        linkYoutube.style.fontWeight =
                            "700";

                        aulaDiv.appendChild(
                            linkYoutube
                        );
                    }

                    // -----------------------------------------
                    // PDF
                    // -----------------------------------------

                    if (aula.link_pdf) {

                        const linkPdf =
                            document.createElement("a");

                        linkPdf.href =
                            aula.link_pdf;

                        linkPdf.target =
                            "_blank";

                        linkPdf.rel =
                            "noopener noreferrer";

                        linkPdf.textContent =
                            "📄 Material PDF";

                        linkPdf.style.display =
                            "inline-block";

                        linkPdf.style.marginRight =
                            "10px";

                        linkPdf.style.marginBottom =
                            "8px";

                        linkPdf.style.color =
                            "#111827";

                        linkPdf.style.fontWeight =
                            "700";

                        aulaDiv.appendChild(
                            linkPdf
                        );
                    }

                    // -----------------------------------------
                    // QUESTÕES
                    // -----------------------------------------

                    if (aula.link_questoes) {

                        const linkQuestoes =
                            document.createElement("a");

                        linkQuestoes.href =
                            aula.link_questoes;

                        linkQuestoes.target =
                            "_blank";

                        linkQuestoes.rel =
                            "noopener noreferrer";

                        linkQuestoes.textContent =
                            "📝 Questões";

                        linkQuestoes.style.display =
                            "inline-block";

                        linkQuestoes.style.marginRight =
                            "10px";

                        linkQuestoes.style.marginBottom =
                            "8px";

                        linkQuestoes.style.color =
                            "#111827";

                        linkQuestoes.style.fontWeight =
                            "700";

                        aulaDiv.appendChild(
                            linkQuestoes
                        );
                    }

                    // -----------------------------------------
                    // SLIDE
                    // -----------------------------------------

                    if (aula.link_slide) {

                        const linkSlide =
                            document.createElement("a");

                        linkSlide.href =
                            aula.link_slide;

                        linkSlide.target =
                            "_blank";

                        linkSlide.rel =
                            "noopener noreferrer";

                        linkSlide.textContent =
                            "📑 Slides";

                        linkSlide.style.display =
                            "inline-block";

                        linkSlide.style.marginRight =
                            "10px";

                        linkSlide.style.marginBottom =
                            "8px";

                        linkSlide.style.color =
                            "#111827";

                        linkSlide.style.fontWeight =
                            "700";

                        aulaDiv.appendChild(
                            linkSlide
                        );
                    }

                    // -----------------------------------------
                    // BOTÃO CONCLUIR
                    // -----------------------------------------

                    const areaConclusao =
                        document.createElement("div");

                    areaConclusao.style.marginTop =
                        "12px";

                    const botaoConclusao =
                        document.createElement("button");

                    botaoConclusao.textContent =
                        concluida
                            ? "✓ Aula concluída"
                            : "Marcar como concluída";

                    botaoConclusao.style.border =
                        "none";

                    botaoConclusao.style.borderRadius =
                        "8px";

                    botaoConclusao.style.padding =
                        "9px 14px";

                    botaoConclusao.style.cursor =
                        "pointer";

                    botaoConclusao.style.fontWeight =
                        "700";

                    botaoConclusao.style.background =
                        concluida
                            ? "#36c275"
                            : "#c8a355";

                    botaoConclusao.style.color =
                        "#080a0f";

                    botaoConclusao.addEventListener(
                        "click",
                        async function () {

                            await alternarConclusao(
                                aula.id,
                                !concluida,
                                botaoConclusao
                            );
                        }
                    );

                    areaConclusao.appendChild(
                        botaoConclusao
                    );

                    aulaDiv.appendChild(
                        areaConclusao
                    );

                    // -----------------------------------------
                    // IA
                    // -----------------------------------------

                    const areaIA =
                        document.createElement("div");

                    areaIA.style.marginTop =
                        "16px";

                    areaIA.innerHTML = `
                        <div style="
                            border-top:1px solid #d1d5db;
                            padding-top:14px;
                        ">
                            <strong style="
                                display:block;
                                color:#1f2937;
                                margin-bottom:8px;
                            ">
                                🤖 Ficou com dúvida?
                            </strong>

                            <input
                                type="text"
                                placeholder="Digite sua dúvida sobre esta aula..."
                                style="
                                    width:100%;
                                    box-sizing:border-box;
                                    padding:10px;
                                    border:1px solid #cbd5e1;
                                    border-radius:8px;
                                    margin-bottom:8px;
                                "
                            >

                            <button
                                type="button"
                                style="
                                    background:#111827;
                                    color:#fff;
                                    border:none;
                                    border-radius:8px;
                                    padding:9px 14px;
                                    cursor:pointer;
                                    font-weight:700;
                                "
                            >
                                Perguntar à IA
                            </button>

                            <div style="
                                margin-top:10px;
                                color:#374151;
                                line-height:1.5;
                            "></div>
                        </div>
                    `;

                    const inputIA =
                        areaIA.querySelector("input");

                    const botaoIA =
                        areaIA.querySelector("button");

                    const respostaIA =
                        areaIA.querySelector("div div");

                    botaoIA.addEventListener(
                        "click",
                        async function () {

                            const pergunta =
                                inputIA.value.trim();

                            if (!pergunta) {
                                alert(
                                    "Digite sua dúvida primeiro."
                                );
                                return;
                            }

                            botaoIA.disabled = true;

                            botaoIA.textContent =
                                "Consultando...";

                            respostaIA.textContent =
                                "Aguarde...";

                            try {

                                const resposta =
                                    await fetch(
                                        "https://fhglftfemicijeguwcre.supabase.co/functions/v1/ia-duvidas",
                                        {
                                            method: "POST",

                                            headers: {
                                                "Content-Type":
                                                    "application/json"
                                            },

                                            body: JSON.stringify({
                                                pergunta:
                                                    pergunta,

                                                pdfUrl:
                                                    aula.link_pdf || ""
                                            })
                                        }
                                    );

                                const dados =
                                    await resposta.json();

                                if (!resposta.ok) {
                                    throw new Error(
                                        dados.error ||
                                        "Erro ao consultar a IA."
                                    );
                                }

                                respostaIA.textContent =
                                    dados.resposta ||
                                    dados.answer ||
                                    "Não foi possível obter uma resposta.";

                            } catch (erro) {

                                console.error(
                                    "Erro na IA:",
                                    erro
                                );

                                respostaIA.textContent =
                                    "Não foi possível consultar a IA agora.";
                            }

                            botaoIA.disabled = false;

                            botaoIA.textContent =
                                "Perguntar à IA";
                        }
                    );

                    aulaDiv.appendChild(areaIA);

                    moduloDiv.appendChild(aulaDiv);
                });
            }

            modulosContainer.appendChild(moduloDiv);
        });

        // -------------------------------------------------
        // ATUALIZAR PROGRESSO
        // -------------------------------------------------

        atualizarProgresso(
            aulasConcluidas,
            totalAulas
        );

    } catch (erro) {

        console.error(
            "Erro geral:",
            erro
        );

        alert(
            "Ocorreu um erro ao carregar o curso."
        );
    }
}


// =====================================================
// CABEÇALHO DO CURSO
// =====================================================

function renderizarCabecalho() {

    if (!areaCurso) {
        return;
    }

    const imagemCurso =
        curso.imagem
            ? `
                <img
                    src="${escapeAttribute(curso.imagem)}"
                    alt="${escapeAttribute(curso.nome || "Curso")}"
                    style="
                        width:100%;
                        aspect-ratio:16 / 9;
                        object-fit:cover;
                        display:block;
                        border-radius:12px;
                        margin-bottom:20px;
                    "
                >
            `
            : "";

    const modoAcesso =
        matricula
            ? `
                <div style="
                    display:inline-block;
                    background:#36c275;
                    color:#080a0f;
                    padding:7px 12px;
                    border-radius:999px;
                    font-weight:700;
                    font-size:13px;
                    margin-top:10px;
                ">
                    ✓ CURSO LIBERADO
                </div>
            `
            : `
                <div style="
                    display:inline-block;
                    background:#c8a355;
                    color:#080a0f;
                    padding:7px 12px;
                    border-radius:999px;
                    font-weight:700;
                    font-size:13px;
                    margin-top:10px;
                ">
                    🎁 TESTE GRÁTIS
                </div>
            `;

    let avisoTeste = "";

    if (testeGratis && !matricula) {

        const dataFim =
            new Date(
                testeGratis.data_fim
            );

        avisoTeste = `
            <div style="
                margin-top:16px;
                padding:14px;
                border:1px solid #c8a355;
                border-radius:10px;
                background:#11151d;
            ">
                <strong style="
                    color:#e5c378;
                ">
                    🎁 Você está no período de teste grátis
                </strong>

                <p style="
                    margin:7px 0 0 0;
                    color:#d1d5db;
                ">
                    Durante o teste você pode acessar
                    as primeiras 2 aulas de cada matéria.
                    As demais aulas são liberadas com a
                    aquisição do curso.
                </p>

                <p style="
                    margin:7px 0 0 0;
                    color:#d1d5db;
                ">
                    Teste grátis até:
                    <strong>
                        ${dataFim.toLocaleDateString(
                            "pt-BR"
                        )}
                        às
                        ${dataFim.toLocaleTimeString(
                            "pt-BR",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )}
                    </strong>
                </p>
            </div>
        `;
    }

    areaCurso.innerHTML = `
        ${imagemCurso}

        <h1>
            ${escapeHtml(
                curso.nome || "Curso"
            )}
        </h1>

        ${
            curso.descricao
                ? `
                    <p>
                        ${escapeHtml(
                            curso.descricao
                        )}
                    </p>
                `
                : ""
        }

        ${modoAcesso}

        ${avisoTeste}
    `;
}


// =====================================================
// CONCLUSÃO DA AULA
// =====================================================

async function alternarConclusao(
    aulaId,
    concluida,
    botao
) {

    if (!perfil) {
        return;
    }

    try {

        const {
            data: existente,
            error: erroBusca
        } = await supabaseClient
            .from("progresso_aulas")
            .select("id")
            .eq("usuario_id", perfil.id)
            .eq("aula_id", aulaId)
            .maybeSingle();

        if (erroBusca) {
            throw erroBusca;
        }

        if (existente) {

            const {
                error
            } = await supabaseClient
                .from("progresso_aulas")
                .update({
                    concluida: concluida
                })
                .eq("id", existente.id);

            if (error) {
                throw error;
            }

        } else {

            const {
                error
            } = await supabaseClient
                .from("progresso_aulas")
                .insert({
                    usuario_id: perfil.id,
                    aula_id: aulaId,
                    concluida: concluida
                });

            if (error) {
                throw error;
            }
        }

        // Atualizar botão
        botao.textContent =
            concluida
                ? "✓ Aula concluída"
                : "Marcar como concluída";

        botao.style.background =
            concluida
                ? "#36c275"
                : "#c8a355";

        // Atualizar progresso
        const progressoExistente =
            progresso.find(
                function (item) {
                    return Number(item.aula_id) === Number(aulaId);
                }
            );

        if (progressoExistente) {

            progressoExistente.concluida =
                concluida;

        } else {

            progresso.push({
                aula_id: aulaId,
                concluida: concluida
            });
        }

        recalcularProgresso();

    } catch (erro) {

        console.error(
            "Erro ao salvar progresso:",
            erro
        );

        alert(
            "Não foi possível salvar o progresso."
        );
    }
}


// =====================================================
// RECALCULAR PROGRESSO
// =====================================================

function recalcularProgresso() {

    const estaNoTeste =
        !!testeGratis && !matricula;

    const aulasConsideradas =
        aulasDoCurso.filter(
            function (aula) {

                if (estaNoTeste) {
                    return aula.liberada === true;
                }

                return true;
            }
        );

    const total =
        aulasConsideradas.length;

    let concluidas = 0;

    aulasConsideradas.forEach(
        function (aula) {

            const item =
                progresso.find(
                    function (p) {
                        return (
                            Number(p.aula_id) ===
                            Number(aula.id) &&
                            p.concluida === true
                        );
                    }
                );

            if (item) {
                concluidas++;
            }
        }
    );

    atualizarProgresso(
        concluidas,
        total
    );
}


// =====================================================
// ATUALIZAR BARRA DE PROGRESSO
// =====================================================

function atualizarProgresso(
    concluidas,
    total
) {

    const porcentagem =
        total > 0
            ? Math.round(
                (concluidas / total) * 100
            )
            : 0;

    const areaProgresso =
        document.getElementById(
            "progressoCurso"
        );

    if (!areaProgresso) {
        return;
    }

    areaProgresso.innerHTML = `
        <div style="
            margin-bottom:8px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:10px;
        ">
            <strong>
                Seu progresso
            </strong>

            <span>
                ${porcentagem}%
            </span>
        </div>

        <div style="
            width:100%;
            height:10px;
            background:#1f2937;
            border-radius:999px;
            overflow:hidden;
        ">
            <div style="
                width:${porcentagem}%;
                height:100%;
                background:#c8a355;
                border-radius:999px;
                transition:width .3s ease;
            "></div>
        </div>

        <div style="
            margin-top:6px;
            font-size:13px;
            opacity:.75;
        ">
            ${concluidas} de ${total} aulas concluídas
        </div>
    `;
}


// =====================================================
// SEGURANÇA / ESCAPE DE TEXTO
// =====================================================

function escapeHtml(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(valor) {

    return escapeHtml(valor);
}


// =====================================================
// SAIR
// =====================================================

const botaoSair =
    document.getElementById("sair");

if (botaoSair) {

    botaoSair.addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";
        }
    );
}


// =====================================================
// INICIAR
// =====================================================

iniciar();
