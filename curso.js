async function carregarCurso() {

    const {
        data: { user },
        error: erroUsuario
    } = await supabaseClient.auth.getUser();

    if (erroUsuario || !user) {
        window.location.href = "login.html";
        return;
    }

    const parametros = new URLSearchParams(window.location.search);
    const cursoId = parametros.get("id");

    if (!cursoId) {
        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";

        return;
    }

    // Verifica se o aluno possui matrícula ativa
    const { data: perfil } = await supabaseClient
        .from("perfis")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

    if (!perfil) {
        window.location.href = "aluno.html";
        return;
    }

    const { data: matricula } = await supabaseClient
        .from("matriculas")
        .select("id")
        .eq("usuario_id", perfil.id)
        .eq("curso_id", cursoId)
        .eq("status", "ativo")
        .maybeSingle();

    if (!matricula) {
        alert("Você não possui acesso a este curso.");
        window.location.href = "aluno.html";
        return;
    }

    // Busca informações do curso
    const { data: curso, error: erroCurso } =
        await supabaseClient
            .from("cursos")
            .select("id, nome, descricao")
            .eq("id", cursoId)
            .single();

    if (erroCurso || !curso) {
        document.getElementById("nomeCurso").textContent =
            "Curso não encontrado.";

        return;
    }

    document.getElementById("nomeCurso").textContent =
        curso.nome;

    document.getElementById("descricaoCurso").textContent =
        curso.descricao || "Conteúdo do curso.";

    // Busca módulos
    const { data: modulos, error: erroModulos } =
        await supabaseClient
            .from("modulos")
            .select("id, nome, ordem")
            .eq("curso_id", cursoId)
            .order("ordem", { ascending: true });

    if (erroModulos) {
        console.error(erroModulos);

        document.getElementById("modulos").textContent =
            "Não foi possível carregar os módulos.";

        return;
    }

    const areaModulos = document.getElementById("modulos");

    if (!modulos || modulos.length === 0) {
        areaModulos.innerHTML = `
            <p>Este curso ainda não possui conteúdo cadastrado.</p>
        `;

        return;
    }

    areaModulos.innerHTML = "";

    for (const modulo of modulos) {

        const bloco = document.createElement("div");

        bloco.className = "course-card";

        bloco.innerHTML = `
            <h3>${modulo.nome}</h3>
            <div id="modulo-${modulo.id}">
                Carregando aulas...
            </div>
        `;

        areaModulos.appendChild(bloco);

        const { data: aulas, error: erroAulas } =
            await supabaseClient
                .from("aulas")
                .select(`
                    id,
                    titulo,
                    link_youtube,
                    link_pdf,
                    link_slide,
                    ordem
                `)
                .eq("modulo_id", modulo.id)
                .order("ordem", { ascending: true });

        const areaAulas =
            document.getElementById(`modulo-${modulo.id}`);

        if (erroAulas) {
            areaAulas.textContent =
                "Erro ao carregar as aulas.";

            continue;
        }

        if (!aulas || aulas.length === 0) {
            areaAulas.innerHTML =
                "<p>Nenhuma aula cadastrada.</p>";

            continue;
        }

        areaAulas.innerHTML = "";

        aulas.forEach(function (aula) {

            const aulaDiv = document.createElement("div");

            aulaDiv.style.marginTop = "20px";
            aulaDiv.style.padding = "15px";
            aulaDiv.style.borderTop = "1px solid #ddd";

            let conteudo = `
                <strong>${aula.titulo}</strong>
            `;

            if (aula.link_youtube) {
                conteudo += `
                    <br><br>
                    <a href="${aula.link_youtube}"
                       target="_blank">
                        ▶️ Assistir videoaula
                    </a>
                `;
            }

            if (aula.link_pdf) {
                conteudo += `
                    <br><br>
                    <a href="${aula.link_pdf}"
                       target="_blank">
                        📄 Abrir PDF
                    </a>
                `;
            }

            if (aula.link_slide) {
                conteudo += `
                    <br><br>
                    <a href="${aula.link_slide}"
                       target="_blank">
                        📊 Abrir slides
                    </a>
                `;
            }

            aulaDiv.innerHTML = conteudo;

            areaAulas.appendChild(aulaDiv);
        });
    }
}


// Botão sair
document.getElementById("sair").addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href = "login.html";
    }
);


carregarCurso();
