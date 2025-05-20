'use strict'

// Importar dependencias
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const express = require("express");
const logger = require("morgan");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const archiver = require("archiver");
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const mongoClient = new MongoClient(process.env.MONGO_URI);
let bucket;
let publicacionesDB;
let usersCollection;
let categoriasCollection;
let comentariosCollection;
let supportIssuesCollection;

// Configuración de CORS
const cors = require("cors");

const corsOptions = {
    origin: (origin, callback) => {
        if (
            !origin || // permite peticiones desde herramientas como Postman
            origin.includes("vercel.app") ||
            origin === "http://localhost:3000"
        ) {
            callback(null, true);
        } else {
            callback(new Error("No autorizado por CORS"));
        }
    },
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Disposition'],
};

const app = express();

// Middleware
app.use(logger("dev")); // Logs de las peticiones
app.use(cors(corsOptions)); // Permitir CORS
app.use(express.json()); // Soporte para JSON

// POST añadir usuarios
app.post("/api/users", (req, res) => {
    const { email, name, password } = req.body;

    if (!name || !password || !email) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    usersCollection.findOne({ $or: [{ email }, { name }] }).then(existingUser => {
        if (existingUser) {
            return res.status(400).json({ message: "El usuario o el email ya existen" });
        }

        // Insertar usuario con valores por defecto
        const nuevoUsuario = {
            email,
            name,
            password,
            theme: "night",
            fontSize: "medium",
            descargas: []
        };

        usersCollection.insertOne(nuevoUsuario)
            .then(result => {
                res.status(201).json({ message: "Usuario creado", user: result });
            })
            .catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
    }).catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
});

// GET todos los usuarios
app.get("/api/users", (req, res) => {
    usersCollection.find().toArray()
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
});

// GET un usuario por ID
app.get("/api/users/:id", (req, res) => {
    const { id } = req.params;

    usersCollection.findOne({ _id: new ObjectId(id) })
        .then(user => {
            if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

            // Excluir la contraseña por seguridad
            const { password, ...userWithoutPassword } = user;

            res.json(userWithoutPassword);
        })
        .catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
});

// PUT actualizar usuario
app.put("/api/users/:id", upload.single("foto"), (req, res) => {
    const { id } = req.params;
    const updateFields = {};

    // Filtrar solo los campos que vienen en el body
    const allowedFields = ["email", "name", "password", "biografia", "web", "twitter", "instagram", "theme", "fontSize"];
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateFields[field] = req.body[field];
        }
    });

    // Si hay una nueva foto
    if (req.file) {
        // Subir la foto a GridFS y obtener el archivo ID
        const file = req.file;
        const filePath = file.path;
        const readStream = fs.createReadStream(filePath);

        const uploadResult = new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(file.originalname);
            readStream.pipe(uploadStream)
                .on("error", reject)
                .on("finish", () => resolve(uploadStream));
        });

        uploadResult.then(uploadStream => {
            // Eliminar el archivo temporal
            fs.unlinkSync(filePath);

            // Actualizar el campo 'foto' del usuario con el ID del archivo en GridFS
            updateFields.foto = uploadStream.id;

            // Ahora, realizamos la actualización del usuario con la nueva foto
            usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            ).then(() => {
                res.json({ message: "Usuario actualizado" });
            }).catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
        }).catch((err) => {
            console.error("Error al subir la foto a GridFS:", err);
            res.status(500).json({ message: "Error al subir la foto", error: err });
        });
    } else {
        // Si no hay foto, solo actualizamos los campos disponibles
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No hay campos para actualizar" });
        }

        // Verificar si el nuevo email o nombre ya existen en otro usuario
        usersCollection.findOne(
            {
                $or: [{ email: updateFields.email }, { name: updateFields.name }],
                _id: { $ne: new ObjectId(id) }
            }
        ).then(existingUser => {
            if (existingUser) return res.status(400).json({ message: "El usuario o el email ya existen" });

            // Actualizar el usuario
            usersCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            ).then(() => {
                res.json({ message: "Usuario actualizado" });
            }).catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
        }).catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
    }
});


// DELETE un usuario por ID
app.delete("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // opcional: eliminar assets relacionados en GridFS y publicaciones
        await usersCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar usuario", error: err });
    }
});


