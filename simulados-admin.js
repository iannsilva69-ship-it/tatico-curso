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
// ID DO SIMULADO EM EDIÇÃO
// ==============================

let simuladoEditandoId = null;


// ==============================
// CARREGAR SIMULADOS
// ==============================

async function carregarSimulados() {

    const autorizado =
        await verificarSocio();

    if (!autorizado) return;


    const area =
        document.getElementById("listaSimulados");


    area.innerHTML =
        "Carregando simulados...";


    const { data: simulados, error } =
        await supabaseClient
            .from("simulados")
            .select("*")
            .order("id", {
                ascending: true
            });


    if (error) {

        console.error(error);

        area.innerHTML = `
            <p>
                Erro ao carregar os simulados.
            </p>
        `;

        return;
    }


    if (!simulados || simulados.length === 0) {

        area.innerHTML = `
            <p>
                Nenhum simulado cadastrado ainda.
            </p>
        `;

        return;
    }


    area.innerHTML = "";


    simulados.forEach(function (simulado) {

        const card =
            document.createElement("div");

        card.className =
            "course-card";

        card.style.marginBottom =
            "20px";


        card.innerHTML = `

            <h3>
                ${simulado.titulo}
            </h3>

            ${
                simulado.descricao
                ? `
                    <p>
                        ${simulado.descricao}
                    </p>
                `
                : ""
            }

            <p>
                ${
                    simulado.ativo
                    ? "🟢 Simulado ativo"
                    : "🔴 Simulado inativo"
                }
            </p>

            <p>
                📄
                <a
                    href="${simulado.link_pdf}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Abrir PDF do simulado
                </a>
            </p>


            <div style="
                margin-top:20px;
                display:flex;
                gap:8px;
                flex-wrap:wrap;
            ">

                <button
                    type="button"
                    class="btn-editar"
                >
                    ✏️ Editar
                </button>

                <button
                    type="button"
                    class="btn-excluir secondary"
                >
                    🗑️ Excluir
                </button>

            </div>

        `;


        // ==============================
        // EDITAR
        // ==============================

        card
            .querySelector(".btn-editar")
            .addEventListener(
                "click",
                function () {

                    editarSimulado(simulado);

                }
            );


        // ==============================
        // EXCLUIR
        // ==============================

        card
            .querySelector(".btn-excluir")
            .addEventListener(
                "click",
                function () {

                    excluirSimulado(simulado.id);

                }
            );


        area.appendChild(card);

    });

}


// ==============================
// EDITAR SIMULADO
// ==============================

function editarSimulado(simulado) {

    simuladoEditandoId =
        simulado.id;


    document.getElementById(
        "tituloFormulario"
    ).textContent =
        "Editar simulado";


    document.getElementById(
        "tituloSimulado"
    ).value =
        simulado.titulo || "";


    document.getElementById(
        "descricaoSimulado"
    ).value =
        simulado.descricao || "";


    document.getElementById(
        "pdfSimulado"
    ).value =
        simulado.link_pdf || "";


    document.getElementById(
        "ativoSimulado"
    ).value =
        String(simulado.ativo);


    document.getElementById(
        "formularioSimulado"
    ).style.display =
        "block";


    document.getElementById(
        "mensagemSimulado"
    ).textContent =
        "Editando simulado...";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==============================
// EXCLUIR SIMULADO
// ==============================

async function excluirSimulado(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este simulado?"
        );


    if (!confirmar) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("simulados")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Não foi possível excluir o simulado."
        );

        return;
    }


    alert(
        "Simulado excluído com sucesso!"
    );


    await carregarSimulados();

}


// ==============================
// NOVO SIMULADO
// ==============================

document
    .getElementById("novoSimulado")
    .addEventListener(
        "click",
        function () {

            simuladoEditandoId =
                null;


            document.getElementById(
                "tituloFormulario"
            ).textContent =
                "Novo simulado";


            document.getElementById(
                "simuladoForm"
            ).reset();


            document.getElementById(
                "ativoSimulado"
            ).value =
                "true";


            document.getElementById(
                "formularioSimulado"
            ).style.display =
                "block";


            document.getElementById(
                "mensagemSimulado"
            ).textContent =
                "";


            document.getElementById(
                "tituloSimulado"
            ).focus();

        }
    );


// ==============================
// CANCELAR
// ==============================

document
    .getElementById("cancelarSimulado")
    .addEventListener(
        "click",
        function () {

            simuladoEditandoId =
                null;


            document.getElementById(
                "simuladoForm"
            ).reset();


            document.getElementById(
                "ativoSimulado"
            ).value =
                "true";


            document.getElementById(
                "formularioSimulado"
            ).style.display =
                "none";


            document.getElementById(
                "mensagemSimulado"
            ).textContent =
                "";

        }
    );


// ==============================
// SALVAR SIMULADO
// ==============================

document
    .getElementById("simuladoForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const mensagem =
                document.getElementById(
                    "mensagemSimulado"
                );


            const titulo =
                document.getElementById(
                    "tituloSimulado"
                ).value.trim();


            const descricao =
                document.getElementById(
                    "descricaoSimulado"
                ).value.trim();


            const linkPdf =
                document.getElementById(
                    "pdfSimulado"
                ).value.trim();


            const ativo =
                document.getElementById(
                    "ativoSimulado"
                ).value === "true";


            mensagem.textContent =
                simuladoEditandoId
                    ? "Atualizando simulado..."
                    : "Salvando simulado...";


            let error = null;


            // ==============================
            // EDITAR
            // ==============================

            if (simuladoEditandoId) {

                const resultado =
                    await supabaseClient
                        .from("simulados")
                        .update({

                            titulo: titulo,

                            descricao:
                                descricao || null,

                            link_pdf:
                                linkPdf,

                            ativo:
                                ativo

                        })
                        .eq(
                            "id",
                            simuladoEditandoId
                        );


                error =
                    resultado.error;

            }


            // ==============================
            // NOVO
            // ==============================

            else {

                const resultado =
                    await supabaseClient
                        .from("simulados")
                        .insert({

                            titulo:
                                titulo,

                            descricao:
                                descricao || null,

                            link_pdf:
                                linkPdf,

                            ativo:
                                ativo

                        });


                error =
                    resultado.error;

            }


            if (error) {

                console.error(error);

                mensagem.textContent =
                    "Não foi possível salvar o simulado.";

                return;
            }


            mensagem.textContent =
                "Simulado salvo com sucesso!";


            simuladoEditandoId =
                null;


            document.getElementById(
                "simuladoForm"
            ).reset();


            document.getElementById(
                "ativoSimulado"
            ).value =
                "true";


            setTimeout(function () {

                document.getElementById(
                    "formularioSimulado"
                ).style.display =
                    "none";


                mensagem.textContent =
                    "";


                carregarSimulados();

            }, 1000);

        }
    );


// ==============================
// SAIR
// ==============================

document
    .getElementById("sair")
    .addEventListener(
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

carregarSimulados();
