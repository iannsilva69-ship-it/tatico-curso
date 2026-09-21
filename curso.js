const params = new URLSearchParams(window.location.search);
const cursoId = params.get("id");

const modulosContainer =
    document.getElementById("modulos");

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

            window.location.href =
                "aluno.html";

            return;
        }


        // =====================================================
        // USUÁRIO LOGADO
        // =====================================================

        const {
            data: { user },
            error: erroUsuario
        } =
            await supabaseClient.auth.getUser();


        if (erroUsuario || !user) {

            window.location.href =
                "login.html";

            return;
        }


        // =====================================================
        // PERFIL
        // =====================================================

        const {
            data: perfilData,
            error: erroPerfil
        } =
            await supabaseClient
                .from("perfis")
                .select("*")
                .eq("auth_user_id", user.id)
                .maybeSingle();


        if (erroPerfil || !perfilData) {

            console.error(
                "Erro ao carregar perfil:",
                erroPerfil
            );

            alert(
                "Perfil do usuário não encontrado."
            );

            return;
        }


        perfil = perfilData;


        // =====================================================
        // MATRÍCULA
        // =====================================================

        const {
            data: matriculaData,
            error: erroMatricula
        } =
            await supabaseClient
                .from("matriculas")
                .select("*")
                .eq("usuario_id", perfil.id)
                .eq("id_curso", cursoId)
                .eq("status", "ativo")
                .maybeSingle();


        if (erroMatricula) {

            console.error(
                "Erro ao verificar matrícula:",
                erroMatricula
            );
        }


        matricula = matriculaData;


        // =====================================================
        // TESTE GRÁTIS
        // =====================================================

        const agora =
            new Date().toISOString();


        const {
            data: testeData,
            error: erroTeste
        } =
            await supabaseClient
                .from("testes_gratis")
                .select(
                    "id, data_inicio, data_fim, ativo"
                )
                .eq("usuario_id", perfil.id)
                .eq("ativo", true)
                .gt("data_fim", agora)
                .maybeSingle();


        if (erroTeste) {

            console.error(
                "Erro ao verificar teste grátis:",
                erroTeste
            );
        }


        testeGratis = testeData;


        // =====================================================
        // VERIFICAR ACESSO
        // =====================================================

        if (!matricula && !testeGratis) {

            alert(
                "Seu período de teste grátis terminou. Para continuar estudando, adquira o curso."
            );

            window.location.href =
                "curso-publico.html?id=" +
                cursoId;

            return;
        }


        // =====================================================
        // CURSO
        // =====================================================

        const {
            data: cursoData,
            error: erroCurso
        } =
            await supabaseClient
                .from("cursos")
                .select("*")
                .eq("id", cursoId)
                .single();


        if (erroCurso || !cursoData) {

            console.error(
                "Erro ao carregar curso:",
                erroCurso
            );

            alert(
                "Não foi possível carregar o curso."
            );

            return;
        }


        curso = cursoData;


        // =====================================================
        // CABEÇALHO
        // =====================================================

        renderizarCabecalho();


        // =====================================================
        // MÓDULOS
        // =====================================================

        const {
            data: modulos,
            error: erroModulos
        } =
            await supabaseClient
                .from("modulos")
                .select(
                    "id, nome, ordem"
                )
                .eq("curso_id", cursoId)
                .order(
                    "ordem",
                    {
                        ascending: true
                    }
                );


        if (erroModulos) {

            console.error(
                "Erro ao carregar módulos:",
                erroModulos
            );

            modulosContainer.innerHTML = `
                <div class="estado-curso">
                    <strong>
                        Não foi possível carregar os módulos.
                    </strong>

                    <p>
                        Tente atualizar a página.
                    </p>
                </div>
            `;

            return;
        }


        // =====================================================
        // BUSCAR AULAS PELO RPC
        // =====================================================

        const {
            data: aulas,
            error: erroAulas
        } =
            await supabaseClient.rpc(
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
                <div class="estado-curso">
                    <strong>
                        Não foi possível carregar as aulas.
                    </strong>

                    <p>
                        Tente atualizar a página.
                    </p>
                </div>
            `;

            return;
        }


        aulasDoCurso =
            aulas || [];


        // =====================================================
        // ORGANIZAR AULAS POR MÓDULO
        // =====================================================

        const aulasPorModulo = {};


        aulasDoCurso.forEach(
            function (aula) {

                if (
                    !aulasPorModulo[aula.modulo_id]
                ) {

                    aulasPorModulo[
                        aula.modulo_id
                    ] = [];
                }


                aulasPorModulo[
                    aula.modulo_id
                ].push(aula);
            }
        );


        // =====================================================
        // PROGRESSO
        // =====================================================

        const {
            data: progressoData,
            error: erroProgresso
        } =
            await supabaseClient
                .from("progresso_aulas")
                .select(
                    "aula_id, concluida"
                )
                .eq(
                    "usuario_id",
                    perfil.id
                );


        if (erroProgresso) {

            console.error(
                "Erro ao carregar progresso:",
                erroProgresso
            );
        }


        progresso =
            progressoData || [];


        // =====================================================
        // RENDERIZAR
        // =====================================================

        modulosContainer.innerHTML = "";


        let totalAulas = 0;

        let aulasConcluidas = 0;


        const estaNoTeste =
            !!testeGratis && !matricula;


        (modulos || []).forEach(
            function (modulo) {

                const aulas =
                    aulasPorModulo[
                        modulo.id
                    ] || [];


                // =================================================
                // CONTAGEM DO PROGRESSO
                // =================================================

                if (estaNoTeste) {

                    totalAulas +=
                        aulas.filter(
                            function (aula) {

                                return (
                                    aula.liberada === true
                                );
                            }
                        ).length;

                } else {

                    totalAulas +=
                        aulas.length;
                }


                aulas.forEach(
                    function (aula) {

                        if (
                            estaNoTeste &&
                            !aula.liberada
                        ) {
                            return;
                        }


                        const concluida =
                            progresso.some(
                                function (item) {

                                    return (
                                        Number(
                                            item.aula_id
                                        ) ===
                                        Number(aula.id) &&
                                        item.concluida === true
                                    );
                                }
                            );


                        if (concluida) {

                            aulasConcluidas++;
                        }
                    }
                );


                // =================================================
                // CARD DO MÓDULO
                // =================================================

                const moduloDiv =
                    document.createElement(
                        "div"
                    );


                moduloDiv.className =
                    "modulo-card";


                const tituloModulo =
                    document.createElement(
                        "h3"
                    );


                tituloModulo.innerHTML = `
                    <span class="icone-modulo">
                        📚
                    </span>

                    ${escapeHtml(
                        modulo.nome ||
                        "Módulo"
                    )}
                `;


                moduloDiv.appendChild(
                    tituloModulo
                );


                // =================================================
                // AULAS
                // =================================================

                if (aulas.length === 0) {

                    const vazio =
                        document.createElement(
                            "div"
                        );


                    vazio.className =
                        "estado-aulas";


                    vazio.innerHTML = `
                        Nenhuma aula cadastrada neste módulo.
                    `;


                    moduloDiv.appendChild(
                        vazio
                    );

                } else {

                    aulas.forEach(
                        function (aula) {

                            const aulaLiberada =
                                aula.liberada === true;


                            const concluida =
                                progresso.some(
                                    function (item) {

                                        return (
                                            Number(
                                                item.aula_id
                                            ) ===
                                            Number(aula.id) &&
                                            item.concluida === true
                                        );
                                    }
                                );


                            // =====================================
                            // AULA BLOQUEADA
                            // =====================================

                            if (!aulaLiberada) {

                                const bloqueio =
                                    document.createElement(
                                        "div"
                                    );


                                bloqueio.className =
                                    "aula-card aula-bloqueada";


                                bloqueio.innerHTML = `

                                    <div class="aula-topo">

                                        <div class="aula-numero bloqueado">
                                            🔒
                                        </div>

                                        <div class="aula-info">

                                            <h4>
                                                ${escapeHtml(
                                                    aula.titulo ||
                                                    "Aula"
                                                )}
                                            </h4>

                                            <span>
                                                Aula bloqueada
                                            </span>

                                        </div>

                                    </div>


                                    <p class="mensagem-bloqueio">

                                        Esta aula está bloqueada durante
                                        o período de teste grátis.

                                    </p>


                                    <p class="mensagem-bloqueio">

                                        As próximas aulas são liberadas
                                        com a aquisição do curso.

                                    </p>


                                    <a
                                        href="curso-publico.html?id=${cursoId}"
                                        class="botao-liberar"
                                    >
                                        💳 Liberar curso
                                    </a>

                                `;


                                moduloDiv.appendChild(
                                    bloqueio
                                );


                                return;
                            }


                            // =====================================
                            // AULA LIBERADA
                            // =====================================

                            const aulaDiv =
                                document.createElement(
                                    "div"
                                );


                            aulaDiv.className =
                                "aula-card";


                            if (concluida) {

                                aulaDiv.classList.add(
                                    "aula-concluida"
                                );
                            }


                            // =====================================
                            // CABEÇALHO DA AULA
                            // =====================================

                            const aulaTopo =
                                document.createElement(
                                    "div"
                                );


                            aulaTopo.className =
                                "aula-topo";


                            const numeroAula =
                                document.createElement(
                                    "div"
                                );


                            numeroAula.className =
                                "aula-numero";


                            numeroAula.textContent =
                                concluida
                                    ? "✓"
                                    : "▶";


                            const aulaInfo =
                                document.createElement(
                                    "div"
                                );


                            aulaInfo.className =
                                "aula-info";


                            const tituloAula =
                                document.createElement(
                                    "h4"
                                );


                            tituloAula.textContent =
                                aula.titulo ||
                                "Aula";


                            const statusAula =
                                document.createElement(
                                    "span"
                                );


                            statusAula.textContent =
                                concluida
                                    ? "Aula concluída"
                                    : "Aula disponível";


                            aulaInfo.appendChild(
                                tituloAula
                            );


                            aulaInfo.appendChild(
                                statusAula
                            );


                            aulaTopo.appendChild(
                                numeroAula
                            );


                            aulaTopo.appendChild(
                                aulaInfo
                            );


                            aulaDiv.appendChild(
                                aulaTopo
                            );


                            // =====================================
                            // LINKS
                            // =====================================

                            const areaLinks =
                                document.createElement(
                                    "div"
                                );


                            areaLinks.className =
                                "aula-links";


                            if (
                                aula.link_youtube
                            ) {

                                areaLinks.appendChild(
                                    criarLink(
                                        aula.link_youtube,
                                        "▶ Assistir aula",
                                        "link-video"
                                    )
                                );
                            }


                            if (
                                aula.link_pdf
                            ) {

                                areaLinks.appendChild(
                                    criarLink(
                                        aula.link_pdf,
                                        "📄 Material PDF",
                                        "link-material"
                                    )
                                );
                            }


                            if (
                                aula.link_questoes
                            ) {

                                areaLinks.appendChild(
                                    criarLink(
                                        aula.link_questoes,
                                        "📝 Questões",
                                        "link-material"
                                    )
                                );
                            }


                            if (
                                aula.link_slide
                            ) {

                                areaLinks.appendChild(
                                    criarLink(
                                        aula.link_slide,
                                        "📑 Slides",
                                        "link-material"
                                    )
                                );
                            }


                            if (
                                areaLinks.children.length
                                > 0
                            ) {

                                aulaDiv.appendChild(
                                    areaLinks
                                );
                            }


                            // =====================================
                            // CONCLUSÃO
                            // =====================================

                            const areaConclusao =
                                document.createElement(
                                    "div"
                                );


                            areaConclusao.className =
                                "area-conclusao";


                            const botaoConclusao =
                                document.createElement(
                                    "button"
                                );


                            botaoConclusao.className =
                                concluida
                                    ? "botao-conclusao concluida"
                                    : "botao-conclusao";


                            botaoConclusao.textContent =
                                concluida
                                    ? "✓ Aula concluída"
                                    : "Marcar como concluída";


                            botaoConclusao.addEventListener(
                                "click",
                                async function () {

                                    botaoConclusao.disabled =
                                        true;


                                    await alternarConclusao(
                                        aula.id,
                                        !concluida,
                                        botaoConclusao
                                    );


                                    botaoConclusao.disabled =
                                        false;
                                }
                            );


                            areaConclusao.appendChild(
                                botaoConclusao
                            );


                            aulaDiv.appendChild(
                                areaConclusao
                            );


                            // =====================================
                            // ÁREA DA IA
                            // =====================================

                            const areaIA =
                                criarAreaIA(
                                    aula
                                );


                            aulaDiv.appendChild(
                                areaIA
                            );


                            moduloDiv.appendChild(
                                aulaDiv
                            );

                        }
                    );
                }


                modulosContainer.appendChild(
                    moduloDiv
                );
            }
        );


        // =====================================================
        // PROGRESSO
        // =====================================================

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
// CRIAR LINK
// =====================================================

function criarLink(
    url,
    texto,
    classe
) {

    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.target = "_blank";

    link.rel =
        "noopener noreferrer";

    link.className =
        classe;

    link.textContent =
        texto;


    return link;
}


// =====================================================
// ÁREA DA IA
// =====================================================

function criarAreaIA(aula) {

    const areaIA =
        document.createElement(
            "div"
        );


    areaIA.className =
        "area-ia";


    areaIA.innerHTML = `

        <div class="ia-titulo">

            <span class="ia-icone">
                🤖
            </span>

            <strong>
                Ficou com dúvida?
            </strong>

        </div>


        <p class="ia-descricao">
            Pergunte sobre esta aula e receba
            uma explicação.
        </p>


        <input
            type="text"
            class="ia-input"
            placeholder="Digite sua dúvida sobre esta aula..."
        >


        <button
            type="button"
            class="ia-botao"
        >
            Perguntar à IA
        </button>


        <div class="ia-resposta"></div>

    `;


    const input =
        areaIA.querySelector(
            ".ia-input"
        );


    const botao =
        areaIA.querySelector(
            ".ia-botao"
        );


    const resposta =
        areaIA.querySelector(
            ".ia-resposta"
        );


    botao.addEventListener(
        "click",
        async function () {

            const pergunta =
                input.value.trim();


            if (!pergunta) {

                alert(
                    "Digite sua dúvida primeiro."
                );

                return;
            }


            botao.disabled =
                true;


            botao.textContent =
                "Consultando...";


            resposta.innerHTML = `
                <div class="ia-carregando">
                    🤖 A IA está analisando sua dúvida...
                </div>
            `;


            try {

                const respostaIA =
                    await fetch(
                        "https://fhglftfemicijeguwcre.supabase.co/functions/v1/ia-duvidas",
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    pergunta:
                                        pergunta,

                                    pdfUrl:
                                        aula.link_pdf ||
                                        ""
                                })
                        }
                    );


                const dados =
                    await respostaIA.json();


                if (!respostaIA.ok) {

                    throw new Error(
                        dados.error ||
                        "Erro ao consultar a IA."
                    );
                }


                resposta.innerHTML = `
                    <div class="ia-resposta-conteudo">
                        ${formatarRespostaIA(
                            dados.resposta ||
                            dados.answer ||
                            "Não foi possível obter uma resposta."
                        )}
                    </div>
                `;


            } catch (erro) {

                console.error(
                    "Erro na IA:",
                    erro
                );


                resposta.innerHTML = `
                    <div class="ia-erro">
                        Não foi possível consultar a IA agora.
                    </div>
                `;
            }


            botao.disabled =
                false;


            botao.textContent =
                "Perguntar à IA";
        }
    );


    return areaIA;
}


// =====================================================
// FORMATAR RESPOSTA DA IA
// =====================================================

function formatarRespostaIA(
    texto
) {

    if (!texto) {
        return "";
    }


    return escapeHtml(
        texto
    ).replace(
        /\n/g,
        "<br>"
    );
}


// =====================================================
// CABEÇALHO DO CURSO
// =====================================================

function renderizarCabecalho() {

    const nomeCurso =
        document.getElementById(
            "nomeCurso"
        );


    const descricaoCurso =
        document.getElementById(
            "descricaoCurso"
        );


    if (nomeCurso) {

        nomeCurso.textContent =
            curso.nome ||
            "Curso";
    }


    if (descricaoCurso) {

        descricaoCurso.textContent =
            curso.descricao ||
            "Prepare-se com conteúdo direcionado para sua aprovação.";
    }


    // =====================================================
    // BADGE DE ACESSO
    // =====================================================

    const cabecalho =
        document.querySelector(
            ".curso-cabecalho-conteudo"
        );


    if (!cabecalho) {
        return;
    }


    const badgeExistente =
        document.getElementById(
            "statusAcessoCurso"
        );


    if (badgeExistente) {

        badgeExistente.remove();
    }


    const badge =
        document.createElement(
            "div"
        );


    badge.id =
        "statusAcessoCurso";


    badge.className =
        matricula
            ? "status-curso liberado"
            : "status-curso teste";


    badge.innerHTML =
        matricula
            ? "✓ CURSO LIBERADO"
            : "🎁 TESTE GRÁTIS";


    cabecalho.appendChild(
        badge
    );


    // =====================================================
    // AVISO DO TESTE
    // =====================================================

    const avisoExistente =
        document.getElementById(
            "avisoTesteCurso"
        );


    if (avisoExistente) {

        avisoExistente.remove();
    }


    if (
        testeGratis &&
        !matricula
    ) {

        const dataFim =
            new Date(
                testeGratis.data_fim
            );


        const aviso =
            document.createElement(
                "div"
            );


        aviso.id =
            "avisoTesteCurso";


        aviso.className =
            "aviso-teste";


        aviso.innerHTML = `

            <strong>
                🎁 Você está no período de teste grátis
            </strong>


            <p>
                Durante o teste você pode acessar
                as primeiras <strong>2 aulas de cada módulo</strong>.
                As demais aulas são liberadas com a aquisição do curso.
            </p>


            <p>
                Teste grátis até:
                <strong>
                    ${dataFim.toLocaleDateString(
                        "pt-BR"
                    )}
                    às
                    ${dataFim.toLocaleTimeString(
                        "pt-BR",
                        {
                            hour:
                                "2-digit",

                            minute:
                                "2-digit"
                        }
                    )}
                </strong>
            </p>

        `;


        cabecalho.appendChild(
            aviso
        );
    }
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
        } =
            await supabaseClient
                .from("progresso_aulas")
                .select("id")
                .eq(
                    "usuario_id",
                    perfil.id
                )
                .eq(
                    "aula_id",
                    aulaId
                )
                .maybeSingle();


        if (erroBusca) {

            throw erroBusca;
        }


        if (existente) {

            const {
                error
            } =
                await supabaseClient
                    .from("progresso_aulas")
                    .update({
                        concluida:
                            concluida
                    })
                    .eq(
                        "id",
                        existente.id
                    );


            if (error) {
                throw error;
            }

        } else {

            const {
                error
            } =
                await supabaseClient
                    .from("progresso_aulas")
                    .insert({
                        usuario_id:
                            perfil.id,

                        aula_id:
                            aulaId,

                        concluida:
                            concluida
                    });


            if (error) {
                throw error;
            }
        }


        // =====================================================
        // ATUALIZAR BOTÃO
        // =====================================================

        botao.textContent =
            concluida
                ? "✓ Aula concluída"
                : "Marcar como concluída";


        botao.className =
            concluida
                ? "botao-conclusao concluida"
                : "botao-conclusao";


        // =====================================================
        // ATUALIZAR MEMÓRIA
        // =====================================================

        const progressoExistente =
            progresso.find(
                function (item) {

                    return (
                        Number(
                            item.aula_id
                        ) ===
                        Number(aulaId)
                    );
                }
            );


        if (progressoExistente) {

            progressoExistente.concluida =
                concluida;

        } else {

            progresso.push({
                aula_id:
                    aulaId,

                concluida:
                    concluida
            });
        }


        // =====================================================
        // ATUALIZAR CARD
        // =====================================================

        const aulaCard =
            botao.closest(
                ".aula-card"
            );


        if (aulaCard) {

            if (concluida) {

                aulaCard.classList.add(
                    "aula-concluida"
                );

            } else {

                aulaCard.classList.remove(
                    "aula-concluida"
                );
            }
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
        !!testeGratis &&
        !matricula;


    const aulasConsideradas =
        aulasDoCurso.filter(
            function (aula) {

                if (estaNoTeste) {

                    return (
                        aula.liberada === true
                    );
                }


                return true;
            }
        );


    const total =
        aulasConsideradas.length;


    let concluidas =
        0;


    aulasConsideradas.forEach(
        function (aula) {

            const item =
                progresso.find(
                    function (p) {

                        return (
                            Number(
                                p.aula_id
                            ) ===
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
// ATUALIZAR PROGRESSO
// =====================================================

function atualizarProgresso(
    concluidas,
    total
) {

    const porcentagem =
        total > 0
            ? Math.round(
                (
                    concluidas /
                    total
                ) * 100
            )
            : 0;


    let areaProgresso =
        document.getElementById(
            "progressoCurso"
        );


    // =====================================================
    // CRIAR ÁREA CASO NÃO EXISTA
    // =====================================================

    if (!areaProgresso) {

        const titulo =
            document.querySelector(
                ".titulo-conteudo"
            );


        if (!titulo) {
            return;
        }


        areaProgresso =
            document.createElement(
                "div"
            );


        areaProgresso.id =
            "progressoCurso";


        areaProgresso.className =
            "progresso-curso";


        titulo.parentNode.insertBefore(
            areaProgresso,
            titulo
        );
    }


    areaProgresso.innerHTML = `

        <div class="progresso-topo">

            <div>

                <span class="progresso-label">
                    SEU PROGRESSO
                </span>

                <strong>
                    ${concluidas}
                    de
                    ${total}
                    aulas concluídas
                </strong>

            </div>


            <span class="progresso-porcentagem">
                ${porcentagem}%
            </span>

        </div>


        <div class="progresso-barra">

            <div
                class="progresso-preenchido"
                style="
                    width:${porcentagem}%;
                "
            ></div>

        </div>

    `;
}


// =====================================================
// SEGURANÇA
// =====================================================

function escapeHtml(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";
    }


    return String(valor)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =====================================================
// SAIR
// =====================================================

const botaoSair =
    document.getElementById(
        "sair"
    );


if (botaoSair) {

    botaoSair.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            await supabaseClient
                .auth
                .signOut();


            window.location.href =
                "login.html";
        }
    );
}


// =====================================================
// INICIAR
// =====================================================

iniciar();
