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
    let modoRenovacao = false;


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


        /* -----------------------------------------
           MATRÍCULA INATIVA
        ----------------------------------------- */

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


        /* -----------------------------------------
           MATRÍCULA PERMANENTE
        ----------------------------------------- */

        if (!vencimento) {

            return {
                nome: "Permanente",
                emoji: "♾️",
                classe: "permanente",
                cor: "#c8a355",
                fundo: "rgba(200,163,85,0.12)"
            };
        }


        /*
         * Trabalhamos somente com a parte
         * YYYY-MM-DD para evitar problemas
         * de horário/fuso.
         */

        const dataVencimento =
            String(vencimento).substring(0, 10);


        const hoje =
            dataHoje();


        /* -----------------------------------------
           VENCIDA
        ----------------------------------------- */

        if (dataVencimento < hoje) {

            return {
                nome: "Vencida",
                emoji: "🔴",
                classe: "vencida",
                cor: "#ef4444",
                fundo: "rgba(239,68,68,0.12)"
            };
        }


        /* -----------------------------------------
           VENCENDO
           Até 7 dias
        ----------------------------------------- */

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


        /* -----------------------------------------
           ATIVA
        ----------------------------------------- */

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
       HTML DA SITUAÇÃO DA MATRÍCULA
    ========================================================= */

    function htmlSituacaoMatricula(matricula) {

        const situacao =
            situacaoMatricula(
                matricula
            );


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
                    · vence ${
                        escapeHTML(
                            formatarDataExibicao(
                                vencimento
                            )
                        )
                    }
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
                ${escapeHTML(
                    situacao.nome
                )}
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
                document.createElement(
                    "div"
                );

            resumo.id =
                "resumoMatriculas";


            resumo.style.display =
                "grid";

            resumo.style.gridTemplateColumns =
                "repeat(5, minmax(0, 1fr))";

            resumo.style.gap =
                "14px";

            resumo.style.margin =
                "22px 0";


            lista.parentNode.insertBefore(
                resumo,
                lista
            );
        }


        let ativas = 0;
        let vencendo = 0;
        let vencidas = 0;
        let permanentes = 0;
        let inativas = 0;


        matriculas.forEach(
            function (matricula) {

                const situacao =
                    situacaoMatricula(
                        matricula
                    );


                if (
                    situacao.classe ===
                    "ativa"
                ) {

                    ativas++;

                } else if (
                    situacao.classe ===
                    "vencendo"
                ) {

                    vencendo++;

                } else if (
                    situacao.classe ===
                    "vencida"
                ) {

                    vencidas++;

                } else if (
                    situacao.classe ===
                    "permanente"
                ) {

                    permanentes++;

                } else {

                    inativas++;
                }

            }
        );


        resumo.innerHTML = `

            <div
                style="
                    border:1px solid rgba(54,194,117,.35);
                    background:rgba(54,194,117,.06);
                    border-radius:16px;
                    padding:14px;
                "
            >
                <div
                    style="
                        color:#36c275;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    🟢 ATIVAS
                </div>

                <div
                    style="
                        color:#fff;
                        font-size:28px;
                        font-weight:800;
                        margin-top:6px;
                    "
                >
                    ${ativas}
                </div>
            </div>


            <div
                style="
                    border:1px solid rgba(245,158,11,.35);
                    background:rgba(245,158,11,.06);
                    border-radius:16px;
                    padding:14px;
                "
            >
                <div
                    style="
                        color:#f59e0b;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    🟠 VENCENDO
                </div>

                <div
                    style="
                        color:#fff;
                        font-size:28px;
                        font-weight:800;
                        margin-top:6px;
                    "
                >
                    ${vencendo}
                </div>
            </div>


            <div
                style="
                    border:1px solid rgba(239,68,68,.35);
                    background:rgba(239,68,68,.06);
                    border-radius:16px;
                    padding:14px;
                "
            >
                <div
                    style="
                        color:#ef4444;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    🔴 VENCIDAS
                </div>

                <div
                    style="
                        color:#fff;
                        font-size:28px;
                        font-weight:800;
                        margin-top:6px;
                    "
                >
                    ${vencidas}
                </div>
            </div>


            <div
                style="
                    border:1px solid rgba(200,163,85,.35);
                    background:rgba(200,163,85,.06);
                    border-radius:16px;
                    padding:14px;
                "
            >
                <div
                    style="
                        color:#c8a355;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    ♾️ PERMANENTES
                </div>

                <div
                    style="
                        color:#fff;
                        font-size:28px;
                        font-weight:800;
                        margin-top:6px;
                    "
                >
                    ${permanentes}
                </div>
            </div>


            <div
                style="
                    border:1px solid rgba(115,124,139,.35);
                    background:rgba(115,124,139,.06);
                    border-radius:16px;
                    padding:14px;
                "
            >
                <div
                    style="
                        color:#8d96a5;
                        font-size:12px;
                        font-weight:700;
                    "
                >
                    ⚫ INATIVAS
                </div>

                <div
                    style="
                        color:#fff;
                        font-size:28px;
                        font-weight:800;
                        margin-top:6px;
                    "
                >
                    ${inativas}
                </div>
            </div>

        `;
    }


    /* =========================================================
       ABRIR MODAL
    ========================================================= */

    function abrirModalMatricula(
        aluno,
        matricula = null,
        renovacao = false
    ) {

        modoRenovacao =
            renovacao === true;


        modal.style.display =
            "flex";


        alunoMatriculaNome.textContent =
            aluno.nome || "Aluno";


        matriculaUsuarioId.value =
            aluno.id;


        matriculaId.value =
            matricula
                ? matricula.id
                : "";


        mensagemMatricula.textContent =
            "";


        /* -----------------------------------------
           CURSO
        ----------------------------------------- */

        if (matricula) {

            matriculaCurso.value =
                pegarCursoId(
                    matricula
                );

        } else {

            matriculaCurso.value =
                "";
        }


        /* -----------------------------------------
           STATUS
        ----------------------------------------- */

        matriculaStatus.value =
            "ativo";


        /* -----------------------------------------
           DATA DE INÍCIO
        ----------------------------------------- */

        if (
            modoRenovacao
        ) {

            /*
             * Na renovação, a nova matrícula
             * começa hoje.
             */

            matriculaInicio.value =
                dataHoje();

        } else if (
            matricula &&
            matricula.data_inicio
        ) {

            matriculaInicio.value =
                formatarDataInput(
                    matricula.data_inicio
                );

        } else {

            matriculaInicio.value =
                dataHoje();
        }


        /* -----------------------------------------
           DATA DE VENCIMENTO
        ----------------------------------------- */

        if (
            matricula &&
            matricula.data_vencimento &&
            !modoRenovacao
        ) {

            matriculaVencimento.value =
                formatarDataInput(
                    matricula.data_vencimento
                );

        } else {

            matriculaVencimento.value =
                "";
        }


        /* -----------------------------------------
           VALOR
        ----------------------------------------- */

        if (
            matricula &&
            pegarValor(matricula) !== null &&
            pegarValor(matricula) !== undefined &&
            !modoRenovacao
        ) {

            matriculaValor.value =
                pegarValor(
                    matricula
                );

        } else {

            matriculaValor.value =
                "";
        }


        /* -----------------------------------------
           RENOVAÇÃO
        ----------------------------------------- */

        if (
            modoRenovacao
        ) {

            matriculaStatus.value =
                "ativo";

            matriculaVencimento.value =
                "";

            matriculaValor.value =
                "";

            matriculaPermanente.checked =
                false;

        } else {

            matriculaPermanente.checked =
                !matricula ||
                !matricula.data_vencimento;
        }


        atualizarCamposPermanente();


        /* -----------------------------------------
           TÍTULO DO MODAL
        ----------------------------------------- */

        const titulo =
            modal.querySelector(
                ".modal-titulo"
            );


        if (titulo) {

            titulo.textContent =
                modoRenovacao
                    ? "🔄 Renovar matrícula"
                    : "⚙️ Gerenciar matrícula";
        }
    }


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    function fecharModalMatricula() {

        modal.style.display =
            "none";


        modoRenovacao =
            false;


        formMatricula.reset();


        matriculaId.value =
            "";


        matriculaUsuarioId.value =
            "";


        mensagemMatricula.textContent =
            "";


        atualizarCamposPermanente();
    }


    /* =========================================================
       FECHAR PELOS BOTÕES
    ========================================================= */

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
                event.target ===
                modal
            ) {

                fecharModalMatricula();

            }

        }
    );


    /* =========================================================
       PRÓXIMA PARTE
       SALVAMENTO + RENOVAÇÃO
    ========================================================= */    /* =========================================================
       CAMPOS DA MATRÍCULA PERMANENTE
    ========================================================= */

    function atualizarCamposPermanente() {

        const permanente =
            matriculaPermanente.checked;


        if (permanente) {

            if (campoVencimento) {
                campoVencimento.style.display =
                    "none";
            }


            if (campoValor) {
                campoValor.style.display =
                    "none";
            }


            if (avisoPermanente) {

                avisoPermanente.style.display =
                    "block";
            }


            matriculaVencimento.value =
                "";


            matriculaValor.value =
                "0";


            matriculaVencimento.disabled =
                true;


            matriculaValor.disabled =
                true;

        } else {

            if (campoVencimento) {
                campoVencimento.style.display =
                    "";
            }


            if (campoValor) {
                campoValor.style.display =
                    "";
            }


            if (avisoPermanente) {

                avisoPermanente.style.display =
                    "none";
            }


            matriculaVencimento.disabled =
                false;


            matriculaValor.disabled =
                false;


            /*
             * Na renovação, a matrícula comum
             * precisa obrigatoriamente de
             * uma nova data de vencimento.
             */
            if (modoRenovacao) {

                matriculaVencimento.required =
                    true;

            } else {

                matriculaVencimento.required =
                    false;
            }
        }
    }


    matriculaPermanente.addEventListener(
        "change",
        atualizarCamposPermanente
    );


    /* =========================================================
       RENOVAÇÃO
    ========================================================= */
