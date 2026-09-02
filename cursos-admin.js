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
        !["socio", "sócio"].includes(perfil.tipo.toLowerCase()) ||
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
            .select("id, nome, descricao, preco, imagem, ativo")
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
            ${curso.imagem ? `
                <img
                    src="${curso.imagem}"
                    alt="${curso.nome}"
                    style="max-width: 100%; border-radius: 10px; margin-bottom: 15px;"
                >
            ` : ""}

            <h3>${curso.nome || "Curso sem nome"}</h3>

            <p>
                ${curso.descricao || "Sem descrição cadastrada."}
            </p>

            <p>
                <strong>Preço:</strong>
                R$ ${curso.preco !== null ? curso.preco : "0,00"}
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


async function editarCurso(id) {

    const { data: curso, error } =
        await supabaseClient
            .from("cursos")
            .select("id, nome, descricao, preco, imagem, ativo")
            .eq("id", id)
            .single();

    if (error || !curso) {

        console.error(error);

        alert("Não foi possível carregar o curso.");

        return;
    }

    document.getElementById("edicaoId").value =
        curso.id;

    document.getElementById("edicaoNome").value =
        curso.nome || "";

    document.getElementById("edicaoDescricao").value =
        curso.descricao || "";

    document.getElementById("edicaoPreco").value =
        curso.preco ?? "";

    document.getElementById("edicaoImagem").value =
        curso.imagem || "";

    document.getElementById("edicaoAtivo").checked =
        curso.ativo;

    document.getElementById("areaEdicao").style.display =
        "block";

    document.getElementById("areaEdicao").scrollIntoView({
        behavior: "smooth"
    });

}


document.getElementById("edicaoForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const mensagem =
            document.getElementById("mensagemEdicao");

        const id =
            document.getElementById("edicaoId").value;

        const nome =
            document.getElementById("edicaoNome").value.trim();

        const descricao =
            document.getElementById("edicaoDescricao").value.trim();

        const preco =
            document.getElementById("edicaoPreco").value;

        const imagem =
            document.getElementById("edicaoImagem").value.trim();

        const ativo =
            document.getElementById("edicaoAtivo").checked;

        mensagem.textContent =
            "Salvando alterações...";

        const { error } =
            await supabaseClient
                .from("cursos")
                .update({
                    nome: nome,
                    descricao: descricao,
                    preco: preco || null,
                    imagem: imagem || null,
                    ativo: ativo
                })
                .eq("id", id);

        if (error) {

            console.error(error);

            mensagem.textContent =
                "Erro ao atualizar o curso.";

            return;
        }

        mensagem.textContent =
            "Curso atualizado com sucesso!";

        setTimeout(function () {

            document.getElementById("areaEdicao").style.display =
                "none";

            carregarCursos();

        }, 1000);

    }
);


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

        mensagem.textContent =
            "Salvando curso...";

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


document.getElementById("cancelarEdicao").addEventListener(
    "click",
    function () {

        document.getElementById("areaEdicao").style.display =
            "none";

        document.getElementById("edicaoForm").reset();

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
