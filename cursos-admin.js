// =========================================================
// TÁTICOS CURSO - GERENCIAR CURSOS
// Upload de capas pelo celular
// =========================================================


// =========================================================
// VERIFICAR SÓCIO
// =========================================================

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
    } = await supabaseClient
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
        )
        ||
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



// =========================================================
// CONFIGURAÇÕES DO UPLOAD
// =========================================================

const BUCKET_CAPAS = "capas-cursos";

const TAMANHO_MAXIMO =
    10 * 1024 * 1024;


// =========================================================
// VALIDAR IMAGEM
// =========================================================

function validarImagem(file) {

    if (!file) {

        return {
            valido: false,
            mensagem: "Nenhuma imagem selecionada."
        };
    }


    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !tiposPermitidos.includes(
            file.type
        )
    ) {

        return {
            valido: false,
            mensagem:
                "Escolha uma imagem JPG, PNG ou WEBP."
        };
    }


    if (
        file.size >
        TAMANHO_MAXIMO
    ) {

        return {
            valido: false,
            mensagem:
                "A imagem deve ter no máximo 10 MB."
        };
    }


    return {
        valido: true
    };
}



// =========================================================
// CRIAR NOME ÚNICO PARA A IMAGEM
// =========================================================

function criarNomeImagem(file) {

    const extensao =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const nomeUnico =
        "curso_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10);


    return (
        nomeUnico +
        "." +
        extensao
    );
}



// =========================================================
// ENVIAR IMAGEM PARA O STORAGE
// =========================================================

async function enviarImagemCurso(file) {

    const validacao =
        validarImagem(file);


    if (!validacao.valido) {

        throw new Error(
            validacao.mensagem
        );
    }


    const nomeArquivo =
        criarNomeImagem(file);


    const caminho =
        "capas/" +
        nomeArquivo;


    const {
        error: erroUpload
    } =
        await supabaseClient
            .storage
            .from(BUCKET_CAPAS)
            .upload(
                caminho,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (erroUpload) {

        console.error(
            "Erro no upload:",
            erroUpload
        );

        throw new Error(
            "Não foi possível enviar a imagem."
        );
    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from(BUCKET_CAPAS)
            .getPublicUrl(
                caminho
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Não foi possível obter a URL da imagem."
        );
    }


    return data.publicUrl;
}



// =========================================================
// PRÉVIA - NOVO CURSO
// =========================================================

const inputImagemCurso =
    document.getElementById(
        "imagemCurso"
    );


if (inputImagemCurso) {

    inputImagemCurso.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];


            const container =
                document.getElementById(
                    "previewImagemCurso"
                );

            const imagem =
                document.getElementById(
                    "previewImagemCursoImg"
                );


            if (!file) {

                container.style.display =
                    "none";

                imagem.src = "";

                return;
            }


            const validacao =
                validarImagem(file);


            if (!validacao.valido) {

                alert(
                    validacao.mensagem
                );

                this.value = "";

                container.style.display =
                    "none";

                imagem.src = "";

                return;
            }


            const url =
                URL.createObjectURL(
                    file
                );


            imagem.src = url;

            container.style.display =
                "block";
        }
    );
}



// =========================================================
// PRÉVIA - EDIÇÃO
// =========================================================

const inputEdicaoImagem =
    document.getElementById(
        "edicaoImagem"
    );


if (inputEdicaoImagem) {

    inputEdicaoImagem.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];


            const container =
                document.getElementById(
                    "previewEdicaoImagem"
                );

            const imagem =
                document.getElementById(
                    "previewEdicaoImagemImg"
                );


            if (!file) {

                container.style.display =
                    "none";

                imagem.src = "";

                return;
            }


            const validacao =
                validarImagem(file);


            if (!validacao.valido) {

                alert(
                    validacao.mensagem
                );

                this.value = "";

                container.style.display =
                    "none";

                imagem.src = "";

                return;
            }


            const url =
                URL.createObjectURL(
                    file
                );


            imagem.src = url;

            container.style.display =
                "block";
        }
    );
}



// =========================================================
// CARREGAR CURSOS
// =========================================================

