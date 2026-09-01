const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Entrando...";

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: senha
        });

    if (error) {

        console.error(error);

        mensagem.textContent =
            "E-mail ou senha incorretos.";

        return;
    }

    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("id, tipo, status")
            .eq("auth_user_id", data.user.id)
            .single();

    if (erroPerfil || !perfil) {

        console.error(erroPerfil);

        mensagem.textContent =
            "Perfil do usuário não encontrado.";

        await supabaseClient.auth.signOut();

        return;
    }

    if (perfil.status.toLowerCase() !== "ativo") {

        mensagem.textContent =
            "Sua conta está inativa.";

        await supabaseClient.auth.signOut();

        return;
    }

    mensagem.textContent =
        "Login realizado com sucesso!";

    if (perfil.tipo.toLowerCase() === "socio") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "aluno.html";

    }

});