// POST login
app.post("/api/login", (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: "Faltan nombre de usuario o contraseña" });
    }

    // Buscar usuario por nombre
    usersCollection.findOne({ name })
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: "El usuario no existe" });
            }

            // Comparar contraseña (sin seguridad)
            if (user.password !== password) {
                return res.status(401).json({ message: "Contraseña incorrecta" });
            }

            // excluir la contraseña de la respuesta
            const { password: _, ...userWithoutPassword } = user;

            res.status(200).json({ message: "Login exitoso", user: userWithoutPassword });
        })
        .catch(err => res.status(500).json({ message: "Error en el servidor", error: err }));
});

// GET todas las publicaciones
app.get("/api/publicaciones", async (req, res) => {
    const { query, categories, formats, types, ratings } = req.query;
    console.log("🔎 Parámetros recibidos:", req.query);

    // Crea el objeto `match` que usaremos en la agregación para filtrar los resultados
    const match = {};

    // Filtro por categorías (si existe el parámetro `categories`)
    if (categories) {
        const categoryArray = categories.split(',').map(c => c.trim()); // 👈 Limpia espacios
        console.log("💡 categoryArray:", categoryArray);
        match.categoria = { $in: categoryArray };
    }


    // Filtro por formatos (si existe el parámetro `formats`)
    if (formats) {
        const formatArray = formats.split(',');
        match.formato = { $in: formatArray };  // Suponiendo que el campo 'formato' es un array
    }

    // Filtro por tipos (si existe el parámetro `types`)
    if (types) {
        const typeArray = types.split(',');
        match.tipo = { $in: typeArray };  // Suponiendo que el campo 'tipo' es un array
    }

    // Filtro por estrellas (si existe el parámetro `ratings`)
    if (ratings) {
        match.likes = { $gte: parseInt(ratings) };
    }


    // Búsqueda de texto (si existe el parámetro `query`)
    if (query) {
        const regex = new RegExp(query, 'i'); // 'i' = insensitive (mayúsculas/minúsculas)
        match.$or = [
            { titulo: { $regex: regex } },
            { descripcion: { $regex: regex } }
        ];
    }


    try {
        // Realiza la agregación con los filtros aplicados
        const publicaciones = await publicacionesDB.aggregate([
            { $match: match },  // Aplica el filtro basado en el objeto `match`
            {
                $addFields: {
                    usuarioId: { $toObjectId: "$usuarioId" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "usuarioId",
                    foreignField: "_id",
                    as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            {
                $project: {
                    titulo: 1,
                    descripcion: 1,
                    categoria: 1,
                    archivos: 1, // Incluye el array de archivos [{ id, nombre }]
                    miniatura: 1,
                    fecha: 1,
                    likes: 1,
                    "usuario._id": 1,
                    "usuario.name": 1,
                    "usuario.email": 1
                }
            },
            { $sort: { fecha: -1 } } // Ordena por fecha (de más reciente a más antigua)
        ]).toArray();

        res.json(publicaciones);
        console.log("🔎 Respuesta:", publicaciones);

    } catch (err) {
        console.error("Error al obtener publicaciones:", err);
        res.status(500).json({ message: "Error al procesar la solicitud", error: err.message });
    }
});

// GET una publicación por ID
app.get("/api/publicaciones/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const objectId = new ObjectId(id);

        const publicacion = await publicacionesDB.aggregate([
            { $match: { _id: objectId } },
            {
                $addFields: {
                    usuarioObjectId: { $toObjectId: "$usuarioId" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "usuarioObjectId",
                    foreignField: "_id",
                    as: "usuario"
                }
            },
            {
                $unwind: {
                    path: "$usuario",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    titulo: 1,
                    descripcion: 1,
                    categoria: 1,
                    archivos: 1,
                    miniatura: 1,
                    fecha: 1,
                    likes: 1,
                    "usuario._id": 1,
                    "usuario.name": 1,
                    "usuario.email": 1,
                    "usuario.foto": 1
                }
            }
        ]).toArray();

        if (!publicacion || publicacion.length === 0) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        res.json(publicacion[0]);

    } catch (err) {
        console.error("Error al obtener la publicación:", err);
        res.status(500).json({ message: "Error al procesar la solicitud", error: err.message });
    }
});


// GET Descargas de un usuario por ID
app.get("/api/users/:id/descargas", async (req, res) => {
    const { id } = req.params;

    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user || !user.descargas) {
            return res.json([]);
        }

        const publicaciones = await publicacionesDB
            .find({ _id: { $in: user.descargas.map(d => new ObjectId(d)) } })
            .toArray();

        res.json(publicaciones);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener descargas", error: err });
    }
});