function abrirRenovacao(matricula) {

    if (!matricula) {
        return;
    }


    const usuarioId =
        Number(matricula.usuario_id);


    const cursoId =
        Number(pegarCursoId(matricula));


    const aluno =
        alunos.find(function (item) {

            return Number(item.id) ===
                usuarioId;

        });


    if (!aluno) {
        return;
    }


    /* =====================================================
       DADOS DO ALUNO
    ===================================================== */

    matriculaUsuarioId.value =
        usuarioId;


    alunoMatriculaNome.textContent =
        `${aluno.nome || "Aluno"} · ${aluno.email || ""}`;


    /* =====================================================
       PREENCHER CURSOS
    ===================================================== */

    matriculaCurso.innerHTML = "";


    const opcaoInicial =
        document.createElement("option");


    opcaoInicial.value = "";


    opcaoInicial.textContent =
        "Selecione um curso";


    matriculaCurso.appendChild(
        opcaoInicial
    );


    cursos
        .filter(function (curso) {

            return curso.ativo !== false;

        })
        .forEach(function (curso) {

            const option =
                document.createElement("option");


            option.value =
                curso.id;


            option.textContent =
                curso.nome;


            matriculaCurso.appendChild(
                option
            );

        });


    /* =====================================================
       SELECIONAR O CURSO DA MATRÍCULA
    ===================================================== */

    matriculaCurso.value =
        String(cursoId);


    /* =====================================================
       MATRÍCULA
    ===================================================== */

    matriculaId.value =
        matricula.id || "";


    matriculaStatus.value =
        "ativo";


    /* =====================================================
       RENOVAÇÃO COMEÇA HOJE
    ===================================================== */

    matriculaInicio.value =
        dataHoje();


    /* =====================================================
       VENCIMENTO
       DEIXA VAZIO PARA O SÓCIO INFORMAR
    ===================================================== */

    matriculaVencimento.value =
        "";


    /* =====================================================
       VALOR
       MANTÉM O VALOR ANTERIOR, SE EXISTIR
    ===================================================== */

    const valorAnterior =
        pegarValor(matricula);


    matriculaValor.value =
        valorAnterior !== null &&
        valorAnterior !== undefined
            ? valorAnterior
            : "";


    /* =====================================================
       RENOVAÇÃO NORMAL POR PADRÃO
    ===================================================== */

    matriculaPermanente.checked =
        false;


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


    /* =====================================================
       TÍTULO
    ===================================================== */

    const titulo =
        modal.querySelector(".modal-titulo");


    if (titulo) {

        titulo.textContent =
            "Renovar matrícula";

    }


    mensagemMatricula.textContent =
        "";


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    modal.classList.add(
        "aberto"
    );
}
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
                .trim()
                .toLowerCase();


            const dataInicio =
                matriculaInicio.value ||
                null;


            const permanente =
                matriculaPermanente.checked;


            const dataVencimento =
                permanente
                    ? null
                    : (
                        matriculaVencimento.value ||
                        null
                    );


            let valor =
                matriculaValor.value;


            if (
                valor === "" ||
                valor === null ||
                valor === undefined
            ) {

                valor = 0;

            } else {

                valor =
                    Number(valor);
            }


            /* -----------------------------------------
               VALIDAÇÕES BÁSICAS
            ----------------------------------------- */

            if (
                !usuarioId ||
                !cursoId ||
                !dataInicio
            ) {

                mensagemMatricula.textContent =
                    "Preencha curso e data de início.";

                return;
            }


            /* -----------------------------------------
               RENOVAÇÃO
            ----------------------------------------- */

            if (
                modoRenovacao &&
                !permanente &&
                !dataVencimento
            ) {

                mensagemMatricula.textContent =
                    "Informe a nova data de vencimento.";

                return;
            }


            /* -----------------------------------------
               DATA DE VENCIMENTO
            ----------------------------------------- */

            if (
                !permanente &&
                dataVencimento &&
                dataVencimento < dataInicio
            ) {

                mensagemMatricula.textContent =
                    "A data de vencimento não pode ser anterior à data de início.";

                return;
            }


            /* -----------------------------------------
               ENCONTRAR MATRÍCULA EXISTENTE
            ----------------------------------------- */

            const existente =
                encontrarMatricula(
                    usuarioId,
                    cursoId
                );


            let idExistente =
                matriculaId.value
                    ? Number(
                        matriculaId.value
                    )
                    : null;


            /*
             * Se já existe uma matrícula para
             * este aluno neste curso, usamos
             * o ID dela.
             */

            if (existente) {

                idExistente =
                    Number(
                        existente.id
                    );
            }


            /* -----------------------------------------
               RENOVAÇÃO CONFIRMADA
            ----------------------------------------- */

            if (modoRenovacao) {

                console.log(
                    "Renovando matrícula:",
                    {
                        usuarioId,
                        cursoId,
                        idExistente,
                        dataInicio,
                        dataVencimento,
                        valor
                    }
                );
            }


            /* -----------------------------------------
               RPC
            ----------------------------------------- */

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


            if (
                modoRenovacao
            ) {

                mensagemMatricula.textContent =
                    "🔄 Matrícula renovada com sucesso!";

            } else if (
                permanente
            ) {

                mensagemMatricula.textContent =
                    "♾️ Matrícula permanente criada com sucesso!";

            } else {

                mensagemMatricula.textContent =
                    "Matrícula salva com sucesso!";
            }


            /* -----------------------------------------
               RECARREGAR DADOS
            ----------------------------------------- */

            await carregarMatriculas();


            atualizarResumoMatriculas();


            renderizarAlunos();


            /* -----------------------------------------
               FECHAR MODAL
            ----------------------------------------- */

            setTimeout(
                function () {

                    fecharModalMatricula();

                },
                900
            );

        }
    );


    /* =========================================================
       BOTÃO PARA ABRIR MATRÍCULA
    ========================================================= */

    function abrirGerenciamentoAluno(
        aluno
    ) {

        const matriculasAluno =
            matriculasDoAluno(
                aluno.id
            );


        /*
         * Se o aluno possui apenas uma matrícula,
         * abrimos diretamente.
         */

        if (
            matriculasAluno.length ===
            1
        ) {

            abrirModalMatricula(
                aluno,
                matriculasAluno[0],
                false
            );

            return;
        }


        /*
         * Se não possui matrícula,
         * abrimos o modal vazio.
         */

        if (
            matriculasAluno.length ===
            0
        ) {

            abrirModalMatricula(
                aluno,
                null,
                false
            );

            return;
        }


        /*
         * Se possui vários cursos,
         * o sócio escolhe qual deseja gerenciar.
         */

        let mensagem =
            "Selecione o curso para gerenciar:\n\n";


        matriculasAluno.forEach(
            function (
                matricula,
                indice
            ) {

                const cursoId =
                    pegarCursoId(
                        matricula
                    );


                const situacao =
                    situacaoMatricula(
                        matricula
                    );


                mensagem +=
                    `${indice + 1} - ` +
                    `${nomeCurso(cursoId)} ` +
                    `${situacao.emoji} ` +
                    `${situacao.nome}\n`;
            }
        );


        const escolha =
            prompt(
                mensagem
            );


        if (!escolha) {
            return;
        }


        const indice =
            Number(escolha) - 1;


        if (
            indice < 0 ||
            indice >= matriculasAluno.length
        ) {

            alert(
                "Opção inválida."
            );

            return;
        }


        abrirModalMatricula(
            aluno,
            matriculasAluno[indice],
            false
        );
    }    /* =========================================================
       RENDERIZAR ALUNOS
    ========================================================= */

    function renderizarAlunos() {

        const termo =
            String(
                busca?.value || ""
            )
            .trim()
            .toLowerCase();


        const statusFiltro =
            String(
                filtroStatus?.value || ""
            )
            .trim()
            .toLowerCase();


        const tipoFiltro =
            String(
                filtroTipo?.value || ""
            )
            .trim()
            .toLowerCase();


        let listaFiltrada =
            alunos.filter(
                function (aluno) {

                    const nome =
                        String(
                            aluno.nome || ""
                        )
                        .toLowerCase();


                    const email =
                        String(
                            aluno.email || ""
                        )
                        .toLowerCase();


                    const telefone =
                        String(
                            aluno.telefone || ""
                        )
                        .toLowerCase();


                    const correspondeBusca =
                        !termo ||
                        nome.includes(termo) ||
                        email.includes(termo) ||
                        telefone.includes(termo);


                    const correspondeStatus =
                        !statusFiltro ||
                        String(
                            aluno.status || ""
                        )
                        .toLowerCase() ===
                        statusFiltro;


                    const correspondeTipo =
                        !tipoFiltro ||
                        String(
                            aluno.tipo || ""
                        )
                        .toLowerCase() ===
                        tipoFiltro;


                    return (
                        correspondeBusca &&
                        correspondeStatus &&
                        correspondeTipo
                    );
                }
            );


        contador.textContent =
            `${listaFiltrada.length} aluno${
                listaFiltrada.length === 1
                    ? ""
                    : "s"
            }`;


        if (
            listaFiltrada.length === 0
        ) {

            lista.innerHTML = `
                <div class="mensagem">
                    Nenhum aluno encontrado.
                </div>
            `;

            return;
        }


        lista.innerHTML = "";


        listaFiltrada.forEach(
            function (aluno) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "aluno-card";


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
                            .map(
                                function (
                                    matricula
                                ) {

                                    const cursoId =
                                        pegarCursoId(
                                            matricula
                                        );


                                    const situacao =
                                        situacaoMatricula(
                                            matricula
                                        );


                                    const situacaoHTML =
                                        htmlSituacaoMatricula(
                                            matricula
                                        );


                                    /*
                                     * BOTÃO DE RENOVAÇÃO
                                     *
                                     * Só aparece quando
                                     * a matrícula está vencida.
                                     */

                                    let botaoRenovar =
                                        "";


                                    if (
                                        situacao.classe ===
                                        "vencida"
                                    ) {

                                        botaoRenovar = `
                                            <button
                                                type="button"
                                                class="btn-renovar-matricula"
                                                data-usuario-id="${aluno.id}"
                                                data-matricula-id="${matricula.id}"
                                                style="
                                                    margin-top:8px;
                                                    width:100%;
                                                    border:1px solid rgba(54,194,117,.35);
                                                    background:rgba(54,194,117,.08);
                                                    color:#36c275;
                                                    padding:9px 12px;
                                                    border-radius:10px;
                                                    cursor:pointer;
                                                    font-size:12px;
                                                    font-weight:700;
                                                    text-align:left;
                                                "
                                            >
                                                🔄 Renovar matrícula
                                            </button>
                                        `;
                                    }


                                    return `
                                        <div
                                            style="
                                                padding:10px;
                                                margin-bottom:8px;
                                                border:1px solid rgba(255,255,255,.06);
                                                background:#0e121a;
                                                border-radius:12px;
                                            "
                                        >

                                            <div
                                                style="
                                                    display:flex;
                                                    align-items:center;
                                                    justify-content:space-between;
                                                    gap:8px;
                                                    flex-wrap:wrap;
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

                                            ${botaoRenovar}

                                        </div>
                                    `;
                                }
                            )
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


                const statusAluno =
                    String(
                        aluno.status || ""
                    )
                    .trim()
                    .toLowerCase();


                let classeStatus =
                    "status-inativo";


                let statusTexto =
                    aluno.status ||
                    "Sem status";


                if (
                    statusAluno ===
                    "ativo"
                ) {

                    classeStatus =
                        "status-ativo";

                } else if (
                    statusAluno ===
                    "bloqueado"
                ) {

                    classeStatus =
                        "status-bloqueado";
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


                /* =================================================
                   BOTÃO GERENCIAR MATRÍCULA
                ================================================= */

                const botaoGerenciar =
                    card.querySelector(
                        ".btn-acao"
                    );


                if (botaoGerenciar) {

                    botaoGerenciar.addEventListener(
                        "click",
                        function () {

                            abrirGerenciamentoAluno(
                                aluno
                            );

                        }
                    );
                }


                /* =================================================
                   BOTÕES RENOVAR
                ================================================= */

                const botoesRenovar =
                    card.querySelectorAll(
                        ".btn-renovar-matricula"
                    );


                botoesRenovar.forEach(
                    function (
                        botaoRenovar
                    ) {

                        botaoRenovar.addEventListener(
                            "click",
                            function () {

                                const matriculaId =
                                    Number(
                                        botaoRenovar.dataset.matriculaId
                                    );


                                const matricula =
                                    matriculas.find(
                                        function (
                                            item
                                        ) {

                                            return Number(
                                                item.id
                                            ) ===
                                            matriculaId;

                                        }
                                    );


                                if (!matricula) {

                                    alert(
                                        "Matrícula não encontrada."
                                    );

                                    return;
                                }


                                abrirRenovacao(
                                    aluno,
                                    matricula
                                );

                            }
                        );
                    }
                );


                lista.appendChild(
                    card
                );

            }
        );
    }


    /* =========================================================
       FILTROS
    ========================================================= */

    if (busca) {

        busca.addEventListener(
            "input",
            renderizarAlunos
        );
    }


    if (filtroStatus) {

        filtroStatus.addEventListener(
            "change",
            renderizarAlunos
        );
    }


    if (filtroTipo) {

        filtroTipo.addEventListener(
            "change",
            renderizarAlunos
        );
    }    /* =========================================================
       BOTÃO SAIR
    ========================================================= */

    if (sair) {

        sair.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                await supabaseClient.auth.signOut();


                window.location.href =
                    "login.html";
            }
        );
    }


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
       SEGURANÇA HTML
    ========================================================= */

    function escapeHTML(valor) {

        return String(
            valor ?? ""
        )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
    }


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


    atualizarCamposPermanente();

});
