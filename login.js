
const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

const campoSenha = document.getElementById("senha");
const botaoOlho = document.getElementById("alternarSenha");
const iconeOlho = document.getElementById("iconeOlho");
const linkEsqueciSenha = document.getElementById("linkEsqueciSenha");

const URL_SITE =
    "https://tatico-curso.iannsilva69.workers.dev/";


// ==============================
// MOSTRAR OU OCULTAR SENHA
// ==============================

if (botaoOlho && campoSenha) {
    botaoOlho.addEventListener("click", function () {
        const mostrar = campoSenha.type === "password";

        campoSenha.type = mostrar ? "text" : "password";

        botaoOlho.setAttribute(
            "aria-label",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );

        botaoOlho.setAttribute(
            "aria-pressed",
            String(mostrar)
        );

        if (iconeOlho) {
            iconeOlho.innerHTML = mostrar
                ? `
                    <path d="M3 3l18 18"/>
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-4 4.7"/>
                    <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8"/>
                  `
                : `
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  `;
        }
    });
}


// ==============================
// RECUPERAÇÃO DE SENHA
// ==============================

if (linkEsqueciSenha) {
    linkEsqueciSenha.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = document
            .getElementById("email")
            .value
            .trim();

        if (!email) {
            mensagem.textContent =
                "Digite seu e-mail para solicitar a recuperação da senha.";

            document.getElementById("email").focus();
            return;
        }

        linkEsqueciSenha.style.pointerEvents = "none";
        mensagem.textContent = "Enviando solicitação...";

        try {
            const { error } = await supabaseClient.auth
                .resetPasswordForEmail(email, {
                    redirectTo: URL_SITE + "redefinir-senha.html"
                });

            if (error) {
                console.error("ERRO RECUPERAÇÃO:", error);
                mensagem.textContent =
                    "Não foi possível enviar o e-mail. Tente novamente.";
                return;
            }

            mensagem.textContent =
                "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.";
        } catch (erro) {
            console.error("ERRO RECUPERAÇÃO:", erro);
            mensagem.textContent =
                "Ocorreu um erro. Tente novamente mais tarde.";
        } finally {
            linkEsqueciSenha.style.pointerEvents = "";
        }
    });
}


// ==============================
// LOGIN
// ==============================

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = campoSenha.value;

    mensagem.textContent = "Entrando...";

    try {
        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: senha
            });

        if (error) {
            console.error("ERRO LOGIN:", error);
            mensagem.textContent = "E-mail ou senha incorretos.";
            return;
        }

        const { data: perfil, error: erroPerfil } =
            await supabaseClient
                .from("perfis")
                .select("id, tipo, status")
                .eq("auth_user_id", data.user.id)
                .single();

        if (erroPerfil || !perfil) {
            console.error("ERRO PERFIL:", erroPerfil);
            mensagem.textContent =
                "Perfil do usuário não encontrado.";

            await supabaseClient.auth.signOut();
            return;
        }

        const tipo = String(perfil.tipo || "")
            .toLowerCase()
            .trim();

        const status = String(perfil.status || "")
            .toLowerCase()
            .trim();

        if (status !== "ativo") {
            mensagem.textContent = "Sua conta está inativa.";
            await supabaseClient.auth.signOut();
            return;
        }

        const ehSocio =
            tipo === "socio" || tipo === "sócio";

        mensagem.textContent =
            "Login realizado com sucesso!";

        window.location.href = ehSocio
            ? "admin.html"
            : "aluno.html";

    } catch (erro) {
        console.error("ERRO LOGIN:", erro);
        mensagem.textContent =
            "Ocorreu um erro ao entrar. Tente novamente.";
    }
});
