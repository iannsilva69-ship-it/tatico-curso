// ==============================
// VERIFICAR SÓCIO
// ==============================

async function verificarSocio() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href = "login.html";

        return false;
    }


    const {
        data: perfil,
        error: erroPerfil
    } =
        await supabaseClient
            .from("perfis")
            .select("tipo, status")
            .eq("auth_user_id", user.id)
            .single();


    if (erroPerfil || !perfil) {

        window.location.href = "login.html";

        return false;
    }


    if (
        !["socio", "sócio"].includes(
            (perfil.tipo || "").toLowerCase()
        ) ||
        (perfil.status || "").toLowerCase() !== "ativo"
    ) {

        alert(
            "Acesso permitido somente para sócios."
        );

        window.location.href =
            "aluno.html";

        return false;
    }


    return true;
}


// ==============================
// PEGAR ID DO CURSO
// ==============================

const parametros =
    new URLSearchParams(
        window.location.search
    );


const cursoId =
    parametros.get("id");


// ==============================
// CARREGAR CURSO
// ==============================

async function carregarCurso() {

    if (!cursoId) {

        document.getElementById(
            "nomeCurso"
        ).textContent =
            "Curso não informado";

        return;
    }


    const {
        data: curso,
        error
    } =
        await supabaseClient
            .from("cursos")
            .select("id, nome")
            .eq("id", cursoId)
            .single();


    if (error || !curso) {

        console.error(error);

        document.getElementById(
            "nomeCurso"
        ).textContent =
            "Curso não encontrado";

        return;
    }


    document.getElementById(
        "nomeCurso"
    ).textContent =
        curso.nome || "Curso";
}


// ==============================
// EXCLUIR MÓDULO
// ==============================

async function excluirModulo(
    moduloId,
    nomeModulo
) {

    // ==========================================
    // CONFIRMAÇÃO
    // ==========================================

    const confirmar =
        confirm(
            `Tem certeza que deseja excluir o módulo "${nomeModulo}"?\n\n` +
            `O módulo só poderá ser excluído se não possuir aulas vinculadas.`
        );


    if (!confirmar) {
        return;
    }


    // ==========================================
    // VERIFICAR SE EXISTEM AULAS
    // ==========================================

    const {
        count,
        error: erroAulas
    } =
        await supabaseClient
            .from("aulas")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "modulo_id",
                moduloId
            );


    if (erroAulas) {

        console.error(
            "Erro ao verificar aulas:",
            erroAulas
        );


        alert(
            "Não foi possível verificar se o módulo possui aulas."
        );


        return;
    }


    // ==========================================
    // TEM AULAS VINCULADAS
    // ==========================================

    if (count > 0) {

        alert(
            `Não é possível excluir este módulo.\n\n` +
            `Ele possui ${count} aula(s) vinculada(s).\n\n` +
            `Exclua primeiro as aulas deste módulo e depois exclua o módulo.`
        );


        return;
    }


    // ==========================================
    // EXCLUIR MÓDULO
    // ==========================================

    const {
        error: erroExcluir
    } =
        await supabaseClient
            .from("modulos")
            .delete()
            .eq(
                "id",
                moduloId
            );


    if (erroExcluir) {

        console.error(
            "Erro ao excluir módulo:",
            erroExcluir
        );


        alert(
            "Não foi possível excluir o módulo."
        );


        return;
    }


    // ==========================================
    // SUCESSO
    // ==========================================

    alert(
        "Módulo excluído com sucesso!"
    );


    await carregarModulos();
}


// ==============================
// CARREGAR MÓDULOS
// ==============================

