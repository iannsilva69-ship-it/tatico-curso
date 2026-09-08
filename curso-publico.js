// ==============================
// CURSO PÚBLICO
// ==============================

async function carregarCurso() {

    const params =
        new URLSearchParams(window.location.search);

    const cursoId =
        params.get("id");

    const nomeCurso =
        document.getElementById("nomeCurso");

    const descricaoCurso =
        document.getElementById("descricaoCurso");

    const precoCurso =
        document.getElementById("precoCurso");

    const conteudoCurso =
        document.getElementById("conteudoCurso");

    const botaoComprar =
        document.getElementById("botaoComprar");


    // ==============================
    // VERIFICAR ID
    // ==============================

    if (!cursoId) {

        nomeCurso.textContent =
            "Curso não encontrado.";

        descricaoCurso.textContent =
            "";

        conteudoCurso.innerHTML =
            "";

        return;
    }


    // ==============================
    // BUSCAR CURSO
    // ==============================

    const {
        data: curso,
        error: erroCurso
    } =
        await supabaseClient
            .from("cursos")
            .select("*")
            .eq(
    "curso_id",
    cursoId
)
            .single();


    if (erroCurso || !curso) {

       console.error(
    "ERRO CURSO:",
    JSON.stringify(erroCurso, null, 2)
);

        nomeCurso.textContent =
            "Curso não encontrado.";

        descricaoCurso.textContent =
            "Não foi possível carregar as informações deste curso.";

        return;
    }


    // ==============================
    // INFORMAÇÕES DO CURSO
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
            ? "R$ " +
              preco.toFixed(2).replace(".", ",")
            : "Consulte o valor";


    // ==============================
    // IMAGEM
    // ==============================

    if (curso.imagem) {

        const imagem =
            document.createElement("img");

        imagem.src =
            curso.imagem;

        imagem.alt =
            curso.nome || "Curso";

        imagem.style.maxWidth =
            "100%";

        imagem.style.width =
            "400px";

        imagem.style.borderRadius =
            "15px";

        imagem.style.marginTop =
            "20px";


        document
            .querySelector(".hero-text")
            .appendChild(imagem);
    }


    // ==============================
    // BUSCAR MÓDULOS
    // ==============================

    const {
        data: todosModulos,
        error: erroModulos
    } =
        await supabaseClient
            .from("modulos")
            .select("*");


    if (erroModulos) {

        console.error(
            "ERRO MODULOS:",
            erroModulos
        );

        conteudoCurso.innerHTML =
            "<p>Não foi possível carregar o conteúdo.</p>";

        return;
    }


    // ==============================
    // FILTRAR MÓDULOS DO CURSO
    // ==============================

    const modulos =
        (todosModulos || [])
            .filter(function (modulo) {

                return String(modulo.id_curso) ===
                    String(cursoId);

            })
            .sort(function (a, b) {

                return (a.ordem || 0) -
                    (b.ordem || 0);

            });


    // ==============================
    // NENHUM MÓDULO
    // ==============================

    if (modulos.length === 0) {

        conteudoCurso.innerHTML = `

            <div class="course-card">

                <p>
                    O conteúdo deste curso será
                    disponibilizado em breve.
                </p>

            </div>

        `;

    } else {

        conteudoCurso.innerHTML =
            "";


        // ==============================
        // PERCORRER MÓDULOS
        // ==============================

        for (const modulo of modulos) {


            // ==============================
            // BUSCAR TODAS AS AULAS
            // ==============================

            const {
                data: todasAulas,
                error: erroAulas
            } =
                await supabaseClient
                    .from("aulas")
                    .select("*");


            if (erroAulas) {

                console.error(
                    "Erro ao carregar aulas:",
                    erroAulas
                );

                continue;
            }


            // ==============================
            // FILTRAR AULAS DO MÓDULO
            // ==============================

            const aulas =
                (todasAulas || [])
                    .filter(function (aula) {

                        return String(aula.modulo_id) ===
                            String(modulo.id);

                    })
                    .sort(function (a, b) {

                        return (a.ordem || 0) -
                            (b.ordem || 0);

                    });


            // ==============================
            // CARD DO MÓDULO
            // ==============================

            const card =
                document.createElement("div");

            card.className =
                "course-card";

            card.style.marginBottom =
                "20px";


            card.innerHTML = `

                <h3>
                    📚 ${
                        modulo.nome ||
                        "Módulo"
                    }
                </h3>

                <p>
                    ${
                        aulas.length
                    }
                    aula(s)
                </p>

            `;


            // ==============================
            // LISTA DE AULAS
            // ==============================

            if (aulas.length > 0) {

                const lista =
                    document.createElement("ul");


                aulas.forEach(
                    function (aula) {

                        const item =
                            document.createElement("li");

                        item.textContent =
                            aula.titulo ||
                            "Aula";


                        lista.appendChild(
                            item
                        );

                    }
                );


                card.appendChild(
                    lista
                );
            }


            conteudoCurso.appendChild(
                card
            );
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
                encodeURIComponent(
                    curso.id
                );

        }
    );

}


// ==============================
// INICIAR
// ==============================

carregarCurso();