// DELETE Descarga de un usuario por ID
app.delete("/api/users/:userId/descargas/:publicationId", async (req, res) => {
    try {
        const { userId, publicationId } = req.params;

        if (!ObjectId.isValid(userId) || !ObjectId.isValid(publicationId)) {
            return res.status(400).json({ message: "ID de usuario o publicación inválido" });
        }

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { descargas: publicationId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (result.modifiedCount === 0) {
            console.log(`User ${userId} found, but publication ${publicationId} was not in their downloads list.`);
        } else {
            console.log(`Publication ${publicationId} removed from downloads for user ${userId}.`);
        }

        res.json({ message: "Publicación eliminada de tus descargas" });

    } catch (err) {
        console.error("Error al eliminar descarga del usuario:", err);
        res.status(500).json({ message: "Error interno del servidor al eliminar la descarga", error: err.message });
    }
});

// GET Descarga de una publicación por ID
app.get("/api/publicaciones/:id/descargar/:userId", async (req, res) => {
    const { id, userId } = req.params;

    try {
        const publicacion = await publicacionesDB.findOne({ _id: new ObjectId(id) });
        if (!publicacion) return res.status(404).json({ message: "Publicación no encontrada" });

        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        if (!user.descargas?.includes(id)) {
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $push: { descargas: id } }
            );
        }

        const archivos = publicacion.archivos || [];

        if (archivos.length === 1) {
            const archivoInfo = archivos[0];
            const archivoId = archivoInfo.id;

            let originalNombre = archivoInfo.nombre || `archivo_${archivoId}`;

            originalNombre = originalNombre.trim();

            let nombreLimpio = originalNombre.replace(/_+$/, '');


            const caracteresInvalidos = /[<>:"/\\|?*]/g;
            const nombreSanitizado = nombreLimpio.replace(caracteresInvalidos, '_');

            const nombreFinal = path.extname(nombreSanitizado) ? nombreSanitizado : `${nombreSanitizado}.dat`;

            // --- Descarga ---
            const downloadStream = bucket.openDownloadStream(new ObjectId(archivoId));

            res.set("Content-Disposition", `attachment; filename="${nombreFinal}"`);
            res.set("Content-Type", "application/octet-stream");

            downloadStream.on('error', (err) => {
                console.error("Error durante streaming de archivo:", err);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Error al leer el archivo desde GridFS" });
                } else {
                    res.end();
                }
            });

            return downloadStream.pipe(res);
        }

        res.set("Content-Type", "application/zip");
        res.set("Content-Disposition", `attachment; filename="publicacion_${id}.zip"`);

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.on("error", err => { throw err; });

        archive.pipe(res);

        for (const archivo of archivos) {
            const stream = bucket.openDownloadStream(new ObjectId(archivo.id));
            archive.append(stream, { name: archivo.nombre || `archivo_${archivo.id}` });
        }

        archive.finalize();

    } catch (err) {
        console.error("Error en descarga:", err);
        res.status(500).json({ message: "Error en la descarga", error: err });
    }
});

// GET Descargas de un usuario por ID
app.get("/api/users/:id/descargas", async (req, res) => {
    const { id } = req.params;

    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user || !user.descargas) {
            return res.json([]);
        }

        const publicaciones = await publicacionesDB
            .find({ _id: { $in: user.descargas.map(d => new ObjectId(d)) } })
            .toArray();

        res.json(publicaciones);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener descargas", error: err });
    }
});