async function carregarModulos() {

    const autorizado =
        await verificarSocio();


    if (!autorizado) {
        return;
    }


    await carregarCurso();


    if (!cursoId) {
        return;
    }


    const area =
        document.getElementById(
            "listaModulos"
        );


    const {
        data: modulos,
        error
    } =
        await supabaseClient
            .from("modulos")
            .select(
                "id, nome, ordem"
            )
            .eq(
                "curso_id",
                cursoId
            )
            .order(
                "ordem",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);


        area.innerHTML = `
            <p>
                Erro ao carregar os módulos.
            </p>
        `;


        return;
    }


    if (
        !modulos ||
        modulos.length === 0
    ) {

        area.innerHTML = `
            <p>
                Nenhum módulo cadastrado ainda.
            </p>
        `;


        return;
    }


    area.innerHTML = "";


    modulos.forEach(
        function (modulo) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "course-card";


            card.innerHTML = `

                <h3>
                    ${modulo.ordem}. ${escapeHtml(
                        modulo.nome
                    )}
                </h3>

                <p>
                    Módulo ${modulo.ordem}
                </p>


                <div
                    style="
                        display:flex;
                        flex-wrap:wrap;
                        gap:10px;
                        margin-top:15px;
                    "
                >

                    <button
                        type="button"
                        class="btn-aulas"
                    >
                        🎓 Gerenciar aulas
                    </button>


                    <button
                        type="button"
                        class="btn-excluir-modulo"
                        style="
                            background:#7f1d1d;
                            color:#fff;
                            border:1px solid #991b1b;
                        "
                    >
                        🗑️ Excluir módulo
                    </button>

                </div>

            `;


            area.appendChild(
                card
            );


            // ==============================
            // BOTÃO GERENCIAR AULAS
            // ==============================

            const botaoAulas =
                card.querySelector(
                    ".btn-aulas"
                );


            botaoAulas.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "aulas-admin.html?id=" +
                        modulo.id;

                }
            );


            // ==============================
            // BOTÃO EXCLUIR
            // ==============================

            const botaoExcluir =
                card.querySelector(
                    ".btn-excluir-modulo"
                );


            botaoExcluir.addEventListener(
                "click",
                async function () {

                    await excluirModulo(
                        modulo.id,
                        modulo.nome
                    );

                }
            );

        }
    );
}


// ==============================
// ABRIR NOVO MÓDULO
// ==============================

document.getElementById(
    "novoModulo"
).addEventListener(
    "click",
    function () {

        document.getElementById(
            "formularioModulo"
        ).style.display =
            "block";


        document.getElementById(
            "nomeModulo"
        ).focus();

    }
);


// ==============================
// CANCELAR
// ==============================

document.getElementById(
    "cancelarModulo"
).addEventListener(
    "click",
    function () {

        document.getElementById(
            "formularioModulo"
        ).style.display =
            "none";


        document.getElementById(
            "moduloForm"
        ).reset();


        document.getElementById(
            "ordemModulo"
        ).value = 1;

    }
);


// ==============================
// SALVAR MÓDULO
// ==============================

document.getElementById(
    "moduloForm"
).addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const mensagem =
            document.getElementById(
                "mensagemModulo"
            );


        const nome =
            document.getElementById(
                "nomeModulo"
            ).value.trim();


        const ordem =
            document.getElementById(
                "ordemModulo"
            ).value;


        if (!cursoId) {

            mensagem.textContent =
                "Curso não informado.";

            return;
        }


        mensagem.textContent =
            "Salvando módulo...";


        const {
            error
        } =
            await supabaseClient
                .from("modulos")
                .insert({

                    curso_id:
                        cursoId,

                    nome:
                        nome,

                    ordem:
                        ordem

                });


        if (error) {

            console.error(error);


            mensagem.textContent =
                "Erro ao salvar o módulo.";


            return;
        }


        mensagem.textContent =
            "Módulo criado com sucesso!";


        document.getElementById(
            "moduloForm"
        ).reset();


        document.getElementById(
            "ordemModulo"
        ).value = 1;


        setTimeout(
            function () {

                document.getElementById(
                    "formularioModulo"
                ).style.display =
                    "none";


                mensagem.textContent =
                    "";


                carregarModulos();

            },
            1000
        );

    }
);


// ==============================
// SAIR
// ==============================

document.getElementById(
    "sair"
).addEventListener(
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


// ==============================
// ESCAPAR HTML
// ==============================

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


// ==============================
// INICIAR
// ==============================

carregarModulos();
