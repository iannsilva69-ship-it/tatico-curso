const form = document.getElementById("cadastroForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Criando sua conta...";

    // Cria o usuário no sistema de autenticação
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: senha
    });

    if (error) {

        console.error(error);

        mensagem.textContent =
            "Não foi possível criar a conta: " + error.message;

        return;
    }

    // Se o Supabase retornar o usuário, cria o perfil
    if (data.user) {

        const { error: erroPerfil } =
            await supabaseClient
                .from("perfis")
                .insert({
                    nome: nome,
                    telefone: telefone,
                    email: email,
                    tipo: "aluno",
                    status: "ativo",
                    auth_user_id: data.user.id
                });

        if (erroPerfil) {

            console.error(erroPerfil);

            mensagem.textContent =
                "A conta foi criada, mas houve um problema ao criar seu perfil.";

            return;
        }
    }

    mensagem.textContent =
        "Cadastro realizado com sucesso!";

    setTimeout(function () {
        window.location.href = "login.html";
    }, 1500);

});
