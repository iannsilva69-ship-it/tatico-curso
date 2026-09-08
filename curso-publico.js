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

    const porqueFazerCurso =
        document.getElementById("porqueFazerCurso");

    const botaoComprar =
        document.getElementById("botaoComprar");


    // ==============================
    // VERIFICAR ID DO CURSO
    // ==============================

    if (!cursoId) {

        nomeCurso.textContent =
            "Curso não encontrado.";

        descricaoCurso.textContent =
            "";

        porqueFazerCurso.innerHTML =
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
            .eq("id", cursoId)
            .single();


    if (erroCurso || !curso) {

        console.error(
            "ERRO CURSO:",
            JSON.stringify(
                erroCurso,
                null,
                2
            )
        );

        nomeCurso.textContent =
            "Curso não encontrado.";

        descricaoCurso.textContent =
            "Não foi possível carregar as informações deste curso.";

        porqueFazerCurso.innerHTML =
            "";

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
              preco
                  .toFixed(2)
                  .replace(".", ",")
            : "Consulte o valor";


    // ==============================
    // POR QUE FAZER ESTE CURSO
    // ==============================

    if (curso.porque_fazer) {

        porqueFazerCurso.innerHTML = `

            <div class="course-card">

                <p>
                    ${curso.porque_fazer.replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>

            </div>

        `;

    } else {

        porqueFazerCurso.innerHTML = `

            <div class="course-card">

                <p>
                    Informações sobre este curso
                    serão disponibilizadas em breve.
                </p>

            </div>

        `;
    }


    // ==============================
    // IMAGEM DO CURSO
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
