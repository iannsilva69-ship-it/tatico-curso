// ==============================
// GERENCIAR SÓCIOS
// ==============================

let usuarioAtual = null;


// ==============================
// VERIFICAR ACESSO
// ==============================

async function verificarAcesso() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();


    if (erroUsuario || !user) {

        window.location.href = "login.html";

        return false;
    }


    usuarioAtual = user;


    // ==============================
    // BUSCAR PERFIL
    // ==============================

    const {
        data: perfil,
        error: erroPerfil
    } = await supabaseClient
        .from("perfis")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();


    if (erroPerfil || !perfil) {

        alert(
            "Não foi possível verificar seu perfil."
        );

        window.location.href = "login.html";

        return false;
    }


    // ==============================
    // VERIFICAR SÓCIO ATIVO
    // ==============================

    const tipo =
        String(perfil.tipo || "")
            .toLowerCase()
            .trim();


    const status =
        String(perfil.status || "")
            .toLowerCase()
            .trim();


    const ehSocio =
        tipo === "socio" ||
        tipo === "sócio";


    const estaAtivo =
        status === "ativo";


    if (!ehSocio || !estaAtivo) {

        alert(
            "Acesso permitido somente para Sócios ativos."
        );

        window.location.href = "login.html";

        return false;
    }


    return true;
}


// ==============================
// CADASTRAR SÓCIO
// ==============================

async function cadastrarSocio() {

    const nome =
        document
            .getElementById("nomeSocio")
            .value
            .trim();


    const email =
        document
            .getElementById("emailSocio")
            .value
            .trim();


    const senha =
        document
            .getElementById("senhaSocio")
            .value;


    const mensagem =
        document.getElementById("mensagem");


    // ==============================
    // VALIDAR CAMPOS
    // ==============================

    if (!nome || !email || !senha) {

        mensagem.textContent =
            "Preencha nome, e-mail e senha.";

        return;
    }


    if (senha.length < 6) {

        mensagem.textContent =
            "A senha deve ter pelo menos 6 caracteres.";

        return;
    }


    // ==============================
    // DESABILITAR BOTÃO
    // ==============================

    const botao =
        document.getElementById("cadastrarSocio");


    botao.disabled = true;

    botao.textContent =
        "CADASTRANDO...";


    mensagem.textContent =
        "Criando sócio...";


    try {

        // ==============================
        // CHAMAR EDGE FUNCTION
        // ==============================

        const {
            data,
            error
        } =
            await supabaseClient.functions.invoke(
                "criar-socio",
                {
                    body: {
                        nome: nome,
                        email: email,
                        senha: senha
                    }
                }
            );


        // ==============================
        // VERIFICAR ERRO
        // ==============================

        if (error) {

            console.error(
                "ERRO EDGE FUNCTION:",
                error
            );

            mensagem.textContent =
                "Não foi possível cadastrar o sócio.";

            return;
        }


        if (data && data.erro) {

            mensagem.textContent =
                data.erro;

            return;
        }


        // ==============================
        // SUCESSO
        // ==============================

        mensagem.textContent =
            "✅ Sócio cadastrado com sucesso!";


        // Limpar formulário

        document
            .getElementById("nomeSocio")
            .value = "";


        document
            .getElementById("emailSocio")
            .value = "";


        document
            .getElementById("senhaSocio")
            .value = "";


        // Atualizar lista

        await carregarSocios();


    } catch (erro) {

        console.error(
            "ERRO:",
            erro
        );

        mensagem.textContent =
            "Ocorreu um erro ao cadastrar o sócio.";

    } finally {

        botao.disabled = false;

        botao.textContent =
            "CADASTRAR SÓCIO";
    }
}


// ==============================
// CARREGAR SÓCIOS
// ==============================

async function carregarSocios() {

    const lista =
        document.getElementById("listaSocios");


    lista.innerHTML =
        "<p>Carregando sócios...</p>";


    const {
        data: socios,
        error
    } =
        await supabaseClient
            .from("perfis")
            .select(
                "id, nome, email, tipo, status, auth_user_id"
            )
            .or(
                "tipo.eq.Sócio,tipo.eq.Socio"
            )
            .order(
                "nome",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "ERRO AO CARREGAR SÓCIOS:",
            error
        );

        lista.innerHTML =
            "<p>Não foi possível carregar os sócios.</p>";

        return;
    }


    if (!socios || socios.length === 0) {

        lista.innerHTML =
            "<p>Nenhum sócio cadastrado.</p>";

        return;
    }


    lista.innerHTML = "";


    socios.forEach(
        function (socio) {

            const card =
                document.createElement("div");


            card.className =
                "course-card";


            const nome =
                socio.nome ||
                "Sem nome";


            const email =
                socio.email ||
                "Sem e-mail";


            const status =
                socio.status ||
                "Sem status";


            const statusNormalizado =
                String(status)
                    .toLowerCase()
                    .trim();


            const ativo =
                statusNormalizado === "ativo";


            card.innerHTML = `

                <h3>
                    👤 ${nome}
                </h3>

                <p>
                    📧 ${email}
                </p>

                <p>
                    Status:
                    <strong>
                        ${status}
                    </strong>
                </p>

                <button
                    type="button"
                    class="botao-status"
                >
                    ${
                        ativo
                            ? "🔴 Desativar Sócio"
                            : "🟢 Ativar Sócio"
                    }
                </button>

            `;


            const botaoStatus =
                card.querySelector(
                    ".botao-status"
                );


            botaoStatus.addEventListener(
                "click",
                function () {

                    alterarStatusSocio(
                        socio.id,
                        socio.status
                    );

                }
            );


            lista.appendChild(card);
        }
    );
}


// ==============================
// ALTERAR STATUS
// ==============================

async function alterarStatusSocio(
    socioId,
    statusAtual
) {

    const statusNormalizado =
        String(statusAtual || "")
            .toLowerCase()
            .trim();


    const novoStatus =
        statusNormalizado === "ativo"
            ? "Inativo"
            : "Ativo";


    const confirmar =
        confirm(
            novoStatus === "Ativo"
                ? "Deseja ativar este sócio?"
                : "Deseja desativar este sócio?"
        );


    if (!confirmar) {
        return;
    }


    // ==============================
    // ATUALIZAR
    // ==============================

    const {
        error
    } =
        await supabaseClient
            .from("perfis")
            .update({
                status: novoStatus
            })
            .eq("id", socioId);


    if (error) {

        console.error(
            "ERRO AO ALTERAR STATUS:",
            error
        );

        alert(
            "Não foi possível alterar o status."
        );

        return;
    }


    alert(
        "Status alterado com sucesso."
    );


    await carregarSocios();
}


// ==============================
// LOGOUT
// ==============================

document
    .getElementById("logout")
    .addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            window.location.href =
                "login.html";
        }
    );


// ==============================
// BOTÃO CADASTRAR
// ==============================

document
    .getElementById("cadastrarSocio")
    .addEventListener(
        "click",
        cadastrarSocio
    );


// ==============================
// INICIAR
// ==============================

async function iniciar() {

    const acesso =
        await verificarAcesso();


    if (!acesso) {
        return;
    }


    await carregarSocios();
}


iniciar();
