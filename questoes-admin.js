// ==============================
// GERENCIAR QUESTÕES
// ==============================

let aulaId = null;
let questaoEditandoId = null;


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

    if (
        erroPerfil ||
        !perfil ||
        !["socio", "sócio"].includes(
            perfil.tipo.toLowerCase()
        ) ||
        perfil.status.toLowerCase() !== "ativo"
    ) {
        alert("Acesso permitido somente para sócios.");
        window.location.href = "aluno.html";
        return false;
    }

    return true;
}


// ==============================
// CARREGAR NOME DA AULA
// ==============================

async function carregarAula() {

    const { data: aula, error } =
        await supabaseClient
            .from("aulas")
            .select("id, titulo")
            .eq("id", aulaId)
            .single();

    if (error || !aula) {

        console.error(error);

        document.getElementById("nomeAula").textContent =
            "Aula não encontrada";

        return;
    }

    document.getElementById("nomeAula").textContent =
        aula.titulo;
}


// ==============================
// CARREGAR QUESTÕES
// ==============================

async function carregarQuestoes() {

    const lista =
        document.getElementById("listaQuestoes");

    lista.innerHTML =
        "Carregando questões...";

    const { data: questoes, error } =
        await supabaseClient
            .from("questoes")
            .select("*")
            .eq("aula_id", aulaId)
            .order("id", {
                ascending: true
            });

    if (error) {

        console.error(error);

        lista.innerHTML = `
            <p>
                Não foi possível carregar as questões.
            </p>
        `;

        return;
    }

    if (!questoes || questoes.length === 0) {

        lista.innerHTML = `
            <p>
                Nenhuma questão cadastrada nesta aula.
            </p>
        `;

        return;
    }

    lista.innerHTML = "";

    questoes.forEach(function (questao, index) {

        const card =
            document.createElement("div");

        card.className =
            "course-card";

        card.style.marginBottom = "20px";


        card.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:15px;
                flex-wrap:wrap;
            ">

                <h3>
                    Questão ${index + 1}
                </h3>

                <div>

                    <button
                        type="button"
                        class="btn-editar"
                    >
                        ✏️ Editar
                    </button>

                    <button
                        type="button"
                        class="btn-excluir"
                        style="
                            margin-left:8px;
                        "
                    >
                        🗑️ Excluir
                    </button>

                </div>

            </div>


            <p>
                <strong>Enunciado:</strong>
            </p>

            <p>
                ${questao.enunciado}
            </p>


            <p>
                <strong>A)</strong>
                ${questao.alternativa_a}
            </p>

            <p>
                <strong>B)</strong>
                ${questao.alternativa_b}
            </p>

            <p>
                <strong>C)</strong>
                ${questao.alternativa_c}
            </p>

            <p>
                <strong>D)</strong>
                ${questao.alternativa_d}
            </p>

            <p>
                <strong>E)</strong>
                ${questao.alternativa_e}
            </p>


            <p>
                <strong>Resposta correta:</strong>
                ${questao.resposta_correta}
            </p>


            ${
                questao.explicacao
                ? `
                    <p>
                        <strong>Explicação:</strong>
                    </p>

                    <p>
                        ${questao.explicacao}
                    </p>
                `
                : ""
            }

        `;


        // ==============================
        // EDITAR
        // ==============================

        card
            .querySelector(".btn-editar")
            .addEventListener(
                "click",
                function () {

                    editarQuestao(questao);

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

                    excluirQuestao(questao.id);

                }
            );


        lista.appendChild(card);

    });
}


// ==============================
// EDITAR QUESTÃO
// ==============================

function editarQuestao(questao) {

    questaoEditandoId =
        questao.id;

    document.getElementById("tituloFormulario").textContent =
        "Editar questão";

    document.getElementById("enunciado").value =
        questao.enunciado || "";

    document.getElementById("alternativaA").value =
        questao.alternativa_a || "";

    document.getElementById("alternativaB").value =
        questao.alternativa_b || "";

    document.getElementById("alternativaC").value =
        questao.alternativa_c || "";

    document.getElementById("alternativaD").value =
        questao.alternativa_d || "";

    document.getElementById("alternativaE").value =
        questao.alternativa_e || "";

    document.getElementById("respostaCorreta").value =
        questao.resposta_correta || "";

    document.getElementById("explicacao").value =
        questao.explicacao || "";


    document.getElementById("formularioQuestao").style.display =
        "block";


    document.getElementById("mensagemQuestao").textContent =
        "";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==============================
// EXCLUIR QUESTÃO
// ==============================

async function excluirQuestao(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta questão?"
        );

    if (!confirmar) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("questoes")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Não foi possível excluir a questão."
        );

        return;
    }


    await carregarQuestoes();
}


// ==============================
// ABRIR FORMULÁRIO
// ==============================

document
    .getElementById("novaQuestao")
    .addEventListener(
        "click",
        function () {

            questaoEditandoId = null;

            document.getElementById("tituloFormulario").textContent =
                "Nova questão";

            document.getElementById("questaoForm").reset();

            document.getElementById("formularioQuestao").style.display =
                "block";

            document.getElementById("mensagemQuestao").textContent =
                "";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );


// ==============================
// CANCELAR
// ==============================

document
    .getElementById("cancelarQuestao")
    .addEventListener(
        "click",
        function () {

            questaoEditandoId = null;

            document.getElementById("questaoForm").reset();

            document.getElementById("formularioQuestao").style.display =
                "none";

            document.getElementById("mensagemQuestao").textContent =
                "";
        }
    );


// ==============================
// SALVAR QUESTÃO
// ==============================

document
    .getElementById("questaoForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const mensagem =
                document.getElementById("mensagemQuestao");

            mensagem.textContent =
                "Salvando...";


            const dados = {

                aula_id: aulaId,

                enunciado:
                    document.getElementById("enunciado").value.trim(),

                alternativa_a:
                    document.getElementById("alternativaA").value.trim(),

                alternativa_b:
                    document.getElementById("alternativaB").value.trim(),

                alternativa_c:
                    document.getElementById("alternativaC").value.trim(),

                alternativa_d:
                    document.getElementById("alternativaD").value.trim(),

                alternativa_e:
                    document.getElementById("alternativaE").value.trim(),

                resposta_correta:
                    document.getElementById("respostaCorreta").value,

                explicacao:
                    document.getElementById("explicacao").value.trim()

            };


            let error = null;


            // ==============================
            // EDITAR
            // ==============================

            if (questaoEditandoId) {

                const resultado =
                    await supabaseClient
                        .from("questoes")
                        .update(dados)
                        .eq(
                            "id",
                            questaoEditandoId
                        );

                error =
                    resultado.error;

            }


            // ==============================
            // NOVA QUESTÃO
            // ==============================

            else {

                const resultado =
                    await supabaseClient
                        .from("questoes")
                        .insert(dados);

                error =
                    resultado.error;

            }


            if (error) {

                console.error(error);

                mensagem.textContent =
                    "Não foi possível salvar a questão.";

                return;
            }


            mensagem.textContent =
                "Questão salva com sucesso!";


            questaoEditandoId = null;


            document.getElementById("questaoForm").reset();


            document.getElementById("formularioQuestao").style.display =
                "none";


            await carregarQuestoes();

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

async function iniciar() {

    const autorizado =
        await verificarSocio();

    if (!autorizado) {
        return;
    }


    const parametros =
        new URLSearchParams(
            window.location.search
        );


    aulaId =
        parametros.get("id");


    if (!aulaId) {

        document.getElementById("nomeAula").textContent =
            "Aula não informada";

        document.getElementById("listaQuestoes").innerHTML =
            `
                <p>
                    Nenhuma aula foi selecionada.
                </p>
            `;

        return;
    }


    await carregarAula();

    await carregarQuestoes();

}


iniciar();
