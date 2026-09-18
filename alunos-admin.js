document.addEventListener("DOMContentLoaded", async function () {

    const busca = document.getElementById("buscaAluno");
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroTipo = document.getElementById("filtroTipo");
    const lista = document.getElementById("listaAlunos");
    const contador = document.getElementById("contadorAlunos");
    const sair = document.getElementById("sair");

    let alunos = [];


    /* =========================================================
       VERIFICAR USUÁRIO
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

            console.error(error);

            alert("Erro ao verificar seu acesso.");

            window.location.href = "admin.html";

            return false;
        }


        if (
            !perfil ||
            !["socio", "sócio"].includes(
                String(perfil.tipo || "").toLowerCase()
            ) ||
            String(perfil.status || "").toLowerCase() !== "ativo"
        ) {

            alert("Acesso permitido somente para sócios ativos.");

            window.location.href = "aluno.html";

            return false;
        }


        return true;
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

            console.error("Erro ao carregar alunos:", error);

            lista.innerHTML = `
                <div class="mensagem erro">
                    Não foi possível carregar os alunos.
                    <br><br>
                    ${error.message || ""}
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

        alunos.forEach(function (aluno) {

            aluno.matriculas = [];

        });


        const {
            data: matriculas,
            error
        } = await supabaseClient
            .from("matriculas")
            .select(`
                usuario_id,
                curso_id,
                status
            `);


        if (error) {

            console.warn(
                "Não foi possível carregar matrículas:",
                error
            );

            return;
        }


        if (!matriculas || matriculas.length === 0) {

            return;
        }


        const idsCursos = [
            ...new Set(
                matriculas
                    .map(function (item) {
                        return item.curso_id;
                    })
                    .filter(Boolean)
            )
        ];


        let cursos = [];


        if (idsCursos.length > 0) {

            const {
                data,
                error: erroCursos
            } = await supabaseClient
                .from("cursos")
                .select("id, nome")
                .in("id", idsCursos);


            if (!erroCursos) {

                cursos = data || [];

            }

        }


        matriculas.forEach(function (matricula) {

            const aluno = alunos.find(function (item) {

                return Number(item.id) === Number(
                    matricula.usuario_id
                );

            });


            if (!aluno) {

                return;
            }


            const curso = cursos.find(function (item) {

                return Number(item.id) === Number(
                    matricula.curso_id
                );

            });


            aluno.matriculas.push({

                curso_id: matricula.curso_id,

                status: matricula.status,

                curso_nome:
                    curso?.nome ||
                    "Curso não encontrado"

            });

        });

    }


    /* =========================================================
       RENDERIZAR
    ========================================================= */

    function renderizarAlunos() {

        const termo = String(
            busca.value || ""
        ).trim().toLowerCase();


        const statusSelecionado =
            String(
                filtroStatus.value || ""
            ).toLowerCase();


        const tipoSelecionado =
            String(
                filtroTipo.value || ""
            ).toLowerCase();


        const filtrados = alunos.filter(function (aluno) {

            const nome = String(
                aluno.nome || ""
            ).toLowerCase();


            const email = String(
                aluno.email || ""
            ).toLowerCase();


            const status = String(
                aluno.status || ""
            ).toLowerCase();


            const tipo = String(
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


        contador.textContent = filtrados.length;


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

            card.className = "aluno-card";


            const statusTexto =
                aluno.status || "Não informado";


            let classeStatus = "outro";


            if (
                String(aluno.status)
                    .toLowerCase() === "ativo"
            ) {

                classeStatus = "ativo";

            } else if (
                String(aluno.status)
                    .toLowerCase() === "inativo"
            ) {

                classeStatus = "inativo";

            }


            const matriculas =
                aluno.matriculas || [];


            let cursosHTML = "";


            if (matriculas.length > 0) {

                cursosHTML = matriculas
                    .map(function (matricula) {

                        return `
                            <span class="curso-item">
                                ${escapeHTML(
                                    matricula.curso_nome
                                )}
                                ·
                                ${escapeHTML(
                                    matricula.status || "Sem status"
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
                            aluno.nome || "Sem nome"
                        )}
                    </h2>

                    <span
                        class="status ${classeStatus}"
                    >
                        ${escapeHTML(statusTexto)}
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

                    <span
                        class="dado-label"
                    >
                        Cursos / Matrículas
                    </span>

                    ${cursosHTML}

                </div>

            `;


            lista.appendChild(card);

        });

    }


    /* =========================================================
       SEGURANÇA CONTRA HTML
    ========================================================= */

    function escapeHTML(valor) {

        return String(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

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

            window.location.href = "login.html";

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


    await carregarAlunos();

});
