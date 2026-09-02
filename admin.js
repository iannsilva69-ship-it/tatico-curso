async function carregarAdmin() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();

    if (erroUsuario || !user) {
        window.location.href = "login.html";
        return;
    }

    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("nome, email, tipo, status")
            .eq("auth_user_id", user.id)
            .single();

    if (erroPerfil || !perfil) {
        window.location.href = "login.html";
        return;
    }

    if (
        perfil.tipo.toLowerCase() !== "socio" ||
        perfil.status.toLowerCase() !== "ativo"
    ) {
        alert("Acesso permitido somente para sócios.");
        window.location.href = "aluno.html";
        return;
    }

    document.getElementById("usuarioEmail").textContent =
        "Você está conectado como: " +
        (perfil.nome || perfil.email);

}


document.getElementById("sair").addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    }
);


carregarAdmin();
