
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

    // BUSCAR PERFIL
    const {
        data: perfil,
        error: erroPerfil
    } = await supabaseClient
        .from("perfis")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

    if (erroPerfil || !perfil) {
        alert("Não foi possível verificar seu perfil.");
        window.location.href = "login.html";
        return false;
    }

    // VERIFICAR SÓCIO ATIVO
    const tipo = String(perfil.tipo || "")
        .toLowerCase()
        .trim();

    const status = String(perfil.status || "")
        .toLowerCase()
        .trim();

    const ehSocio = tipo === "socio" || tipo === "sócio";
    const estaAtivo = status === "ativo";

    if (!ehSocio || !estaAtivo) {
        alert("Acesso permitido somente para Sócios ativos.");
        window.location.href = "login.html";
        return false;
    }

    return true;
}


// ==============================
// CADASTRAR SÓCIO
// ==============================

async function cadastrarSocio() {
    const nome = document
        .getElementById("nomeSocio")
        .value.trim();

    const email = document
        .getElementById("emailSocio")
        .value.trim();

    const senha = document
        .getElementById("senhaSocio")
        .value;

    const mensagem = document.getElementById("mensagem");

    // VALIDAR CAMPOS
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

    // DESABILITAR BOTÃO
    const botao = document.getElementById("cadastrarSocio");

    botao.disabled = true;
    botao.textContent = "CADASTRANDO...";
    mensagem.textContent = "Criando sócio...";

    try {
        // CHAMAR EDGE FUNCTION
        const { data, error } =
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

        // TRATAR ERRO E MOSTRAR A MENSAGEM REAL
        if (error) {
            console.error("ERRO EDGE FUNCTION:", error);

            let detalhe = "";

            try {
                if (typeof error.context?.json === "function") {
                    const resposta = await error.context.json();
                    detalhe =
                        resposta?.erro ||
                        resposta?.message ||
                        "";
                } else if (typeof error.message === "string") {
                    detalhe = error.message;
                }
            } catch (erroLeitura) {
                console.warn(
                    "Não foi possível ler a resposta do erro:",
                    erroLeitura
                );
            }

            mensagem.textContent = detalhe
                ? "Erro ao cadastrar: " + detalhe
                : "Não foi possível cadastrar o sócio. Consulte o Console (F12).";

            return;
        }

        if (data && data.erro) {
            mensagem.textContent = data.erro;
            return;
        }

        // SUCESSO
        mensagem.textContent =
            "Sócio cadastrado com sucesso!";

        document.getElementById("nomeSocio").value = "";
        document.getElementById("emailSocio").value = "";
        document.getElementById("senhaSocio").value = "";

        await carregarSocios();

    } catch (erro) {
        console.error("ERRO AO CADASTRAR SÓCIO:", erro);

        mensagem.textContent =
            "Ocorreu um erro ao cadastrar o sócio. Consulte o Console (F12).";

    } finally {
        botao.disabled = false;
        botao.textContent = "CADASTRAR SÓCIO";
    }
}


// ==============================
// CARREGAR SÓCIOS
// ==============================

async function carregarSocios() {
    const lista = document.getElementById("listaSocios");

    lista.innerHTML = "<p>Carregando sócios...</p>";

    const {
        data: socios,
        error
    } = await supabaseClient
        .from("perfis")
        .select("id, nome, email, telefone, tipo, status, auth_user_id")
        .or("tipo.eq.Sócio,tipo.eq.Socio")
        .order("nome", { ascending: true });

    if (error) {
        console.error("ERRO AO CARREGAR SÓCIOS:", error);

        lista.innerHTML =
            "<p>Não foi possível carregar os sócios.</p>";

        return;
    }

    if (!socios || socios.length === 0) {
        lista.innerHTML = "<p>Nenhum sócio cadastrado.</p>";
        return;
    }

    lista.innerHTML = "";

    socios.forEach(function (socio) {
        const card = document.createElement("div");
        card.className = "course-card";

        const nome = socio.nome || "Sem nome";
        const email = socio.email || "Sem e-mail";
        const telefone = socio.telefone || "Não informado";
        const status = socio.status || "Sem status";

        const statusNormalizado = String(status)
            .toLowerCase()
            .trim();

        const ativo = statusNormalizado === "ativo";

        card.innerHTML = `
            <h3>👤 ${nome}</h3>
            <p>📧 ${email}</p>
            <p>📱 ${telefone}</p>
            <p>Status: <strong>${status}</strong></p>

            <button type="button" class="botao-editar">
                ✏️ Editar
            </button>

            <button type="button" class="botao-status">
                ${ativo ? "🔴 Desativar Sócio" : "🟢 Ativar Sócio"}
            </button>
        `;

        const botaoEditar = card.querySelector(".botao-editar");

        botaoEditar.addEventListener("click", function () {
            abrirEdicaoSocio(socio);
        });

        const botaoStatus = card.querySelector(".botao-status");

        botaoStatus.addEventListener("click", function () {
            alterarStatusSocio(socio.id, socio.status);
        });

        lista.appendChild(card);
    });
}


