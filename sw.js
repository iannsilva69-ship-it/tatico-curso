const CACHE_NAME = "taticos-v1";

const ARQUIVOS = [
    "./",
    "./index.html",
    "./login.html",
    "./cadastro.html",
    "./aluno.html",
    "./curso.html",
    "./curso-publico.html",
    "./admin.html",
    "./cursos-admin.html",
    "./modulos-admin.html",
    "./aulas-admin.html",
    "./simulados-admin.html",
    "./style.css",
    "./supabase.js",
    "./login.js",
    "./cadastro.js",
    "./aluno.js",
    "./curso.js",
    "./curso-publico.js",
    "./admin.js",
    "./cursos-admin.js",
    "./modulos-admin.js",
    "./aulas-admin.js",
    "./simulados-admin.js",
    "./manifest.json",

    "./icons/logo-192.png",
    "./icons/logo-512.png",
    "./icons/logo-maskable-512.png",
    "./icons/apple-touch-icon.png",
    "./icons/favicon-48.png",
    "./icons/favicon-32.png",
    "./icons/favicon-16.png"
];


self.addEventListener("install", function(event) {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(function(cache) {

                return cache.addAll(ARQUIVOS);

            })

    );

    self.skipWaiting();

});


self.addEventListener("activate", function(event) {

    event.waitUntil(

        caches.keys()
            .then(function(cacheNames) {

                return Promise.all(

                    cacheNames
                        .filter(function(name) {

                            return name !== CACHE_NAME;

                        })
                        .map(function(name) {

                            return caches.delete(name);

                        })

                );

            })

    );

    self.clients.claim();

});


self.addEventListener("fetch", function(event) {

    event.respondWith(

        fetch(event.request)
            .then(function(response) {

                return response;

            })
            .catch(function() {

                return caches.match(event.request);

            })

    );

});
