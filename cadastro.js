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
    // e envia os dados do aluno como metadados.
    const { data, error } = await supabaseClient.auth.signUp({

        email: email,

        password: senha,

        options: {
            data: {
                nome: nome,
                telefone: telefone
            }
        }

    });

    if (error) {

        console.error(error);

        mensagem.textContent =
            "Não foi possível criar a conta: " + error.message;

        return;
    }

    /*
     * Com a confirmação de e-mail ativada,
     * normalmente não haverá uma sessão imediatamente.
     *
     * O perfil será criado pelo banco de dados
     * usando os dados enviados acima.
     */

    if (data.user) {

        mensagem.innerHTML = `
            <strong>Cadastro realizado com sucesso!</strong><br><br>
            Enviamos um link de confirmação para o seu e-mail.<br>
            Confirme seu cadastro para ativar sua conta.
        `;

    } else {

        mensagem.textContent =
            "Não foi possível concluir o cadastro.";

        return;
    }

});