async function carregarCursos() {

    const autorizado =
        await verificarSocio();


    if (!autorizado) return;


    const area =
        document.getElementById(
            "listaCursos"
        );


    const {
        data: cursos,
        error
    } =
        await supabaseClient
            .from("cursos")
            .select(
                "id, nome, descricao, porque_fazer, preco, imagem, ativo"
            )
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar cursos:",
            error
        );


        area.innerHTML =
            "<p>Erro ao carregar os cursos.</p>";

        return;
    }


    if (
        !cursos ||
        cursos.length === 0
    ) {

        area.innerHTML =
            "<p>Nenhum curso cadastrado ainda.</p>";

        return;
    }


    area.innerHTML = "";


    cursos.forEach(
        function (curso) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "course-card";


            card.style.cssText = `
                background:#111722;
                border:1px solid rgba(200,163,85,0.18);
                border-radius:14px;
                padding:20px;
                margin-bottom:18px;
            `;


            card.innerHTML = `

                ${
                    curso.imagem
                        ? `
                            <img
                                src="${curso.imagem}"
                                alt="${
                                    curso.nome ||
                                    "Curso"
                                }"
                                style="
                                    width:100%;
                                    max-width:500px;
                                    max-height:300px;
                                    object-fit:cover;
                                    border-radius:10px;
                                    margin-bottom:15px;
                                    display:block;
                                "
                            >
                        `
                        : ""
                }


                <h3
                    style="
                        color:#ffffff;
                        margin:0 0 10px;
                    "
                >
                    ${
                        curso.nome ||
                        "Curso sem nome"
                    }
                </h3>


                <p
                    style="
                        color:#aeb5c1;
                        line-height:1.5;
                    "
                >
                    ${
                        curso.descricao ||
                        "Sem descrição cadastrada."
                    }
                </p>


                <p
                    style="
                        color:#aeb5c1;
                        line-height:1.5;
                    "
                >

                    <strong
                        style="color:#E5C378;"
                    >
                        Por que fazer este curso:
                    </strong>

                    <br>

                    ${
                        curso.porque_fazer ||
                        "Ainda não informado."
                    }

                </p>


                <p
                    style="
                        color:#ffffff;
                    "
                >

                    <strong
                        style="color:#E5C378;"
                    >
                        Preço:
                    </strong>

                    R$

                    ${
                        curso.preco !== null &&
                        curso.preco !== undefined
                            ? Number(
                                curso.preco
                              )
                                .toFixed(2)
                                .replace(
                                    ".",
                                    ","
                                )
                            : "0,00"
                    }

                </p>


                <p
                    style="
                        color:#ffffff;
                    "
                >

                    <strong
                        style="color:#E5C378;"
                    >
                        Status:
                    </strong>

                    ${
                        curso.ativo
                            ? "Ativo"
                            : "Inativo"
                    }

                </p>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                        margin-top:15px;
                    "
                >

                    <button
                        type="button"
                        class="btn-editar"
                        style="
                            padding:10px 16px;
                            border:none;
                            border-radius:7px;
                            background:#d4af37;
                            color:#080a0f;
                            font-weight:800;
                            cursor:pointer;
                        "
                    >
                        ✏️ Editar
                    </button>


                    <button
                        type="button"
                        class="btn-modulos"
                        style="
                            padding:10px 16px;
                            border:none;
                            border-radius:7px;
                            background:#1a1f29;
                            color:#e5c378;
                            border:1px solid rgba(200,163,85,0.25);
                            font-weight:800;
                            cursor:pointer;
                        "
                    >
                        📚 Gerenciar módulos
                    </button>

                </div>

            `;


            area.appendChild(
                card
            );


            // =====================================================
            // EDITAR
            // =====================================================

            const botaoEditar =
                card.querySelector(
                    ".btn-editar"
                );


            botaoEditar.addEventListener(
                "click",
                function () {

                    editarCurso(
                        curso.id
                    );

                }
            );


            // =====================================================
            // MÓDULOS
            // =====================================================

            const botaoModulos =
                card.querySelector(
                    ".btn-modulos"
                );


            botaoModulos.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "modulos-admin.html?id=" +
                        curso.id;

                }
            );

        }
    );
}



// =========================================================
// EDITAR CURSO
// =========================================================