// GET publicaciones de un usuario por ID
app.get("/api/publicaciones/usuario/:idUsuario", async (req, res) => {
    try {
        const idUsuario = req.params.idUsuario;

        const publicaciones = await publicacionesDB.aggregate([
            {
                $addFields: {
                    usuarioId: { $toObjectId: "$usuarioId" }
                }
            },
            {
                $match: {
                    usuarioId: new ObjectId(idUsuario)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "usuarioId",
                    foreignField: "_id",
                    as: "usuario"
                }
            },
            { $unwind: "$usuario" },
            {
                $project: {
                    titulo: 1,
                    descripcion: 1,
                    categoria: 1,
                    archivos: 1,
                    fecha: 1,
                    "usuario._id": 1,
                    "usuario.name": 1,
                    "usuario.email": 1
                }
            },
            { $sort: { fecha: -1 } }
        ]).toArray();

        res.json(publicaciones);

    } catch (err) {
        console.error("Error al obtener publicaciones:", err);
        res.status(500).json({ message: "Error al procesar la solicitud", error: err.message });
    }
});

// GET /api/publicaciones/:id/miniatura
app.get("/api/publicaciones/:id/miniatura", async (req, res) => {
    const { id } = req.params;

    try {
        // Buscar la publicación para obtener el ID de la miniatura
        const publicacion = await publicacionesDB.findOne({ _id: new ObjectId(id) });

        if (!publicacion || !publicacion.miniatura || !publicacion.miniatura.id) {
            return res.status(404).json({ message: "Miniatura no encontrada" });
        }

        const { miniatura } = publicacion;

        // Abrir un stream de lectura desde GridFS usando el ID de la miniatura
        const downloadStream = bucket.openDownloadStream(miniatura.id);

        downloadStream.on("file", (file) => {
            // Puedes mejorar esto si guardas el mime-type en la DB, por ahora lo ponemos como imagen JPEG
            res.set("Content-Type", "image/jpeg");
        });

        downloadStream.on("error", (err) => {
            console.error("Error al leer la miniatura desde GridFS:", err);
            res.status(500).json({ message: "Error al leer la miniatura" });
        });

        downloadStream.pipe(res);
    } catch (err) {
        console.error("Error al procesar la miniatura:", err);
        res.status(500).json({ message: "Error al procesar la miniatura", error: err.message });
    }
});



// POST /api/publicaciones/:idUsuario
app.post("/api/publicaciones/:idUsuario", upload.fields([
    { name: "archivo", maxCount: 10 },
    { name: "miniatura", maxCount: 1 }
]), async (req, res) => {
    try {
        const { idUsuario } = req.params;
        let { titulo, descripcion, categoria } = req.body;

        // —— NORMALIZAR CATEGORÍAS ——
        if (Array.isArray(categoria)) {
            categoria = categoria.filter(c => Boolean(c));
        } else if (typeof categoria === "string") {
            categoria = categoria.trim() ? [categoria.trim()] : [];
        } else {
            categoria = [];
        }
        if (categoria.length === 0) {
            categoria = ["Sin categoría"];
        } else {
            categoria = categoria.filter(c => c !== "Sin categoría");
        }
        // ——————————————————————

        // validación de campos obligatorios
        const archivos = req.files["archivo"] || [];
        const miniatura = req.files["miniatura"]?.[0];
        if (!titulo || !descripcion || archivos.length === 0 || !miniatura) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        // comprobar existencia de usuario
        const usuario = await usersCollection.findOne({ _id: new ObjectId(idUsuario) });
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // subir archivos
        const archivoIds = [];
        for (const file of archivos) {
            const readStream = fs.createReadStream(file.path);
            const uploadStream = bucket.openUploadStream(file.originalname);
            await new Promise((ok, ko) =>
                readStream.pipe(uploadStream)
                    .on("error", ko)
                    .on("finish", ok)
            );
            archivoIds.push({ id: uploadStream.id, nombre: file.originalname, extension: file.originalname.split('.').pop().toLowerCase() });
            fs.unlinkSync(file.path);
        }

        // ——— DETERMINAR FORMATO Y TIPO ———
        const formatos = archivos.map(file => path.extname(file.originalname).toLowerCase());
        function obtenerTipoPorExtension(ext) {
            const imagenes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
            const modelos3d = ['.blend', '.fbx', '.obj', '.glb', '.gltf', '.stl', '.3ds'];
            const videos = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
            const audios = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
            const scripts = ['.js', '.ts', '.py', '.java', '.cpp', '.cs', '.html', '.css', '.php', '.rb', '.txt', '.sh'];

            if (imagenes.includes(ext)) return "2D";
            if (modelos3d.includes(ext)) return "3D";
            if (videos.includes(ext)) return "Vídeo";
            if (audios.includes(ext)) return "Audio";
            if (scripts.includes(ext)) return "Script";
            return "Otro";
        }
        const tipos = [...new Set(formatos.map(obtenerTipoPorExtension))]; // sin duplicados


        // subir miniatura
        const miniRead = fs.createReadStream(miniatura.path);
        const miniUpload = bucket.openUploadStream(miniatura.originalname);
        await new Promise((ok, ko) =>
            miniRead.pipe(miniUpload)
                .on("error", ko)
                .on("finish", ok)
        );
        fs.unlinkSync(miniatura.path);

        // crear documento
        const nuevaPublicacion = {
            usuarioId: idUsuario,
            titulo,
            descripcion,
            categoria,
            archivos: archivoIds,
            miniatura: { id: miniUpload.id, nombre: miniatura.originalname },
            fecha: new Date(),
            formato: [...new Set(formatos)],
            tipo: tipos
        };
        const insertResult = await publicacionesDB.insertOne(nuevaPublicacion);

        res.status(201).json({
            message: "Publicación creada",
            publicacion: { _id: insertResult.insertedId, ...nuevaPublicacion }
        });
    } catch (err) {
        console.error("Error en publicación:", err);
        res.status(500).json({ message: "Error al procesar la publicación", error: err.message });
    }
});


