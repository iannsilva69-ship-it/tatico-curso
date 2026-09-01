```javascript
const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Entrando...";

    // Faz o login
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

    // Busca o perfil do usuário
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

    // Verifica se a conta está ativa
    if (perfil.status !== "ativo") {

        mensagem.textContent =
            "Sua conta está inativa.";

        await supabaseClient.auth.signOut();

        return;
    }

    mensagem.textContent =
        "Login realizado com sucesso!";

    // Redireciona conforme o tipo de usuário
    if (perfil.tipo === "socio") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "aluno.html";

    }

});
```