async function editarCurso(id) {

    console.log(
        "Editando curso:",
        id
    );


    const {
        data: curso,
        error
    } =
        await supabaseClient
            .from("cursos")
            .select(
                "id, nome, descricao, porque_fazer, preco, imagem, ativo"
            )
            .eq(
                "id",
                id
            )
            .single();


    if (
        error ||
        !curso
    ) {

        console.error(
            "Erro ao carregar curso:",
            error
        );


        alert(
            "Não foi possível carregar o curso."
        );


        return;
    }


    document.getElementById(
        "edicaoId"
    ).value =
        curso.id;


    document.getElementById(
        "edicaoNome"
    ).value =
        curso.nome || "";


    document.getElementById(
        "edicaoDescricao"
    ).value =
        curso.descricao || "";


    document.getElementById(
        "edicaoPorqueFazer"
    ).value =
        curso.porque_fazer || "";


    document.getElementById(
        "edicaoPreco"
    ).value =
        curso.preco ?? "";


    document.getElementById(
        "edicaoAtivo"
    ).checked =
        curso.ativo === true;


    // =====================================================
    // MOSTRAR CAPA ATUAL
    // =====================================================

    const containerAtual =
        document.getElementById(
            "imagemAtualContainer"
        );

    const imagemAtual =
        document.getElementById(
            "imagemAtualCurso"
        );


    if (
        curso.imagem
    ) {

        imagemAtual.src =
            curso.imagem;

        containerAtual.style.display =
            "block";

    } else {

        imagemAtual.src = "";

        containerAtual.style.display =
            "none";
    }


    // Limpar nova imagem selecionada

    const input =
        document.getElementById(
            "edicaoImagem"
        );


    if (input) {

        input.value = "";
    }


    const preview =
        document.getElementById(
            "previewEdicaoImagem"
        );


    const previewImg =
        document.getElementById(
            "previewEdicaoImagemImg"
        );


    if (preview) {

        preview.style.display =
            "none";
    }


    if (previewImg) {

        previewImg.src = "";
    }


    document.getElementById(
        "areaEdicao"
    ).style.display =
        "block";


    document.getElementById(
        "areaEdicao"
    ).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



// =========================================================
// SALVAR ALTERAÇÕES
// =========================================================

document
    .getElementById(
        "edicaoForm"
    )
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const mensagem =
                document.getElementById(
                    "mensagemEdicao"
                );


            const id =
                document.getElementById(
                    "edicaoId"
                ).value;


            const nome =
                document.getElementById(
                    "edicaoNome"
                ).value.trim();


            const descricao =
                document.getElementById(
                    "edicaoDescricao"
                ).value.trim();


            const porqueFazer =
                document.getElementById(
                    "edicaoPorqueFazer"
                ).value.trim();


            const preco =
                document.getElementById(
                    "edicaoPreco"
                ).value;


            const ativo =
                document.getElementById(
                    "edicaoAtivo"
                ).checked;


            const arquivo =
                document.getElementById(
                    "edicaoImagem"
                ).files[0];


            mensagem.textContent =
                "Salvando alterações...";


            try {

                // =================================================
                // BUSCAR IMAGEM ATUAL
                // =================================================

                const {
                    data: cursoAtual,
                    error: erroCurso
                } =
                    await supabaseClient
                        .from("cursos")
                        .select(
                            "imagem"
                        )
                        .eq(
                            "id",
                            id
                        )
                        .single();


                if (erroCurso) {

                    throw new Error(
                        "Não foi possível carregar os dados atuais do curso."
                    );
                }


                let imagemFinal =
                    cursoAtual?.imagem ||
                    null;


                // =================================================
                // SE ESCOLHEU NOVA IMAGEM
                // =================================================

                if (arquivo) {

                    mensagem.textContent =
                        "Enviando nova capa...";


                    imagemFinal =
                        await enviarImagemCurso(
                            arquivo
                        );
                }


                // =================================================
                // ATUALIZAR CURSO
                // =================================================

                mensagem.textContent =
                    "Salvando alterações...";


                const {
                    error
                } =
                    await supabaseClient
                        .from("cursos")
                        .update({

                            nome:
                                nome,

                            descricao:
                                descricao,

                            porque_fazer:
                                porqueFazer,

                            preco:
                                preco || null,

                            imagem:
                                imagemFinal,

                            ativo:
                                ativo

                        })
                        .eq(
                            "id",
                            id
                        );


                if (error) {

                    console.error(
                        "Erro ao atualizar:",
                        error
                    );


                    throw new Error(
                        "Não foi possível atualizar o curso."
                    );
                }


                mensagem.textContent =
                    "Curso atualizado com sucesso!";


                setTimeout(
                    function () {

                        document.getElementById(
                            "areaEdicao"
                        ).style.display =
                            "none";


                        carregarCursos();

                    },
                    1000
                );


            } catch (erro) {

                console.error(
                    "Erro ao salvar edição:",
                    erro
                );


                mensagem.textContent =
                    erro.message ||
                    "Erro ao atualizar o curso.";
            }

        }
    );