// PUT /api/publicaciones/:id
app.put("/api/publicaciones/:id", upload.fields([
    { name: "archivo", maxCount: 10 },
    { name: "miniatura", maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        let { titulo, descripcion, categoria } = req.body;

        // —— NORMALIZAR CATEGORÍAS ——
        if (Array.isArray(categoria)) {
            categoria = categoria.filter(c => Boolean(c));
        } else if (typeof categoria === "string") {
            categoria = categoria.trim() ? [categoria.trim()] : [];
        } else {
            categoria = [];
        }
        if (categoria.length === 0) {
            categoria = ["Sin categoría"];
        } else {
            categoria = categoria.filter(c => c !== "Sin categoría");
        }
        // ——————————————————————

        // obtener publicación existente
        const publicacion = await publicacionesDB.findOne({ _id: new ObjectId(id) });
        if (!publicacion) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        // preparar campos a actualizar
        const updateFields = {};
        if (titulo) updateFields.titulo = titulo;
        if (descripcion) updateFields.descripcion = descripcion;
        updateFields.categoria = categoria;

        // manejar nuevos archivos (si los hay)
        const archivos = req.files["archivo"] || [];
        if (archivos.length > 0) {
            const nuevosArchivos = [];
            for (const file of archivos) {
                const readStream = fs.createReadStream(file.path);
                const uploadStream = bucket.openUploadStream(file.originalname);
                await new Promise((ok, ko) =>
                    readStream.pipe(uploadStream)
                        .on("error", ko)
                        .on("finish", ok)
                );
                nuevosArchivos.push({ id: uploadStream.id, nombre: file.originalname });
                fs.unlinkSync(file.path);
            }
            updateFields.archivos = nuevosArchivos;
        }

        // manejar nueva miniatura (si se ha enviado)
        const miniatura = req.files["miniatura"]?.[0];
        if (miniatura) {
            const miniRead = fs.createReadStream(miniatura.path);
            const miniUpload = bucket.openUploadStream(miniatura.originalname);
            await new Promise((ok, ko) =>
                miniRead.pipe(miniUpload)
                    .on("error", ko)
                    .on("finish", ok)
            );
            fs.unlinkSync(miniatura.path);
            updateFields.miniatura = { id: miniUpload.id, nombre: miniatura.originalname };
        }

        // ejecutar actualización
        await publicacionesDB.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        res.json({ message: "Publicación actualizada correctamente" });
    } catch (err) {
        console.error("Error al actualizar publicación:", err);
        res.status(500).json({ message: "Error al actualizar publicación", error: err.message });
    }
});

// GET likes de una publicación por ID
app.get("/api/publicaciones/:id/likes", async (req, res) => {
    const { id } = req.params;

    try {
        const publicacion = await publicacionesDB.findOne(
            { _id: new ObjectId(id) },
            { projection: { likes: 1 } }
        );

        if (!publicacion) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        res.json({ likes: publicacion.likes || 0 });
    } catch (err) {
        console.error("Error al obtener likes:", err);
        res.status(500).json({ message: "Error al obtener likes", error: err.message });
    }
});

// Devuelve el archivo en crudo desde GridFS por ID
app.get("/api/publicaciones/:archivoId/archivo", async (req, res) => {
    try {
        const archivoId = new ObjectId(req.params.archivoId);
        const downloadStream = bucket.openDownloadStream(archivoId);

        // Si no existe, devolver 404
        downloadStream.on("error", () => {
            res.status(404).json({ message: "Archivo no encontrado" });
        });

        downloadStream.pipe(res);
    } catch (err) {
        console.error("❌ Error al obtener archivo:", err);
        res.status(500).json({ message: "Error al recuperar el archivo", error: err.message });
    }
});

// Agrega un "me gusta" a una publicación
app.patch("/api/publicaciones/:id/like", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await publicacionesDB.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { likes: 1 } } // Incrementa el campo "likes"
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Publicación no encontrada o sin cambios" });
        }

        res.json({ message: "Me gusta añadido correctamente" });
    } catch (err) {
        console.error("Error al dar like:", err);
        res.status(500).json({ message: "Error al procesar el like", error: err.message });
    }
});

