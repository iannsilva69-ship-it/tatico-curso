async function verificarSocio() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "login.html";
        return false;
    }

    const { data: perfil, error: erroPerfil } =
        await supabaseClient
            .from("perfis")
            .select("tipo, status")
            .eq("auth_user_id", user.id)
            .single();

    if (erroPerfil || !perfil) {
        window.location.href = "login.html";
        return false;
    }

    if (
        perfil.tipo.toLowerCase() !== "socio" ||
        perfil.status.toLowerCase() !== "ativo"
    ) {
        alert("Acesso permitido somente para sócios.");
        window.location.href = "aluno.html";
        return false;
    }

    return true;
}


async function carregarCursos() {

    const autorizado = await verificarSocio();

    if (!autorizado) return;

    const area = document.getElementById("listaCursos");

    const { data: cursos, error } =
        await supabaseClient
            .from("cursos")
            .select("id, nome, descricao, preco, ativo")
            .order("id", { ascending: false });

    if (error) {

        console.error(error);

        area.innerHTML = `
            <p>Erro ao carregar os cursos.</p>
        `;

        return;
    }

    if (!cursos || cursos.length === 0) {

        area.innerHTML = `
            <p>Nenhum curso cadastrado ainda.</p>
        `;

        return;
    }

    area.innerHTML = "";

    cursos.forEach(function (curso) {

        const card = document.createElement("div");

        card.className = "course-card";

        card.innerHTML = `
            <h3>${curso.nome || "Curso sem nome"}</h3>

            <p>
                ${curso.descricao || "Sem descrição cadastrada."}
            </p>

            <p>
                <strong>Preço:</strong>
                R$ ${curso.preco || "0,00"}
            </p>

            <p>
                <strong>Status:</strong>
                ${curso.ativo ? "Ativo" : "Inativo"}
            </p>

            <button onclick="editarCurso(${curso.id})">
                ✏️ Editar
            </button>
        `;

        area.appendChild(card);

    });
}


document.getElementById("novoCurso").addEventListener(
    "click",
    function () {

        document.getElementById("formularioCurso").style.display =
            "block";

        document.getElementById("nomeCurso").focus();

    }
);


document.getElementById("cancelarCurso").addEventListener(
    "click",
    function () {

        document.getElementById("formularioCurso").style.display =
            "none";

        document.getElementById("cursoForm").reset();

    }
);


document.getElementById("cursoForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const mensagem =
            document.getElementById("mensagemCurso");

        const nome =
            document.getElementById("nomeCurso").value.trim();

        const descricao =
            document.getElementById("descricaoCurso").value.trim();

        const preco =
            document.getElementById("precoCurso").value;

        const imagem =
            document.getElementById("imagemCurso").value.trim();

        const ativo =
            document.getElementById("ativoCurso").checked;

        mensagem.textContent = "Salvando curso...";

        const { error } =
            await supabaseClient
                .from("cursos")
                .insert({
                    nome: nome,
                    descricao: descricao,
                    preco: preco || null,
                    imagem: imagem || null,
                    ativo: ativo
                });

        if (error) {

            console.error(error);

            mensagem.textContent =
                "Erro ao salvar o curso.";

            return;
        }

        mensagem.textContent =
            "Curso criado com sucesso!";

        document.getElementById("cursoForm").reset();

        document.getElementById("ativoCurso").checked = true;

        setTimeout(function () {

            document.getElementById("formularioCurso").style.display =
                "none";

            mensagem.textContent = "";

            carregarCursos();

        }, 1000);

    }
);


document.getElementById("sair").addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";

    }
);


carregarCursos();