// ==============================
// ABRIR EDIÇÃO
// ==============================

function abrirEdicaoSocio(socio) {
    const areaEdicao = document.getElementById("areaEdicao");

    areaEdicao.style.display = "block";

    document.getElementById("edicaoSocioId").value =
        socio.id || "";

    document.getElementById("edicaoAuthUserId").value =
        socio.auth_user_id || "";

    document.getElementById("edicaoNomeSocio").value =
        socio.nome || "";

    document.getElementById("edicaoEmailSocio").value =
        socio.email || "";

    document.getElementById("edicaoTelefoneSocio").value =
        socio.telefone || "";

    document.getElementById("mensagemEdicao").textContent = "";

    areaEdicao.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==============================
// SALVAR EDIÇÃO
// ==============================

async function salvarEdicaoSocio() {
    const socioId =
        document.getElementById("edicaoSocioId").value;

    const nome =
        document.getElementById("edicaoNomeSocio").value.trim();

    const email =
        document.getElementById("edicaoEmailSocio").value.trim();

    const telefone =
        document.getElementById("edicaoTelefoneSocio").value.trim();

    const mensagem = document.getElementById("mensagemEdicao");

    // VALIDAR
    if (!nome || !email) {
        mensagem.textContent = "Nome e e-mail são obrigatórios.";
        return;
    }

    const botao = document.getElementById("salvarEdicaoSocio");

    botao.disabled = true;
    botao.textContent = "SALVANDO...";
    mensagem.textContent = "Atualizando sócio...";

    try {
        // CHAMAR EDGE FUNCTION
        const { data, error } =
            await supabaseClient.functions.invoke(
                "editar-socio",
                {
                    body: {
                        socioId: socioId,
                        nome: nome,
                        email: email,
                        telefone: telefone
                    }
                }
            );

        if (error) {
            console.error("ERRO EDITAR SÓCIO:", error);

            mensagem.textContent =
                "Não foi possível editar o sócio.";

            return;
        }

        if (data && data.erro) {
            mensagem.textContent = data.erro;
            return;
        }

        mensagem.textContent = "Sócio atualizado com sucesso!";

        await carregarSocios();

        setTimeout(function () {
            cancelarEdicao();
        }, 800);

    } catch (erro) {
        console.error("ERRO AO EDITAR SÓCIO:", erro);

        mensagem.textContent =
            "Ocorreu um erro ao editar o sócio.";

    } finally {
        botao.disabled = false;
        botao.textContent = "💾 SALVAR ALTERAÇÕES";
    }
}


function cancelarEdicao() {
  const areaEdicao = document.getElementById("areaEdicao");

  areaEdicao.style.display = "none";
  document.getElementById("edicaoSocioId").value = "";
  document.getElementById("edicaoAuthUserId").value = "";
  document.getElementById("edicaoNomeSocio").value = "";
  document.getElementById("edicaoEmailSocio").value = "";
  document.getElementById("edicaoTelefoneSocio").value = "";
  document.getElementById("mensagemEdicao").textContent = "";
}

async function alterarStatusSocio(socioId, statusAtual) {
  const novoStatus = statusAtual === "Ativo" ? "Inativo" : "Ativo";

  const confirmado = confirm(
    `Deseja realmente alterar o status deste sócio para ${novoStatus}?`
  );

  if (!confirmado) return;

  try {
    const { error } = await supabaseClient
      .from("perfis")
      .update({ status: novoStatus })
      .eq("id", socioId);

    if (error) {
      console.error("Erro ao alterar status:", error);
      alert("Não foi possível alterar o status do sócio.");
      return;
    }

    alert(`Status alterado para ${novoStatus} com sucesso!`);
    await carregarSocios();
  } catch (erro) {
    console.error("Erro inesperado ao alterar status:", erro);
    alert("Ocorreu um erro ao alterar o status do sócio.");
  }
}

document.getElementById("logout")?.addEventListener("click", async () => {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  } catch (erro) {
    console.error("Erro ao sair:", erro);
    alert("Não foi possível sair da conta.");
  }
});

document.getElementById("cadastrarSocio")?.addEventListener("click", cadastrarSocio);

document.getElementById("salvarEdicaoSocio")?.addEventListener("click", salvarEdicaoSocio);

document.getElementById("cancelarEdicaoSocio")?.addEventListener("click", cancelarEdicao);

async function iniciar() {
  const autorizado = await verificarAcesso();

  if (autorizado) {
    await carregarSocios();
  }
}

iniciar();
