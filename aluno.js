async function carregarAluno() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("usuarioEmail").textContent =
        "Você está conectado como: " + user.email;

    const { data: perfil } = await supabaseClient
        .from("perfis")
        .select("id, nome")
        .eq("auth_user_id", user.id)
        .single();

    if (!perfil) {
        document.getElementById("cursos").textContent =
            "Perfil do aluno não encontrado.";
        return;
    }

    const { data: matriculas, error: erroMatriculas } =
        await supabaseClient
            .from("matriculas")
            .select(`
                id,
                status,
                data_vencimento,
                cursos (
                    id,
                    nome,
                    descricao,
                    imagem
                )
            `)
            .eq("usuario_id", perfil.id)
            .eq("status", "ativo");

    if (erroMatriculas) {
        console.error(erroMatriculas);

        document.getElementById("cursos").textContent =
            "Não foi possível carregar seus cursos.";

        return;
    }

    const areaCursos = document.getElementById("cursos");

    if (!matriculas || matriculas.length === 0) {
        areaCursos.innerHTML = `
            <p>Você ainda não possui cursos ativos.</p>
        `;
        return;
    }

    areaCursos.innerHTML = "";

    matriculas.forEach(function (matricula) {

        const curso = matricula.cursos;

        if (!curso) return;

        const card = document.createElement("div");

        card.className = "course-card";

        card.innerHTML = `
            <h3>${curso.nome}</h3>

            <p>
                ${curso.descricao || "Curso disponível para você."}
            </p>

            <button onclick="abrirCurso(${curso.id})">
                Acessar curso
            </button>
        `;

        areaCursos.appendChild(card);
    });
}


async function abrirCurso(cursoId) {

    window.location.href = "curso.html?id=" + cursoId;
}


document.getElementById("sair").addEventListener("click", async function (event) {

    event.preventDefault();

    await supabaseClient.auth.signOut();

    window.location.href = "login.html";
});


carregarAluno();
