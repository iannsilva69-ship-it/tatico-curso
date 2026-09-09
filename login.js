const form =
    document.getElementById("loginForm");

const mensagem =
    document.getElementById("mensagem");


form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // ==============================
        // PEGAR DADOS
        // ==============================

        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const senha =
            document
                .getElementById("senha")
                .value;


        mensagem.textContent =
            "Entrando...";


        // ==============================
        // LOGIN
        // ==============================

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email: email,
                    password: senha
                });


        if (error) {

            console.error(
                "ERRO LOGIN:",
                error
            );

            mensagem.textContent =
                "E-mail ou senha incorretos.";

            return;
        }


        // ==============================
        // BUSCAR PERFIL
        // ==============================

        const {
            data: perfil,
            error: erroPerfil
        } =
            await supabaseClient
                .from("perfis")
                .select(
                    "id, tipo, status"
                )
                .eq(
                    "auth_user_id",
                    data.user.id
                )
                .single();


        if (
            erroPerfil ||
            !perfil
        ) {

            console.error(
                "ERRO PERFIL:",
                erroPerfil
            );

            mensagem.textContent =
                "Perfil do usuário não encontrado.";

            await supabaseClient
                .auth
                .signOut();

            return;
        }


        // ==============================
        // NORMALIZAR DADOS
        // ==============================

        const tipo =
            String(
                perfil.tipo || ""
            )
            .toLowerCase()
            .trim();


        const status =
            String(
                perfil.status || ""
            )
            .toLowerCase()
            .trim();


        // ==============================
        // VERIFICAR STATUS
        // ==============================

        if (
            status !== "ativo"
        ) {

            mensagem.textContent =
                "Sua conta está inativa.";

            await supabaseClient
                .auth
                .signOut();

            return;
        }


        // ==============================
        // IDENTIFICAR SÓCIO
        // ==============================

        const ehSocio =
            tipo === "socio" ||
            tipo === "sócio";


        // ==============================
        // LOGIN REALIZADO
        // ==============================

        mensagem.textContent =
            "Login realizado com sucesso!";


        // ==============================
        // REDIRECIONAMENTO
        // ==============================

        if (ehSocio) {

            window.location.href =
                "admin.html";

        } else {

            window.location.href =
                "aluno.html";
        }

    }
);