// GET foto de un usuario por ID
app.get("/api/users/:id/foto", async (req, res) => {
    const { id } = req.params;

    try {
        // Buscar el usuario para obtener el ID del archivo
        usersCollection.findOne({ _id: new ObjectId(id) })
            .then(user => {
                if (!user || !user.foto) {
                    return res.status(404).json({ message: "Imagen no encontrada" });
                }

                // Abrir un stream de lectura desde GridFS
                const downloadStream = bucket.openDownloadStream(user.foto);

                res.set("Content-Type", "image/jpeg"); // Ajusta el tipo si sabes el formato real
                downloadStream.pipe(res).on("error", (err) => {
                    console.error("Error al leer la imagen desde GridFS:", err);
                    res.status(500).json({ message: "Error al leer la imagen" });
                });
            })
            .catch(err => res.status(500).json({ message: "Error al procesar la imagen", error: err }));
    } catch (err) {
        res.status(500).json({ message: "Error al procesar la imagen", error: err });
    }
});

// POST de una nueva categoría
app.post("/api/categorias", upload.single("foto"), async (req, res) => {
    const { nombre } = req.body;
    const foto = req.file;

    if (!nombre) {
        return res.status(400).json({ message: "El nombre de la categoría es obligatorio" });
    }

    try {
        // Verificar si ya existe la categoría
        const categoriaExistente = await categoriasCollection.findOne({
            nombre: { $regex: `^${nombre}$`, $options: "i" }
        });

        if (categoriaExistente) {
            return res.status(400).json({ message: "La categoría ya existe" });
        }

        let fotoId = null;

        // Si se ha subido una foto, guardarla en GridFS
        if (foto) {
            const readStream = fs.createReadStream(foto.path);
            const uploadStream = bucket.openUploadStream(foto.originalname, {
                contentType: foto.mimetype
            });

            readStream.pipe(uploadStream);

            await new Promise((resolve, reject) => {
                uploadStream.on("finish", () => {
                    fotoId = uploadStream.id;
                    fs.unlinkSync(foto.path); // elimina el archivo temporal
                    resolve();
                });
                uploadStream.on("error", reject);
            });
        }

        // Guardar categoría
        const nuevaCategoria = {
            nombre,
            fotoId // puede ser null si no hay imagen
        };

        const resultado = await categoriasCollection.insertOne(nuevaCategoria);

        res.status(201).json({
            message: "Categoría creada",
            categoria: { _id: resultado.insertedId, ...nuevaCategoria }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear la categoría", error: err.message });
    }
});


// GET todas las categorías
app.get("/api/categorias", async (req, res) => {
    try {
        const categorias = await categoriasCollection.find().toArray();
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener categorías", error: err });
    }
});

// GET una foto de categoría por ID
app.get("/api/categorias/foto/:id", async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const downloadStream = bucket.openDownloadStream(id);

        downloadStream.on("error", () => {
            res.status(404).json({ message: "Imagen no encontrada" });
        });

        res.set("Content-Type", "image/jpeg"); // o usa el tipo que corresponda
        downloadStream.pipe(res);
    } catch (err) {
        res.status(500).json({ message: "Error al recuperar la imagen", error: err.message });
    }
});

