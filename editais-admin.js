// ==========================================
// EDITAIS - ÁREA DO SÓCIO
// ==========================================


// ==========================================
// ELEMENTOS DA PÁGINA
// ==========================================

const imagemEdital =
    document.getElementById(
        "imagemEdital"
    );


const previewContainer =
    document.getElementById(
        "previewContainer"
    );


const previewImagem =
    document.getElementById(
        "previewImagem"
    );


const mensagemEdital =
    document.getElementById(
        "mensagemEdital"
    );


const btnSalvarEdital =
    document.getElementById(
        "btnSalvarEdital"
    );


const listaEditais =
    document.getElementById(
        "listaEditais"
    );


const btnVoltar =
    document.getElementById(
        "btnVoltar"
    );


// ==========================================
// PRÉVIA DA IMAGEM
// ==========================================

if (imagemEdital) {

    imagemEdital.addEventListener(
        "change",
        function () {

            const arquivo =
                imagemEdital.files[0];


            if (!arquivo) {

                previewContainer.style.display =
                    "none";

                previewImagem.src =
                    "";

                return;
            }


            // ==========================================
            // VERIFICAR TIPO
            // ==========================================

            const tiposPermitidos = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !tiposPermitidos.includes(
                    arquivo.type
                )
            ) {

                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ Formato não permitido.
                        Use JPG, PNG ou WEBP.
                    </span>
                `;


                imagemEdital.value =
                    "";


                previewContainer.style.display =
                    "none";


                return;
            }


            // ==========================================
            // TAMANHO MÁXIMO
            // ==========================================

            const tamanhoMaximo =
                10 * 1024 * 1024;


            if (
                arquivo.size >
                tamanhoMaximo
            ) {

                mensagemEdital.innerHTML = `
                    <span
                        style="
                            color:#ef4444;
                        "
                    >
                        ❌ A imagem deve ter
                        no máximo 10 MB.
                    </span>
                `;


                imagemEdital.value =
                    "";


                previewContainer.style.display =
                    "none";


                return;
            }


            // ==========================================
            // CRIAR PRÉVIA
            // ==========================================

            const leitor =
                new FileReader();


            leitor.onload =
                function (evento) {

                    previewImagem.src =
                        evento.target.result;


                    previewContainer.style.display =
                        "block";


                    mensagemEdital.innerHTML = `
                        <span
                            style="
                                color:#36c275;
                            "
                        >
                            ✅ Imagem selecionada.
                        </span>
                    `;
                };


            leitor.readAsDataURL(
                arquivo
            );

        }
    );
}


// ==========================================
// BOTÃO VOLTAR
// ==========================================

if (btnVoltar) {

    btnVoltar.addEventListener(
        "click",
        function () {

            window.location.href =
                "admin.html";

        }
    );
}
