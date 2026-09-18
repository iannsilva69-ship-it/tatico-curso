document.addEventListener("DOMContentLoaded", async function () {

    const busca = document.getElementById("buscaAluno");
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroTipo = document.getElementById("filtroTipo");
    const lista = document.getElementById("listaAlunos");
    const contador = document.getElementById("contadorAlunos");
    const sair = document.getElementById("sair");

    const modal = document.getElementById("modalMatricula");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarMatricula = document.getElementById("cancelarMatricula");

    const formMatricula = document.getElementById("formMatricula");

    const matriculaId = document.getElementById("matriculaId");
    const matriculaUsuarioId = document.getElementById("matriculaUsuarioId");
    const matriculaCurso = document.getElementById("matriculaCurso");
    const matriculaStatus = document.getElementById("matriculaStatus");
    const matriculaInicio = document.getElementById("matriculaInicio");
    const matriculaVencimento = document.getElementById("matriculaVencimento");
    const matriculaValentia = document.getElementById("matriculaValentia");

    const alunoMatriculaNome =
        document.getElementById("alunoMatriculaNome");

    const mensagemMatricula =
        document.getElementById("mensagemMatricula");


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
    ========================================================= */

    async function carregarMatriculas() {

        const {
            data,
            error
        } = await supabaseClient
            .from("matriculas")
            .select(`
                id,
                usuario_id,
                id_curso,
                status,
                data_inicio,
                data_vencimento,
                valentia
            `);


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
                    )
                    .toLowerCase();


                const email =
                    String(
                        aluno.email || ""
                    )
                    .toLowerCase();


                const status =
                    String(
                        aluno.status || ""
                    )
                    .toLowerCase();


                const tipo =
                    String(
                        aluno.tipo || ""
                    )
                    .toLowerCase();


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
                matriculasAluno.length >
                0
            ) {

                cursosHTML =
                    matriculasAluno
                        .map(function (matricula) {

                            const statusMatricula =
                                matricula.status ||
                                "Sem status";


                            return `
                                <span class="curso-item">
                                    📚
                                    ${escapeHTML(
                                        nomeCurso(
                                            matricula.id_curso
                                        )
                                    )}
                                    ·
                                    ${escapeHTML(
                                        statusMatricula
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


        carregarCursosNoSelect();


        const matriculasAluno =
            matriculasDoAluno(
                usuarioId
            );


        if (
            matriculasAluno.length > 0
        ) {

            const matricula =
                matriculasAluno[0];


            matriculaId.value =
                matricula.id || "";


            matriculaCurso.value =
                matricula.id_curso || "";


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


            matriculaValentia.value =
                matricula.valentia ??
                "";

        } else {

            matriculaId.value =
                "";


            matriculaCurso.value =
                "";


            matriculaStatus.value =
                "ativo";


            matriculaInicio.value =
                dataHoje();


            matriculaVencimento.value =
                "";


            matriculaValentia.value =
                "99";

        }


        modal.classList.add("aberto");
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


            const dataVencimento =
                matriculaVencimento.value ||
                null;


            let valentia =
                matriculaValentia.value;


            if (
                valentia === "" ||
                valentia === null
            ) {

                valentia = null;

            } else {

                valentia =
                    Number(valentia);

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


            const dados = {

                usuario_id:
                    usuarioId,

                id_curso:
                    cursoId,

                status:
                    status,

                data_inicio:
                    dataInicio,

                data_vencimento:
                    dataVencimento,

                valentia:
                    valentia

            };


         const idExistente =
    matriculaId.value;

let resultado;

resultado =
    await supabaseClient.rpc(
        "salvar_matricula",
        {
            p_matricula_id:
                idExistente
                    ? Number(idExistente)
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
                valentia
        }
    );

                console.error(
                    "Erro ao salvar matrícula:",
                    resultado.error
                );


                mensagemMatricula.textContent =
                    `Erro ao salvar: ${
                        resultado.error.message ||
                        "erro desconhecido"
                    }`;

                return;
            }


            mensagemMatricula.textContent =
                "Matrícula salva com sucesso!";


            await carregarMatriculas();


            renderizarAlunos();


            setTimeout(
                function () {

                    fecharModalMatricula();

                },
                800
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