// POST de un nuevo comentario
app.post("/api/comentarios", async (req, res) => {
    const { usuarioId, publicacionId, titulo, mensaje } = req.body;

    if (!usuarioId || !publicacionId || !titulo || !mensaje) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    try {
        // Verificar que el usuario existe
        const usuario = await usersCollection.findOne({ _id: new ObjectId(usuarioId) });
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Verificar que la publicación existe
        const publicacion = await publicacionesDB.findOne({ _id: new ObjectId(publicacionId) });
        if (!publicacion) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        // Crear el comentario
        const nuevoComentario = {
            usuarioId: new ObjectId(usuarioId),
            publicacionId: new ObjectId(publicacionId),
            titulo,
            mensaje,
            fecha: new Date()
        };

        const resultado = await comentariosCollection.insertOne(nuevoComentario);

        res.status(201).json({
            message: "Comentario creado",
            comentario: {
                _id: resultado.insertedId,
                ...nuevoComentario
            }
        });
    } catch (err) {
        console.error("Error al crear comentario:", err);
        res.status(500).json({ message: "Error al crear comentario", error: err.message });
    }
});

// GET comentarios de una publicación por ID
app.get("/api/publicaciones/:id/comentarios", async (req, res) => {
    const { id } = req.params;

    try {
        const comentarios = await comentariosCollection
            .find({ publicacionId: new ObjectId(id) })
            .sort({ fecha: -1 })
            .toArray();

        // Opcional: incluir datos del usuario
        const comentariosConUsuario = await Promise.all(
            comentarios.map(async (comentario) => {
                const usuario = await usersCollection.findOne(
                    { _id: comentario.usuarioId },
                    { projection: { name: 1, foto: 1 } }
                );
                return { ...comentario, usuario };
            })
        );

        res.json(comentariosConUsuario);
    } catch (err) {
        console.error("Error al obtener comentarios:", err);
        res.status(500).json({ message: "Error al obtener comentarios" });
    }
});

