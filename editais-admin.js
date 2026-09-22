// ==========================================
// EDITAIS - ÁREA DO SÓCIO
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const imagemEdital =
    document.getElementById(
        "imagemEdital"
    );


const previewContainer =
    document.getElementById(
        "previewContainer"
    );


const previewImagem =
    document.getElementById(
        "previewImagem"
    );


const mensagemEdital =
    document.getElementById(
        "mensagemEdital"
    );


const btnSalvarEdital =
    document.getElementById(
        "btnSalvarEdital"
    );


const listaEditais =
    document.getElementById(
        "listaEditais"
    );


const btnVoltar =
    document.getElementById(
        "btnVoltar"
    );


// ==========================================
// PRÉVIA DA IMAGEM
// ==========================================

if (imagemEdital) {

    imagemEdital.addEventListener(
        "change",
        function () {

            const arquivo =
                imagemEdital.files[0];


            if (!arquivo) {

                previewContainer.style.display =
                    "none";

                previewImagem.src =
                    "";

                return;
            }


            // ==========================================
            // VERIFICAR TIPO
            // ==========================================

            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !tiposPermitidos.includes(
                    arquivo.type
                )
            ) {

                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ Formato não permitido.
                        Use JPG, PNG ou WEBP.
                    </span>
                `;


                imagemEdital.value =
                    "";


                previewContainer.style.display =
                    "none";


                return;
            }


            // ==========================================
            // TAMANHO MÁXIMO
            // ==========================================

            const tamanhoMaximo =
                10 * 1024 * 1024;


            if (
                arquivo.size >
                tamanhoMaximo
            ) {

                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ A imagem deve ter
                        no máximo 10 MB.
                    </span>
                `;


                imagemEdital.value =
                    "";


                previewContainer.style.display =
                    "none";


                return;
            }


            // ==========================================
            // CRIAR PRÉVIA
            // ==========================================

            const leitor =
                new FileReader();


            leitor.onload =
                function (evento) {

                    previewImagem.src =
                        evento.target.result;


                    previewContainer.style.display =
                        "block";


                    mensagemEdital.innerHTML = `
                        <span
                            style="
                                color:#36c275;
                            "
                        >
                            ✅ Imagem selecionada.
                        </span>
                    `;
                };


            leitor.readAsDataURL(
                arquivo
            );

        }
    );
}


// ==========================================
// BOTÃO VOLTAR
// ==========================================

if (btnVoltar) {

    btnVoltar.addEventListener(
        "click",
        function () {

            window.location.href =
                "admin.html";

        }
    );
}


// ==========================================
// VERIFICAR SE É SÓCIO
// ==========================================

async function verificarSocio() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    if (
        error ||
        !user
    ) {

        window.location.href =
            "login.html";

        return false;
    }


    const {
        data: perfil,
        error: erroPerfil
    } = await supabaseClient
        .from("perfis")
        .select(
            "tipo, status"
        )
        .eq(
            "auth_user_id",
            user.id
        )
        .single();


    if (
        erroPerfil ||
        !perfil
    ) {

        alert(
            "Não foi possível verificar seu acesso."
        );

        return false;
    }


    const tipo =
        String(
            perfil.tipo || ""
        )
        .toLowerCase();


    const status =
        String(
            perfil.status || ""
        )
        .toLowerCase();


    const ehSocio =
        (
            (
                tipo === "socio" ||
                tipo === "sócio"
            ) &&
            status === "ativo"
        );


    if (!ehSocio) {

        alert(
            "Acesso permitido somente para sócios ativos."
        );


        window.location.href =
            "admin.html";


        return false;
    }


    return true;
}


// ==========================================
// CARREGAR EDITAIS
// ==========================================

