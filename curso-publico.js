// ==============================
// CURSO PÚBLICO
// ==============================

async function carregarCurso() {

    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("id");

    const nomeCurso = document.getElementById("nomeCurso");
    const descricaoCurso = document.getElementById("descricaoCurso");
    const precoCurso = document.getElementById("precoCurso");
    const conteudoCurso = document.getElementById("conteudoCurso");
    const botaoComprar = document.getElementById("botaoComprar");

    if (!cursoId) {

        nomeCurso.textContent = "Curso não encontrado.";
        descricaoCurso.textContent = "";
        conteudoCurso.innerHTML = "";

        return;
    }

    // ==============================
    // BUSCAR CURSO
    // ==============================

    const { data: curso, error: erroCurso } =
        await supabaseClient
            .from("cursos")
            .select("id, nome, descricao, preco, imagem, ativo")
            .eq("id", cursoId)
            .single();

    if (erroCurso || !curso) {

        console.error("Erro ao carregar curso:", erroCurso);

        nomeCurso.textContent = "Curso não encontrado.";
        descricaoCurso.textContent =
            "Não foi possível carregar as informações deste curso.";

        return;
    }

    // ==============================
    // PREENCHER INFORMAÇÕES
    // ==============================

    nomeCurso.textContent =
        curso.nome || "Curso";

    descricaoCurso.textContent =
        curso.descricao ||
        "Curso preparatório do Tático Curso.";

    const preco =
        Number(curso.preco || 0);

    precoCurso.textContent =
        preco > 0
            ? "R$ " + preco.toFixed(2).replace(".", ",")
            : "Consulte o valor";

    // ==============================
    // IMAGEM
    // ==============================

    if (curso.imagem) {

        const imagem =
            document.createElement("img");

        imagem.src = curso.imagem;
        imagem.alt = curso.nome || "Curso";

        imagem.style.maxWidth = "100%";
        imagem.style.width = "400px";
        imagem.style.borderRadius = "15px";
        imagem.style.marginTop = "20px";

        document
            .querySelector(".hero-text")
            .appendChild(imagem);
    }

    // ==============================
    // BUSCAR MÓDULOS
    // ==============================

    const { data: modulos, error: erroModulos } =
        await supabaseClient
            .from("modulos")
            .select("id, titulo, ordem")
            .eq("curso_id", cursoId)
            .order("ordem", { ascending: true });

    if (erroModulos) {

       console.error(
    "ERRO MODULOS:",
    JSON.stringify(erroModulos, null, 2)
);

        conteudoCurso.innerHTML =
            "<p>Não foi possível carregar o conteúdo.</p>";

        return;
    }

    if (!modulos || modulos.length === 0) {

        conteudoCurso.innerHTML = `
            <div class="course-card">
                <p>
                    O conteúdo deste curso será disponibilizado em breve.
                </p>
            </div>
        `;

    } else {

        conteudoCurso.innerHTML = "";

        for (const modulo of modulos) {

            const { data: aulas, error: erroAulas } =
                await supabaseClient
                    .from("aulas")
                    .select("id, nome, ordem")
.eq("id_curso", cursoId)
                    .order("ordem", { ascending: true });

            if (erroAulas) {

                console.error(
                    "Erro ao carregar aulas:",
                    erroAulas
                );

                continue;
            }

            const card =
                document.createElement("div");

            card.className =
                "course-card";

            card.style.marginBottom =
                "20px";

            card.innerHTML = `

                <h3>
                    📚 ${modulo.nome || "Módulo"}
                </h3>

                <p>
                    ${
                        aulas
                            ? aulas.length
                            : 0
                    }
                    aula(s)
                </p>

            `;

            if (aulas && aulas.length > 0) {

                const lista =
                    document.createElement("ul");

                aulas.forEach(function (aula) {

                    const item =
                        document.createElement("li");

                    item.textContent =
                        aula.titulo || "Aula";

                    lista.appendChild(item);

                });

                card.appendChild(lista);
            }

            conteudoCurso.appendChild(card);
        }
    }

    // ==============================
    // BOTÃO COMPRAR
    // ==============================

    botaoComprar.addEventListener(
        "click",
        function () {

            window.location.href =
                "cadastro.html?curso=" +
                encodeURIComponent(curso.id);

        }
    );
}


// ==============================
// INICIAR
// ==============================

carregarCurso();
