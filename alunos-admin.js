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
    const cancelarMatricula = document.getElementById("cancelarMatricula");

    const formMatricula = document.getElementById("formMatricula");

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
                statusNormalizado ===
                "ativo"
            ) {

                classeStatus =
                    "ativo";

            } else if (
                statusNormalizado ===
                "inativo"
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

                            const statusMatricula =
                                matricula.status ||
                                "Sem status";


                            const cursoId =
                                pegarCursoId(
                                    matricula
                                );


                            const vencimento =
                                matricula.data_vencimento;


                            const permanente =
                                !vencimento &&
                                Number(
                                    pegarValor(matricula)
                                ) === 0;


                            const indicador =
                                permanente
                                    ? "♾️ Permanente"
                                    : statusMatricula;


                            return `
                                <span class="curso-item">

                                    📚
                                    ${escapeHTML(
                                        nomeCurso(
                                            cursoId
                                        )
                                    )}

                                    ·

                                    ${escapeHTML(
                                        indicador
                                    )}

                                </span>
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

                    ${cursosHTML}

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

        matriculaInicio.value = dataHoje();

        matriculaVencimento.value = "";

        matriculaValor.value = "";

        matriculaPermanente.checked = false;


        carregarCursosNoSelect();


        const matriculasAluno =
            matriculasDoAluno(
                usuarioId
            );


        /*
         * Se o aluno já possui matrículas,
         * começamos pela primeira matrícula.
         *
         * O administrador pode trocar o curso.
         * Ao trocar, verificamos automaticamente
         * se existe matrícula naquele curso.
         */

        if (matriculasAluno.length > 0) {

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
       PREENCHER FORMULÁRIO COM MATRÍCULA
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


        /*
         * Consideramos permanente quando:
         *
         * - não existe vencimento
         * - valor é zero
         */

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

                /*
                 * Curso novo:
                 * preparar formulário para
                 * uma nova matrícula.
                 */

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
       ATUALIZAR ACESSO PERMANENTE
    ========================================================= */

    function atualizarEstadoPermanente() {

        const permanente =
            matriculaPermanente.checked;


        if (permanente) {

            /*
             * Matrícula permanente:
             *
             * sem vencimento
             * valor zero
             */

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


        matriculaId.value =
            "";


        matriculaUsuarioId.value =
            "";


        mensagemMatricula.textContent =
            "";


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
       USA A RPC EXISTENTE
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


            /*
             * =====================================================
             * MATRÍCULA PERMANENTE
             * =====================================================
             */

            let dataVencimento =
                matriculaVencimento.value ||
                null;


            let valor =
                matriculaValor.value;


            if (
                matriculaPermanente.checked
            ) {

                dataVencimento =
                    null;

                valor =
                    0;

            } else {

                if (
                    valor === "" ||
                    valor === null ||
                    valor === undefined
                ) {

                    valor =
                        0;

                } else {

                    valor =
                        Number(valor);

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


            /*
             * Verificar se existe matrícula
             * para este aluno neste curso.
             */

            const existente =
                encontrarMatricula(
                    usuarioId,
                    cursoId
                );


            let idExistente =
                matriculaId.value
                    ? Number(matriculaId.value)
                    : null;


            /*
             * Se mudou o curso e esse curso já possui
             * matrícula, usamos a matrícula existente.
             */

            if (existente) {

                idExistente =
                    Number(existente.id);

            }


            /*
             * IMPORTANTE:
             *
             * A RPC atual do projeto recebe:
             *
             * p_id_curso
             * p_valencia
             *
             * Mantemos esses nomes para não quebrar
             * a função SQL que já existe.
             */

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