async function carregarEditais() {

    if (!listaEditais) {
        return;
    }


    listaEditais.innerHTML = `
        <div
            style="
                color:#7f8897;
                padding:20px 0;
            "
        >
            Carregando editais...
        </div>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("editais")
        .select(
            "id, imagem, ativo, ordem"
        )
        .order(
            "ordem",
            {
                ascending: true
            }
        )
        .order(
            "id",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Erro ao carregar editais:",
            error
        );


        listaEditais.innerHTML = `
            <div
                style="
                    color:#ef4444;
                    padding:20px 0;
                "
            >
                ❌ Não foi possível carregar os editais.
            </div>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        listaEditais.innerHTML = `
            <div
                style="
                    color:#7f8897;
                    padding:20px 0;
                "
            >
                Nenhum edital cadastrado.
            </div>
        `;

        return;
    }


    listaEditais.innerHTML =
        "";


    data.forEach(
        function (edital) {

            const card =
                document.createElement(
                    "div"
                );


            card.style.cssText = `
                background:#0e121a;
                border:1px solid #2a303b;
                border-radius:12px;
                padding:10px;
            `;


            card.innerHTML = `

                <img
                    src="${edital.imagem}"
                    alt="Edital"
                    style="
                        width:100%;
                        height:280px;
                        object-fit:contain;
                        display:block;
                        background:#080a0f;
                        border-radius:8px;
                    "
                >


                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        margin-top:10px;
                    "
                >

                    <span
                        style="
                            color:${
                                edital.ativo
                                    ? "#36c275"
                                    : "#ef4444"
                            };
                            font-size:11px;
                            font-weight:800;
                        "
                    >
                        ${
                            edital.ativo
                                ? "🟢 ATIVO"
                                : "🔴 INATIVO"
                        }
                    </span>


                    <button
                        type="button"
                        class="btn-excluir-edital"
                        data-id="${edital.id}"
                        style="
                            border:1px solid #ef4444;
                            background:transparent;
                            color:#ef4444;
                            padding:6px 9px;
                            border-radius:6px;
                            cursor:pointer;
                            font-size:11px;
                            font-weight:700;
                        "
                    >
                        🗑️ Excluir
                    </button>

                </div>

            `;


            listaEditais.appendChild(
                card
            );

        }
    );


    // ==========================================
    // BOTÕES EXCLUIR
    // ==========================================

    const botoesExcluir =
        listaEditais.querySelectorAll(
            ".btn-excluir-edital"
        );


    botoesExcluir.forEach(
        function (botao) {

            botao.addEventListener(
                "click",
                async function () {

                    const id =
                        botao.dataset.id;


                    const confirmar =
                        confirm(
                            "Deseja realmente excluir este edital?"
                        );


                    if (!confirmar) {
                        return;
                    }


                    const {
                        data: edital,
                        error: erroBusca
                    } = await supabaseClient
                        .from("editais")
                        .select(
                            "imagem"
                        )
                        .eq(
                            "id",
                            id
                        )
                        .single();


                    if (erroBusca) {

                        alert(
                            "Não foi possível localizar o edital."
                        );

                        return;
                    }


                    // ==========================================
                    // EXCLUIR REGISTRO
                    // ==========================================

                    const {
                        error: erroDelete
                    } = await supabaseClient
                        .from("editais")
                        .delete()
                        .eq(
                            "id",
                            id
                        );


                    if (erroDelete) {

                        console.error(
                            "Erro ao excluir edital:",
                            erroDelete
                        );


                        alert(
                            "Não foi possível excluir o edital."
                        );

                        return;
                    }


                    // ==========================================
                    // EXCLUIR IMAGEM DO STORAGE
                    // ==========================================

                    if (
                        edital &&
                        edital.imagem
                    ) {

                        const marcador =
                            "/storage/v1/object/public/editais/";


                        const posicao =
                            edital.imagem.indexOf(
                                marcador
                            );


                        if (
                            posicao !== -1
                        ) {

                            const caminho =
                                decodeURIComponent(
                                    edital.imagem.substring(
                                        posicao +
                                        marcador.length
                                    )
                                );


                            await supabaseClient
                                .storage
                                .from("editais")
                                .remove([
                                    caminho
                                ]);
                        }
                    }


                    await carregarEditais();

                }
            );

        }
    );
}


// ==========================================
// UPLOAD DO EDITAL
// ==========================================

if (btnSalvarEdital) {

    btnSalvarEdital.addEventListener(
        "click",
        async function () {

            const arquivo =
                imagemEdital.files[0];


            if (!arquivo) {

                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ Selecione uma imagem primeiro.
                    </span>
                `;

                return;
            }


            btnSalvarEdital.disabled =
                true;


            btnSalvarEdital.textContent =
                "⏳ Enviando...";


            mensagemEdital.innerHTML = `
                <span
                    style="
                        color:#c8a355;
                    "
                >
                    Enviando imagem...
                </span>
            `;


            try {

                // ==========================================
                // NOME ÚNICO
                // ==========================================

                const extensao =
                    arquivo.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const nomeArquivo =
                    "edital_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8) +
                    "." +
                    extensao;


                // ==========================================
                // UPLOAD PARA O STORAGE
                // ==========================================

                const {
                    error: erroUpload
                } = await supabaseClient
                    .storage
                    .from("editais")
                    .upload(
                        nomeArquivo,
                        arquivo,
                        {
                            cacheControl:
                                "3600",
                            upsert:
                                false,
                            contentType:
                                arquivo.type
                        }
                    );


                if (erroUpload) {

                    throw erroUpload;
                }


                // ==========================================
                // PEGAR URL PÚBLICA
                // ==========================================

                const {
                    data: urlPublica
                } = supabaseClient
                    .storage
                    .from("editais")
                    .getPublicUrl(
                        nomeArquivo
                    );


                const imagemUrl =
                    urlPublica.publicUrl;


                // ==========================================
                // SALVAR NO BANCO
                // ==========================================

                const {
                    error: erroBanco
                } = await supabaseClient
                    .from("editais")
                    .insert({
                        imagem:
                            imagemUrl,
                        ativo:
                            true,
                        ordem:
                            0
                    });


                if (erroBanco) {

                    // Se o banco falhar,
                    // tenta remover a imagem
                    // que acabou de ser enviada.

                    await supabaseClient
                        .storage
                        .from("editais")
                        .remove([
                            nomeArquivo
                        ]);


                    throw erroBanco;
                }


                // ==========================================
                // LIMPAR FORMULÁRIO
                // ==========================================

                imagemEdital.value =
                    "";


                previewImagem.src =
                    "";


                previewContainer.style.display =
                    "none";


                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#36c275;
                        "
                    >
                        ✅ Edital salvo com sucesso!
                    </span>
                `;


                await carregarEditais();


            } catch (erro) {

                console.error(
                    "Erro ao salvar edital:",
                    erro
                );


                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ Não foi possível salvar o edital.
                    </span>
                `;

            } finally {

                btnSalvarEdital.disabled =
                    false;


                btnSalvarEdital.textContent =
                    "💾 Salvar edital";
            }

        }
    );
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarEditais() {

    const autorizado =
        await verificarSocio();


    if (!autorizado) {
        return;
    }


    await carregarEditais();
}


// ==========================================
// INICIAR
// ==========================================

iniciarEditais();
