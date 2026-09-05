// ==============================
// VERIFICAR SÓCIO
// ==============================

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
        !["socio", "sócio"].includes(
            (perfil.tipo || "").toLowerCase()
        ) ||
        (perfil.status || "").toLowerCase() !== "ativo"
    ) {
        alert("Acesso permitido somente para sócios.");
        window.location.href = "aluno.html";
        return false;
    }

    return true;
}


// ==============================
// PEGAR ID DO MÓDULO
// ==============================

const parametros =
    new URLSearchParams(window.location.search);

const moduloId =
    parametros.get("id");


// ==============================
// ID DA AULA EM EDIÇÃO
// ==============================

let aulaEditandoId = null;


// ==============================
// CARREGAR MÓDULO
// ==============================

async function carregarModulo() {

    if (!moduloId) {

        document.getElementById("nomeModulo").textContent =
            "Módulo não informado";

        return;
    }

    const { data: modulo, error } =
        await supabaseClient
            .from("modulos")
            .select("id, nome")
            .eq("id", moduloId)
            .single();

    if (error || !modulo) {

        console.error(error);

        document.getElementById("nomeModulo").textContent =
            "Módulo não encontrado";

        return;
    }

    document.getElementById("nomeModulo").textContent =
        modulo.nome || "Módulo";
}


// ==============================
// CARREGAR AULAS
// ==============================

async function carregarAulas() {

    const autorizado =
        await verificarSocio();

    if (!autorizado) return;

    await carregarModulo();

    if (!moduloId) return;

    const area =
        document.getElementById("listaAulas");

    const { data: aulas, error } =
        await supabaseClient
            .from("aulas")
            .select(
                "id, titulo, link_youtube, link_pdf, link_slide, ordem"
            )
            .eq("modulo_id", moduloId)
            .order("ordem", {
                ascending: true
            });

    if (error) {

        console.error(error);

        area.innerHTML = `
            <p>Erro ao carregar as aulas.</p>
        `;

        return;
    }


    if (!aulas || aulas.length === 0) {

        area.innerHTML = `
            <p>
                Nenhuma aula cadastrada ainda.
            </p>
        `;

        return;
    }


    area.innerHTML = "";


    aulas.forEach(function (aula) {

        const card =
            document.createElement("div");

        card.className =
            "course-card";


        card.innerHTML = `

            <h3>
                ${aula.ordem}. ${aula.titulo}
            </h3>

            ${
                aula.link_youtube
                ? `
                    <p>
                        🎥
                        <a
                            href="${aula.link_youtube}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Vídeo do YouTube
                        </a>
                    </p>
                `
                : ""
            }

            ${
                aula.link_pdf
                ? `
                    <p>
                        📄
                        <a
                            href="${aula.link_pdf}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Material PDF
                        </a>
                    </p>
                `
                : ""
            }

            ${
                aula.link_slide
                ? `
                    <p>
                        📊
                        <a
                            href="${aula.link_slide}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Slides
                        </a>
                    </p>
                `
                : ""
            }

            <div style="
                margin-top:20px;
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            ">

                <button
                    type="button"
                    class="btn-editar-aula"
                >
                    ✏️ Editar
                </button>

                <button
                    type="button"
                    class="btn-excluir-aula secondary"
                >
                    🗑️ Excluir
                </button>

                <button
                    type="button"
                    class="btn-questoes-aula"
                >
                    📝 Questões
                </button>

            </div>

        `;


        // ==============================
        // BOTÃO EDITAR
        // ==============================

        card
            .querySelector(".btn-editar-aula")
            .addEventListener("click", function () {

                editarAula(aula);

            });


        // ==============================
        // BOTÃO EXCLUIR
        // ==============================

        card
            .querySelector(".btn-excluir-aula")
            .addEventListener("click", function () {

                excluirAula(aula.id);

            });


        // ==============================
        // BOTÃO QUESTÕES
        // ==============================

        card
            .querySelector(".btn-questoes-aula")
            .addEventListener("click", function () {

                window.location.href =
                    "questoes-admin.html?id=" + aula.id;

            });


        area.appendChild(card);

    });

}


// ==============================
// ABRIR NOVA AULA
// ==============================

document.getElementById("novaAula").addEventListener(
    "click",
    function () {

        aulaEditandoId = null;

        document.getElementById(
            "formularioAula"
        ).style.display = "block";

        document.getElementById(
            "tituloAula"
        ).focus();

        document.getElementById(
            "aulaForm"
        ).reset();

        document.getElementById(
            "ordemAula"
        ).value = 1;

        document.getElementById(
            "mensagemAula"
        ).textContent = "";

    }
);


