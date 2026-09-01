const form = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    mensagem.textContent = "Entrando...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        mensagem.textContent = "E-mail ou senha incorretos.";
        console.error(error);
        return;
    }

    mensagem.textContent = "Login realizado!";

    window.location.href = "aluno.html";
});