// =========================================================
// NOVO CURSO
// =========================================================

document
    .getElementById(
        "novoCurso"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "formularioCurso"
            ).style.display =
                "block";


            document.getElementById(
                "nomeCurso"
            ).focus();

        }
    );



// =========================================================
// CANCELAR NOVO CURSO
// =========================================================

document
    .getElementById(
        "cancelarCurso"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "formularioCurso"
            ).style.display =
                "none";


            document.getElementById(
                "cursoForm"
            ).reset();


            const preview =
                document.getElementById(
                    "previewImagemCurso"
                );


            const previewImg =
                document.getElementById(
                    "previewImagemCursoImg"
                );


            preview.style.display =
                "none";


            previewImg.src = "";

        }
    );



// =========================================================
// SALVAR NOVO CURSO
// =========================================================

document
    .getElementById(
        "cursoForm"
    )
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const mensagem =
                document.getElementById(
                    "mensagemCurso"
                );


            const nome =
                document.getElementById(
                    "nomeCurso"
                ).value.trim();


            const descricao =
                document.getElementById(
                    "descricaoCurso"
                ).value.trim();


            const porqueFazer =
                document.getElementById(
                    "porqueFazerCurso"
                ).value.trim();


            const preco =
                document.getElementById(
                    "precoCurso"
                ).value;


            const arquivo =
                document.getElementById(
                    "imagemCurso"
                ).files[0];


            const ativo =
                document.getElementById(
                    "ativoCurso"
                ).checked;


            mensagem.textContent =
                "Salvando curso...";


            try {

                // =================================================
                // UPLOAD DA CAPA
                // =================================================

                let imagemFinal =
                    null;


                if (arquivo) {

                    mensagem.textContent =
                        "Enviando capa do curso...";


                    imagemFinal =
                        await enviarImagemCurso(
                            arquivo
                        );

                }


                // =================================================
                // CRIAR CURSO
                // =================================================

                mensagem.textContent =
                    "Criando curso...";


                const {
                    error
                } =
                    await supabaseClient
                        .from("cursos")
                        .insert({

                            nome:
                                nome,

                            descricao:
                                descricao,

                            porque_fazer:
                                porqueFazer,

                            preco:
                                preco || null,

                            imagem:
                                imagemFinal,

                            ativo:
                                ativo

                        });


                if (error) {

                    console.error(
                        "Erro ao criar curso:",
                        error
                    );


                    throw new Error(
                        "Não foi possível salvar o curso."
                    );
                }


                mensagem.textContent =
                    "Curso criado com sucesso!";


                document
                    .getElementById(
                        "cursoForm"
                    )
                    .reset();


                document.getElementById(
                    "ativoCurso"
                ).checked =
                    true;


                document.getElementById(
                    "previewImagemCurso"
                ).style.display =
                    "none";


                document.getElementById(
                    "previewImagemCursoImg"
                ).src =
                    "";


                setTimeout(
                    function () {

                        document.getElementById(
                            "formularioCurso"
                        ).style.display =
                            "none";


                        mensagem.textContent =
                            "";


                        carregarCursos();

                    },
                    1000
                );


            } catch (erro) {

                console.error(
                    "Erro ao criar curso:",
                    erro
                );


                mensagem.textContent =
                    erro.message ||
                    "Erro ao salvar o curso.";
            }

        }
    );



// =========================================================
// CANCELAR EDIÇÃO
// =========================================================

document
    .getElementById(
        "cancelarEdicao"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "areaEdicao"
            ).style.display =
                "none";


            document.getElementById(
                "edicaoForm"
            ).reset();


            document.getElementById(
                "previewEdicaoImagem"
            ).style.display =
                "none";


            document.getElementById(
                "previewEdicaoImagemImg"
            ).src =
                "";


            document.getElementById(
                "imagemAtualContainer"
            ).style.display =
                "none";

        }
    );



// =========================================================
// SAIR
// =========================================================

document
    .getElementById(
        "sair"
    )
    .addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            await supabaseClient.auth.signOut();


            window.location.href =
                "login.html";

        }
    );



// =========================================================
// INICIAR
// =========================================================

carregarCursos();