// ==============================
// EDITAR AULA
// ==============================

function editarAula(aula) {

    aulaEditandoId = aula.id;


    document.getElementById(
        "formularioAula"
    ).style.display = "block";


    document.getElementById(
        "tituloAula"
    ).value = aula.titulo || "";


    document.getElementById(
        "youtubeAula"
    ).value = aula.link_youtube || "";


    document.getElementById(
        "pdfAula"
    ).value = aula.link_pdf || "";


    document.getElementById(
        "slideAula"
    ).value = aula.link_slide || "";


    document.getElementById(
        "ordemAula"
    ).value = aula.ordem || 1;


    document.getElementById(
        "mensagemAula"
    ).textContent =
        "Editando aula...";


    document.getElementById(
        "tituloAula"
    ).focus();

}


// ==============================
// CANCELAR
// ==============================

document.getElementById("cancelarAula").addEventListener(
    "click",
    function () {

        aulaEditandoId = null;

        document.getElementById(
            "formularioAula"
        ).style.display = "none";

        document.getElementById(
            "aulaForm"
        ).reset();

        document.getElementById(
            "ordemAula"
        ).value = 1;

        document.getElementById(
            "mensagemAula"
        ).textContent = "";

    }
);


// ==============================
// SALVAR / ATUALIZAR AULA
// ==============================

document.getElementById("aulaForm").addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const mensagem =
            document.getElementById(
                "mensagemAula"
            );


        const titulo =
            document.getElementById(
                "tituloAula"
            ).value.trim();


        const youtube =
            document.getElementById(
                "youtubeAula"
            ).value.trim();


        const pdf =
            document.getElementById(
                "pdfAula"
            ).value.trim();


        const slide =
            document.getElementById(
                "slideAula"
            ).value.trim();


        const ordem =
            document.getElementById(
                "ordemAula"
            ).value;


        if (!moduloId) {

            mensagem.textContent =
                "Módulo não informado.";

            return;
        }


        mensagem.textContent =
            aulaEditandoId
                ? "Atualizando aula..."
                : "Salvando aula...";


        // ==============================
        // ATUALIZAR AULA
        // ==============================

        if (aulaEditandoId) {

            const { error } =
                await supabaseClient
                    .from("aulas")
                    .update({

                        titulo: titulo,

                        link_youtube:
                            youtube || null,

                        link_pdf:
                            pdf || null,

                        link_slide:
                            slide || null,

                        ordem: ordem

                    })
                    .eq("id", aulaEditandoId);


            if (error) {

                console.error(error);

                mensagem.textContent =
                    "Erro ao atualizar a aula.";

                return;
            }


            mensagem.textContent =
                "Aula atualizada com sucesso!";

        }

        // ==============================
        // CRIAR AULA
        // ==============================

        else {

            const { error } =
                await supabaseClient
                    .from("aulas")
                    .insert({

                        modulo_id: moduloId,

                        titulo: titulo,

                        link_youtube:
                            youtube || null,

                        link_pdf:
                            pdf || null,

                        link_slide:
                            slide || null,

                        ordem: ordem

                    });


            if (error) {

                console.error(error);

                mensagem.textContent =
                    "Erro ao salvar a aula.";

                return;
            }


            mensagem.textContent =
                "Aula criada com sucesso!";

        }


        aulaEditandoId = null;


        document.getElementById(
            "aulaForm"
        ).reset();


        document.getElementById(
            "ordemAula"
        ).value = 1;


        setTimeout(function () {

            document.getElementById(
                "formularioAula"
            ).style.display = "none";

            mensagem.textContent = "";

            carregarAulas();

        }, 1000);

    }
);


// ==============================
// EXCLUIR AULA
// ==============================

async function excluirAula(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta aula?"
        );


    if (!confirmar) return;


    const { error } =
        await supabaseClient
            .from("aulas")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Erro ao excluir a aula."
        );

        return;
    }


    alert(
        "Aula excluída com sucesso!"
    );


    carregarAulas();

}


// ==============================
// SAIR
// ==============================

document.getElementById("sair").addEventListener(
    "click",
    async function (event) {

        event.preventDefault();

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";

    }
);


// ==============================
// INICIAR
// ==============================

carregarAulas();