// GET modelo 3D de una publicación por ID
app.get("/api/publicaciones/:id/modelo", async (req, res) => {
    const { id } = req.params;

    try {
        // Buscar la publicación
        const publicacion = await publicacionesDB.findOne({ _id: new ObjectId(id) });

        if (!publicacion || !publicacion.archivos || !publicacion.archivos.some(file => file.nombre.endsWith('.glb'))) {
            return res.status(404).json({ message: "Modelo no encontrado" });
        }

        // Buscar el archivo .glb relacionado
        const archivo = publicacion.archivos.find(file => file.nombre.endsWith(".glb"));

        // Buscar en GridFS por filename
        const files = await bucket.find({ filename: archivo.nombre }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: "Archivo no encontrado en GridFS" });
        }

        // Establecer el tipo de contenido correcto
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `inline; filename="${archivo.nombre}"`);

        // Stream desde GridFS
        const downloadStream = bucket.openDownloadStreamByName(archivo.nombre);
        downloadStream.pipe(res).on("error", (err) => {
            console.error("Error al leer el archivo desde GridFS:", err);
            res.status(500).json({ message: "Error al leer el archivo" });
        });

    } catch (error) {
        console.error("Error al obtener el modelo 3D:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// DELETE publicaciones
app.delete("/api/publicaciones", async (req, res) => {
    try {
        const result = await publicacionesDB.deleteMany({});
        res.json({ message: "Todas las publicaciones eliminadas", deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Error al eliminar publicaciones:", error);
        res.status(500).json({ message: "Error al eliminar publicaciones" });
    }
});

// Delete publicación por ID
app.delete("/api/publicaciones/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await publicacionesDB.deleteOne({ _id: new ObjectId(id) });
        res.json({ message: `Publicación con el ID: ${id} eliminada` });
    } catch {
        console.error(`Error al eliminar la publicación con el ID: ${id}`)
        res.status(500).json({ message: `Error al eliminar la publicación con el ID: ${id}}` });
    }
});

// POST de un nuevo reporte de soporte
app.post("/api/support/issues", upload.single("attachment"), async (req, res) => {
    try {
        const { issueType, description /*, userId */ } = req.body;

        const errors = {};
        if (!issueType || typeof issueType !== 'string' || issueType.trim() === '') {
            errors.issueType = "Tipo de problema requerido.";
        }
        if (!description || typeof description !== 'string' || description.trim() === '') {
            errors.description = "Descripción requerida.";
        } else if (description.trim().length < 10) {
            errors.description = "La descripción debe tener al menos 10 caracteres.";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ message: "Faltan campos requeridos o son inválidos.", errors });
        }

        const issueData = {
            issueType: issueType.trim(),
            description: description.trim(),
            submittedAt: new Date(),
            status: 'new',
            attachment: null,
        };

        if (req.file) {
            console.log(`Procesando archivo adjunto: ${req.file.originalname} (${req.file.mimetype})`);

            const uploadStream = bucket.openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype,
            });

            uploadStream.end(req.file.buffer);

            await new Promise((resolve, reject) => {
                uploadStream.on('finish', resolve);
                uploadStream.on('error', (err) => {
                    console.error("Error subiendo archivo a GridFS:", err);
                    reject(new Error("Error al guardar el archivo adjunto."));
                });
            });

            console.log(`Archivo ${req.file.originalname} guardado en GridFS con ID: ${uploadStream.id}`);

            issueData.attachment = {
                fileId: uploadStream.id,
                filename: req.file.originalname,
                contentType: req.file.mimetype,
                size: req.file.size
            };
        }

        const result = await supportIssuesCollection.insertOne(issueData);

        console.log("Nuevo reporte de soporte guardado, ID:", result.insertedId);

        const newIssue = await supportIssuesCollection.findOne({ _id: result.insertedId });

        res.status(201).json({ message: "Reporte enviado con éxito.", issue: newIssue });

    } catch (error) {
        console.error("Error en POST /api/support/issues:", error);
        if (error.message === "Error al guardar el archivo adjunto.") {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Error interno del servidor al procesar el reporte." });
        }
    }
});

// GET de todos los reportes de soporte
app.get("/api/support/issues", async (req, res) => {
    try {
        const issues = await supportIssuesCollection.find()
            .sort({ submittedAt: -1 })
            .toArray();

        res.status(200).json(issues);

    } catch (error) {
        console.error("Error en GET /api/support/issues:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener los reportes." });
    }
});

// GET de un reporte de soporte por ID
app.get("/api/support/issues/attachment/:fileId", async (req, res) => {
    try {
        const fileId = new ObjectId(req.params.fileId);

        const fileMeta = await mongoClient.db("miBaseDeDatos").collection('archivos.files').findOne({ _id: fileId });

        if (!fileMeta) {
            return res.status(404).json({ message: "Archivo adjunto no encontrado." });
        }

        res.set("Content-Type", fileMeta.contentType || "application/octet-stream");
        res.set("Content-Disposition", `attachment; filename="${fileMeta.filename}"`);

        const downloadStream = bucket.openDownloadStream(fileId);

        downloadStream.on('error', (err) => {
            console.error("Error al descargar archivo adjunto:", err);
            if (!res.headersSent) {
                res.status(500).json({ message: "Error al leer el archivo adjunto." });
            }
        });
        downloadStream.pipe(res);

    } catch (error) {
        console.error("Error en GET /api/support/issues/attachment/:fileId:", error);
        if (error.name === 'BSONTypeError') {
            return res.status(400).json({ message: "ID de archivo inválido." });
        }
        res.status(500).json({ message: "Error interno del servidor al descargar el adjunto." });
    }
});


// Conectar a MongoDB y crear el bucket de GridFS
mongoClient.connect().then(client => {
    const database = client.db("miBaseDeDatos");
    bucket = new GridFSBucket(database, { bucketName: "archivos" });
    publicacionesDB = database.collection("publicaciones");
    usersCollection = database.collection("users");
    categoriasCollection = database.collection("categorias");
    comentariosCollection = database.collection("comentarios");
    supportIssuesCollection = database.collection("supportIssues");

    app.listen(PORT, () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
    });
}).catch(console.error);
