document.addEventListener("DOMContentLoaded", async function () {

    /* =========================================================
       ELEMENTOS DA PÁGINA
    ========================================================= */

    const busca = document.getElementById("buscaAluno");
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroTipo = document.getElementById("filtroTipo");
    const lista = document.getElementById("listaAlunos");
    const contador = document.getElementById("contadorAlunos");
    const sair = document.getElementById("sair");


    /* =========================================================
       MODAL
    ========================================================= */

    const modal = document.getElementById("modalMatricula");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarMatricula =
        document.getElementById("cancelarMatricula");

    const formMatricula =
        document.getElementById("formMatricula");

    const matriculaId =
        document.getElementById("matriculaId");

    const matriculaUsuarioId =
        document.getElementById("matriculaUsuarioId");

    const matriculaCurso =
        document.getElementById("matriculaCurso");

    const matriculaStatus =
        document.getElementById("matriculaStatus");

    const matriculaInicio =
        document.getElementById("matriculaInicio");

    const matriculaVencimento =
        document.getElementById("matriculaVencimento");

    const matriculaValor =
        document.getElementById("matriculaValor");

    const matriculaPermanente =
        document.getElementById("matriculaPermanente");

    const campoVencimento =
        document.getElementById("campoVencimento");

    const campoValor =
        document.getElementById("campoValor");

    const avisoPermanente =
        document.getElementById("avisoPermanente");

    const alunoMatriculaNome =
        document.getElementById("alunoMatriculaNome");

    const mensagemMatricula =
        document.getElementById("mensagemMatricula");


    /* =========================================================
       DADOS
    ========================================================= */

    let alunos = [];
    let cursos = [];
    let matriculas = [];


    /* =========================================================
       VERIFICAR SÓCIO
    ========================================================= */

    async function verificarSocio() {

        const {
            data: {
                session
            }
        } = await supabaseClient.auth.getSession();


        if (!session) {

            window.location.href = "login.html";

            return false;
        }


        const {
            data: perfil,
            error
        } = await supabaseClient
            .from("perfis")
            .select("id, nome, tipo, status")
            .eq("auth_user_id", session.user.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Erro ao verificar sócio:",
                error
            );

            alert(
                "Erro ao verificar seu acesso."
            );

            window.location.href = "admin.html";

            return false;
        }


        const tipo =
            String(perfil?.tipo || "")
                .trim()
                .toLowerCase();


        const status =
            String(perfil?.status || "")
                .trim()
                .toLowerCase();


        if (
            !perfil ||
            !["socio", "sócio"].includes(tipo) ||
            status !== "ativo"
        ) {

            alert(
                "Acesso permitido somente para sócios ativos."
            );

            window.location.href = "aluno.html";

            return false;
        }


        return true;
    }


    /* =========================================================
       CARREGAR CURSOS
    ========================================================= */

    async function carregarCursos() {

        const {
            data,
            error
        } = await supabaseClient
            .from("cursos")
            .select("id, nome, ativo")
            .order("nome", {
                ascending: true
            });


        if (error) {

            console.error(
                "Erro ao carregar cursos:",
                error
            );

            cursos = [];

            return;
        }


        cursos = data || [];
    }


    /* =========================================================
       CARREGAR ALUNOS
    ========================================================= */

    async function carregarAlunos() {

        lista.innerHTML = `
            <div class="mensagem">
                Carregando alunos...
            </div>
        `;


        const {
            data,
            error
        } = await supabaseClient
            .from("perfis")
            .select(`
                id,
                nome,
                telefone,
                email,
                tipo,
                status
            `)
            .order("nome", {
                ascending: true
            });


        if (error) {

            console.error(
                "Erro ao carregar alunos:",
                error
            );


            lista.innerHTML = `
                <div class="mensagem erro">
                    Não foi possível carregar os alunos.
                    <br><br>
                    ${escapeHTML(
                        error.message || ""
                    )}
                </div>
            `;

            return;
        }


        alunos = data || [];

        await carregarMatriculas();

        atualizarResumoMatriculas();

        renderizarAlunos();
    }


    /* =========================================================
       CARREGAR MATRÍCULAS
       USA A RPC EXISTENTE
    ========================================================= */

    async function carregarMatriculas() {

        const {
            data,
            error
        } = await supabaseClient.rpc(
            "listar_matriculas_admin"
        );


        if (error) {

            console.error(
                "Erro ao carregar matrículas:",
                error
            );

            matriculas = [];

            return;
        }


        matriculas = data || [];
    }


    /* =========================================================
       ENCONTRAR MATRÍCULAS DO ALUNO
    ========================================================= */

    function matriculasDoAluno(usuarioId) {

        return matriculas.filter(function (matricula) {

            return Number(
                matricula.usuario_id
            ) === Number(usuarioId);

        });
    }


    /* =========================================================
       PEGAR ID DO CURSO
       ACEITA OS DOIS NOMES PARA COMPATIBILIDADE
    ========================================================= */

    function pegarCursoId(matricula) {

        return (
            matricula.curso_id ??
            matricula.id_curso ??
            null
        );
    }


    /* =========================================================
       PEGAR VALOR
       ACEITA OS DOIS NOMES PARA COMPATIBILIDADE
    ========================================================= */

    function pegarValor(matricula) {

        return (
            matricula.valor ??
            matricula.valencia ??
            matricula.valentia ??
            null
        );
    }


    /* =========================================================
       NOME DO CURSO
    ========================================================= */

    function nomeCurso(cursoId) {

        const curso = cursos.find(function (item) {

            return Number(item.id) === Number(cursoId);

        });


        return curso?.nome ||
            "Curso não encontrado";
    }


    /* =========================================================
       ENCONTRAR MATRÍCULA POR ALUNO + CURSO
    ========================================================= */

    function encontrarMatricula(
        usuarioId,
        cursoId
    ) {

        return matriculas.find(function (matricula) {

            return (
                Number(matricula.usuario_id) ===
                    Number(usuarioId)
                &&
                Number(pegarCursoId(matricula)) ===
                    Number(cursoId)
            );

        }) || null;
    }


    /* =========================================================
       SITUAÇÃO DA MATRÍCULA

       🟢 Ativa
       🟠 Vencendo
       🔴 Vencida
       ♾️ Permanente
       ⚫ Inativa
    ========================================================= */

    function situacaoMatricula(matricula) {

        const status =
            String(
                matricula.status || ""
            )
                .trim()
                .toLowerCase();


        if (status !== "ativo") {

            return {
                nome: "Inativa",
                emoji: "⚫",
                classe: "inativa",
                cor: "#737c8b",
                fundo: "rgba(115,124,139,0.12)"
            };
        }


        const vencimento =
            matricula.data_vencimento;


        if (!vencimento) {

            return {
                nome: "Permanente",
                emoji: "♾️",
                classe: "permanente",
                cor: "#c8a355",
                fundo: "rgba(200,163,85,0.12)"
            };
        }


        const dataVencimento =
            String(vencimento).substring(0, 10);


        const hoje =
            dataHoje();


        if (dataVencimento < hoje) {

            return {
                nome: "Vencida",
                emoji: "🔴",
                classe: "vencida",
                cor: "#ef4444",
                fundo: "rgba(239,68,68,0.12)"
            };
        }


        const hojeData =
            new Date(
                hoje + "T00:00:00"
            );


        const vencimentoData =
            new Date(
                dataVencimento + "T00:00:00"
            );


        const diferenca =
            Math.ceil(
                (
                    vencimentoData -
                    hojeData
                ) /
                (1000 * 60 * 60 * 24)
            );


        if (diferenca <= 7) {

            return {
                nome: "Vencendo",
                emoji: "🟠",
                classe: "vencendo",
                cor: "#f59e0b",
                fundo: "rgba(245,158,11,0.12)"
            };
        }


        return {
            nome: "Ativa",
            emoji: "🟢",
            classe: "ativa",
            cor: "#36c275",
            fundo: "rgba(54,194,117,0.12)"
        };
    }


    /* =========================================================
       FORMATAR DATA PARA EXIBIÇÃO
    ========================================================= */

    function formatarDataExibicao(valor) {

        if (!valor) {
            return "";
        }


        const texto =
            String(valor).substring(0, 10);


        const partes =
            texto.split("-");


        if (partes.length !== 3) {
            return texto;
        }


        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    /* =========================================================
       HTML DA SITUAÇÃO
    ========================================================= */

    function htmlSituacaoMatricula(matricula) {

        const situacao =
            situacaoMatricula(matricula);


        const vencimento =
            matricula.data_vencimento;


        let dataHTML = "";


        if (vencimento) {

            dataHTML = `
                <span
                    style="
                        color:#8d96a5;
                        font-size:11px;
                        margin-left:4px;
                    "
                >
                    · vence ${escapeHTML(
                        formatarDataExibicao(
                            vencimento
                        )
                    )}
                </span>
            `;
        }


        return `
            <span
                class="matricula-situacao"
                style="
                    display:inline-flex;
                    align-items:center;
                    gap:4px;
                    padding:4px 8px;
                    margin-left:4px;
                    border-radius:999px;
                    font-size:11px;
                    font-weight:700;
                    color:${situacao.cor};
                    background:${situacao.fundo};
                    border:1px solid ${situacao.cor}33;
                    white-space:nowrap;
                "
            >
                ${situacao.emoji}
                ${escapeHTML(situacao.nome)}
            </span>

            ${dataHTML}
        `;
    }


    /* =========================================================
       RESUMO DAS MATRÍCULAS
    ========================================================= */

    function atualizarResumoMatriculas() {

        let resumo =
            document.getElementById(
                "resumoMatriculas"
            );


        if (!resumo) {

            resumo =
                document.createElement("div");

            resumo.id =
                "resumoMatriculas";

            resumo.style.cssText = `
                display:grid;
                grid-template-columns:repeat(5, 1fr);
                gap:10px;
                margin:18px 0;
            `;


            const referencia =
                lista.parentElement;


            referencia.insertBefore(
                resumo,
                lista
            );
        }


        let ativas = 0;
        let vencendo = 0;
        let vencidas = 0;
        let permanentes = 0;
        let inativas = 0;


        matriculas.forEach(function (matricula) {

            const situacao =
                situacaoMatricula(matricula);


            switch (situacao.classe) {

                case "ativa":
                    ativas++;
                    break;

                case "vencendo":
                    vencendo++;
                    break;

                case "vencida":
                    vencidas++;
                    break;

                case "permanente":
                    permanentes++;
                    break;

                case "inativa":
                    inativas++;
                    break;
            }

        });


        resumo.innerHTML = `

            <div style="
                background:#10151e;
                border:1px solid #36c27555;
                border-radius:10px;
                padding:12px;
            ">
                <div style="
                    color:#36c275;
                    font-size:11px;
                    font-weight:700;
                    margin-bottom:5px;
                ">
                    🟢 ATIVAS
                </div>

                <div style="
                    color:#fff;
                    font-size:22px;
                    font-weight:800;
                ">
                    ${ativas}
                </div>
            </div>


            <div style="
                background:#10151e;
                border:1px solid #f59e0b55;
                border-radius:10px;
                padding:12px;
            ">
                <div style="
                    color:#f59e0b;
                    font-size:11px;
                    font-weight:700;
                    margin-bottom:5px;
                ">
                    🟠 VENCENDO
                </div>

                <div style="
                    color:#fff;
                    font-size:22px;
                    font-weight:800;
                ">
                    ${vencendo}
                </div>
            </div>


            <div style="
                background:#10151e;
                border:1px solid #ef444455;
                border-radius:10px;
                padding:12px;
            ">
                <div style="
                    color:#ef4444;
                    font-size:11px;
                    font-weight:700;
                    margin-bottom:5px;
                ">
                    🔴 VENCIDAS
                </div>

                <div style="
                    color:#fff;
                    font-size:22px;
                    font-weight:800;
                ">
                    ${vencidas}
                </div>
            </div>


            <div style="
                background:#10151e;
                border:1px solid #c8a35555;
                border-radius:10px;
                padding:12px;
            ">
                <div style="
                    color:#c8a355;
                    font-size:11px;
                    font-weight:700;
                    margin-bottom:5px;
                ">
                    ♾️ PERMANENTES
                </div>

                <div style="
                    color:#fff;
                    font-size:22px;
                    font-weight:800;
                ">
                    ${permanentes}
                </div>
            </div>


            <div style="
                background:#10151e;
                border:1px solid #737c8b55;
                border-radius:10px;
                padding:12px;
            ">
                <div style="
                    color:#737c8b;
                    font-size:11px;
                    font-weight:700;
                    margin-bottom:5px;
                ">
                    ⚫ INATIVAS
                </div>

                <div style="
                    color:#fff;
                    font-size:22px;
                    font-weight:800;
                ">
                    ${inativas}
                </div>
            </div>

        `;
    }    /* =========================================================
       RENDERIZAR ALUNOS
    ========================================================= */

    function renderizarAlunos() {

        const termo =
            String(
                busca.value || ""
            )
                .trim()
                .toLowerCase();


        const statusSelecionado =
            String(
                filtroStatus.value || ""
            )
                .trim()
                .toLowerCase();


        const tipoSelecionado =
            String(
                filtroTipo.value || ""
            )
                .trim()
                .toLowerCase();


        const filtrados =
            alunos.filter(function (aluno) {

                const nome =
                    String(
                        aluno.nome || ""
                    ).toLowerCase();


                const email =
                    String(
                        aluno.email || ""
                    ).toLowerCase();


                const status =
                    String(
                        aluno.status || ""
                    ).toLowerCase();


                const tipo =
                    String(
                        aluno.tipo || ""
                    ).toLowerCase();


                const correspondeBusca =
                    !termo ||
                    nome.includes(termo) ||
                    email.includes(termo);


                const correspondeStatus =
                    !statusSelecionado ||
                    status === statusSelecionado;


                const correspondeTipo =
                    !tipoSelecionado ||
                    tipo === tipoSelecionado;


                return (
                    correspondeBusca &&
                    correspondeStatus &&
                    correspondeTipo
                );

            });


        contador.textContent =
            filtrados.length;


        if (filtrados.length === 0) {

            lista.innerHTML = `
                <div class="mensagem">
                    Nenhum usuário encontrado.
                </div>
            `;

            return;
        }


        lista.innerHTML = "";


        filtrados.forEach(function (aluno) {

            const card =
                document.createElement("article");


            card.className =
                "aluno-card";


            const statusTexto =
                aluno.status ||
                "Não informado";


            const statusNormalizado =
                String(
                    aluno.status || ""
                )
                    .toLowerCase();


            let classeStatus =
                "outro";


            if (
                statusNormalizado === "ativo"
            ) {

                classeStatus =
                    "ativo";

            } else if (
                statusNormalizado === "inativo"
            ) {

                classeStatus =
                    "inativo";
            }


            const matriculasAluno =
                matriculasDoAluno(
                    aluno.id
                );


            let cursosHTML = "";


            if (
                matriculasAluno.length > 0
            ) {

                cursosHTML =
                    matriculasAluno
                        .map(function (matricula) {

                            const cursoId =
                                pegarCursoId(
                                    matricula
                                );


                            const situacaoHTML =
                                htmlSituacaoMatricula(
                                    matricula
                                );


                            return `
                                <div
                                    class="curso-item"
                                    style="
                                        display:flex;
                                        align-items:center;
                                        flex-wrap:wrap;
                                        gap:5px;
                                        margin-bottom:7px;
                                    "
                                >

                                    <span>
                                        📚
                                        ${escapeHTML(
                                            nomeCurso(
                                                cursoId
                                            )
                                        )}
                                    </span>

                                    ${situacaoHTML}

                                </div>
                            `;

                        })
                        .join("");

            } else {

                cursosHTML = `
                    <span
                        style="
                            color:#737c8b;
                            font-size:12px;
                        "
                    >
                        Nenhuma matrícula encontrada.
                    </span>
                `;
            }


            card.innerHTML = `

                <div class="aluno-topo">

                    <h2 class="aluno-nome">

                        ${escapeHTML(
                            aluno.nome ||
                            "Sem nome"
                        )}

                    </h2>


                    <span
                        class="status ${classeStatus}"
                    >

                        ${escapeHTML(
                            statusTexto
                        )}

                    </span>

                </div>


                <div class="dados">

                    <div class="dado">

                        <span class="dado-label">
                            E-mail
                        </span>

                        <span class="dado-valor">

                            ${escapeHTML(
                                aluno.email ||
                                "Não informado"
                            )}

                        </span>

                    </div>


                    <div class="dado">

                        <span class="dado-label">
                            Telefone
                        </span>

                        <span class="dado-valor">

                            ${escapeHTML(
                                aluno.telefone ||
                                "Não informado"
                            )}

                        </span>

                    </div>


                    <div class="dado">

                        <span class="dado-label">
                            Tipo
                        </span>

                        <span class="dado-valor">

                            ${escapeHTML(
                                aluno.tipo ||
                                "Não informado"
                            )}

                        </span>

                    </div>

                </div>


                <div class="cursos">

                    <span class="dado-label">
                        Cursos / Matrículas
                    </span>

                    <div
                        style="
                            margin-top:8px;
                        "
                    >
                        ${cursosHTML}
                    </div>

                </div>


                <div class="acoes-aluno">

                    <button
                        type="button"
                        class="btn-acao"
                        data-usuario-id="${aluno.id}"
                    >
                        ⚙️ Gerenciar matrícula
                    </button>

                </div>

            `;


            const botao =
                card.querySelector(
                    ".btn-acao"
                );


            botao.addEventListener(
                "click",
                function () {

                    abrirModalMatricula(
                        aluno.id
                    );

                }
            );


            lista.appendChild(card);

        });

    }


    /* =========================================================
       ABRIR MODAL
    ========================================================= */

    async function abrirModalMatricula(
        usuarioId
    ) {

        const aluno =
            alunos.find(function (item) {

                return Number(item.id) ===
                    Number(usuarioId);

            });


        if (!aluno) {
            return;
        }


        matriculaUsuarioId.value =
            aluno.id;


        alunoMatriculaNome.textContent =
            `${aluno.nome || "Aluno"} · ${aluno.email || ""}`;


        mensagemMatricula.textContent =
            "";


        matriculaId.value = "";

        matriculaCurso.value = "";

        matriculaStatus.value = "ativo";

        matriculaInicio.value =
            dataHoje();

        matriculaVencimento.value = "";

        matriculaValor.value = "";

        matriculaPermanente.checked = false;


        carregarCursosNoSelect();


        const matriculasAluno =
            matriculasDoAluno(
                usuarioId
            );


        if (
            matriculasAluno.length > 0
        ) {

            const primeira =
                matriculasAluno[0];


            preencherFormularioMatricula(
                primeira
            );
        }


        atualizarEstadoPermanente();


        modal.classList.add("aberto");
    }


    /* =========================================================
       PREENCHER FORMULÁRIO
    ========================================================= */

    function preencherFormularioMatricula(
        matricula
    ) {

        if (!matricula) {

            matriculaId.value = "";

            matriculaStatus.value =
                "ativo";

            matriculaInicio.value =
                dataHoje();

            matriculaVencimento.value =
                "";

            matriculaValor.value =
                "";

            matriculaPermanente.checked =
                false;

            atualizarEstadoPermanente();

            return;
        }


        const cursoId =
            pegarCursoId(matricula);


        matriculaId.value =
            matricula.id || "";


        matriculaCurso.value =
            cursoId || "";


        matriculaStatus.value =
            String(
                matricula.status ||
                "ativo"
            )
                .toLowerCase();


        matriculaInicio.value =
            formatarDataInput(
                matricula.data_inicio
            );


        matriculaVencimento.value =
            formatarDataInput(
                matricula.data_vencimento
            );


        const valor =
            pegarValor(matricula);


        matriculaValor.value =
            valor !== null &&
            valor !== undefined
                ? valor
                : "";


        matriculaPermanente.checked =
            !matricula.data_vencimento &&
            Number(valor || 0) === 0;


        atualizarEstadoPermanente();
    }


    /* =========================================================
       CARREGAR CURSOS NO SELECT
    ========================================================= */

    function carregarCursosNoSelect() {

        matriculaCurso.innerHTML = `

            <option value="">
                Selecione um curso
            </option>

        `;


        cursos
            .filter(function (curso) {

                return curso.ativo !== false;

            })
            .forEach(function (curso) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    curso.id;


                option.textContent =
                    curso.nome;


                matriculaCurso.appendChild(
                    option
                );

            });
    }


    /* =========================================================
       TROCAR CURSO
    ========================================================= */

    matriculaCurso.addEventListener(
        "change",
        function () {

            const usuarioId =
                Number(
                    matriculaUsuarioId.value
                );


            const cursoId =
                Number(
                    matriculaCurso.value
                );


            if (
                !usuarioId ||
                !cursoId
            ) {

                matriculaId.value = "";

                return;
            }


            const existente =
                encontrarMatricula(
                    usuarioId,
                    cursoId
                );


            if (existente) {

                preencherFormularioMatricula(
                    existente
                );

            } else {

                matriculaId.value = "";

                matriculaStatus.value =
                    "ativo";

                matriculaInicio.value =
                    dataHoje();

                matriculaVencimento.value =
                    "";

                matriculaValor.value =
                    "";

                matriculaPermanente.checked =
                    false;

                atualizarEstadoPermanente();
            }

        }
    );


    /* =========================================================
       ACESSO PERMANENTE
    ========================================================= */

    function atualizarEstadoPermanente() {

        const permanente =
            matriculaPermanente.checked;


        if (permanente) {

            matriculaVencimento.value =
                "";

            matriculaValor.value =
                "0";


            matriculaVencimento.disabled =
                true;

            matriculaValor.disabled =
                true;


            campoVencimento.classList.add(
                "bloqueado"
            );

            campoValor.classList.add(
                "bloqueado"
            );


            avisoPermanente.style.display =
                "block";

        } else {

            matriculaVencimento.disabled =
                false;

            matriculaValor.disabled =
                false;


            campoVencimento.classList.remove(
                "bloqueado"
            );

            campoValor.classList.remove(
                "bloqueado"
            );


            avisoPermanente.style.display =
                "none";
        }
    }


    matriculaPermanente.addEventListener(
        "change",
        atualizarEstadoPermanente
    );


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    function fecharModalMatricula() {

        modal.classList.remove(
            "aberto"
        );


        formMatricula.reset();


        matriculaId.value = "";

        matriculaUsuarioId.value = "";

        mensagemMatricula.textContent = "";


        matriculaVencimento.disabled =
            false;

        matriculaValor.disabled =
            false;


        campoVencimento.classList.remove(
            "bloqueado"
        );

        campoValor.classList.remove(
            "bloqueado"
        );


        avisoPermanente.style.display =
            "none";
    }


    fecharModal.addEventListener(
        "click",
        fecharModalMatricula
    );


    cancelarMatricula.addEventListener(
        "click",
        fecharModalMatricula
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                fecharModalMatricula();
            }

        }
    );


    /* =========================================================
       SALVAR MATRÍCULA
    ========================================================= */

    formMatricula.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            mensagemMatricula.textContent =
                "Salvando matrícula...";


            const usuarioId =
                Number(
                    matriculaUsuarioId.value
                );


            const cursoId =
                Number(
                    matriculaCurso.value
                );


            const status =
                String(
                    matriculaStatus.value ||
                    "ativo"
                )
                    .toLowerCase();


            const dataInicio =
                matriculaInicio.value ||
                null;


            let dataVencimento =
                matriculaVencimento.value ||
                null;


            let valor =
                matriculaValor.value;


            if (
                matriculaPermanente.checked
            ) {

                dataVencimento = null;

                valor = 0;

            } else {

                if (
                    valor === "" ||
                    valor === null ||
                    valor === undefined
                ) {

                    valor = 0;

                } else {

                    valor = Number(valor);
                }
            }


            if (
                !usuarioId ||
                !cursoId ||
                !dataInicio
            ) {

                mensagemMatricula.textContent =
                    "Preencha curso e data de início.";

                return;
            }


            if (
                !matriculaPermanente.checked &&
                dataVencimento &&
                dataVencimento < dataInicio
            ) {

                mensagemMatricula.textContent =
                    "A data de vencimento não pode ser anterior à data de início.";

                return;
            }


            const existente =
                encontrarMatricula(
                    usuarioId,
                    cursoId
                );


            let idExistente =
                matriculaId.value
                    ? Number(matriculaId.value)
                    : null;


            if (existente) {

                idExistente =
                    Number(existente.id);
            }


            const {
                data,
                error
            } = await supabaseClient.rpc(
                "salvar_matricula",
                {
                    p_matricula_id:
                        idExistente
                            ? idExistente
                            : null,

                    p_usuario_id:
                        usuarioId,

                    p_id_curso:
                        cursoId,

                    p_status:
                        status,

                    p_data_inicio:
                        dataInicio,

                    p_data_vencimento:
                        dataVencimento,

                    p_valencia:
                        valor
                }
            );


            if (error) {

                console.error(
                    "Erro ao salvar matrícula:",
                    error
                );


                mensagemMatricula.textContent =
                    `Erro ao salvar: ${
                        error.message ||
                        "erro desconhecido"
                    }`;

                return;
            }


            console.log(
                "Matrícula salva:",
                data
            );


            mensagemMatricula.textContent =
                matriculaPermanente.checked
                    ? "Matrícula permanente criada com sucesso!"
                    : "Matrícula salva com sucesso!";


            await carregarMatriculas();

            atualizarResumoMatriculas();

            renderizarAlunos();


            setTimeout(
                function () {

                    fecharModalMatricula();

                },
                900
            );

        }
    );


    /* =========================================================
       DATA DE HOJE
    ========================================================= */

    function dataHoje() {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            )
                .padStart(2, "0");


        const dia =
            String(
                hoje.getDate()
            )
                .padStart(2, "0");


        return `${ano}-${mes}-${dia}`;
    }


    /* =========================================================
       FORMATAR DATA PARA INPUT
    ========================================================= */

    function formatarDataInput(valor) {

        if (!valor) {
            return "";
        }


        const texto =
            String(valor);


        if (
            /^\d{4}-\d{2}-\d{2}$/.test(
                texto
            )
        ) {

            return texto;
        }


        const data =
            new Date(valor);


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return "";
        }


        const ano =
            data.getFullYear();


        const mes =
            String(
                data.getMonth() + 1
            )
                .padStart(2, "0");


        const dia =
            String(
                data.getDate()
            )
                .padStart(2, "0");


        return `${ano}-${mes}-${dia}`;
    }


    /* =========================================================
       SEGURANÇA HTML
    ========================================================= */

    function escapeHTML(valor) {

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       FILTROS
    ========================================================= */

    busca.addEventListener(
        "input",
        renderizarAlunos
    );


    filtroStatus.addEventListener(
        "change",
        renderizarAlunos
    );


    filtroTipo.addEventListener(
        "change",
        renderizarAlunos
    );


    /* =========================================================
       SAIR
    ========================================================= */

    sair.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            await supabaseClient.auth.signOut();


            window.location.href =
                "login.html";
        }
    );


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    const autorizado =
        await verificarSocio();


    if (!autorizado) {
        return;
    }


    await carregarCursos();

    await carregarAlunos();

});
