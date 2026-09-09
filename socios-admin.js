// ==============================
// GERENCIAR SÓCIOS
// ==============================

async function verificarAcesso() {

    // ==============================
    // VERIFICAR USUÁRIO LOGADO
    // ==============================

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();


    if (erroUsuario || !user) {

        window.location.href =
            "login.html";

        return null;
    }


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

        window.location.href =
            "login.html";

        return null;
    }


    // ==============================
    // VERIFICAR TIPO
    // ==============================

    const tipo =
        String(
            perfil.tipo || ""
        ).toLowerCase();


    const status =
        String(
            perfil.status || ""
        ).toLowerCase();


    const ehSocio =
        tipo === "socio" ||
        tipo === "sócio";


    const estaAtivo =
        status === "ativo";


    // ==============================
    // BLOQUEAR ACESSO
    // ==============================

    if (!ehSocio || !estaAtivo) {

        alert(
            "Acesso permitido somente para Sócios ativos."
        );

        window.location.href =
            "login.html";

        return null;
    }


    // ==============================
    // ACESSO AUTORIZADO
    // ==============================

    console.log(
        "Acesso autorizado para Sócio."
    );

    return user;
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
// INICIAR
// ==============================

verificarAcesso();
