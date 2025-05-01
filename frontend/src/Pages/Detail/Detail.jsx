import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Comment, ModelViewer } from '../../Components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faDownload, faHeart } from "@fortawesome/free-solid-svg-icons";
import styles from "./Detail.module.css";

function Detail() {
  const { id } = useParams();
  const [publicacion, setPublicacion] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/publicaciones/${id}`)
      .then(res => res.json())
      .then(data => {
        setPublicacion(data);
        setLikes(data.likes || 0);
      })
      .catch(err => {
        console.error("Error al obtener la publicación:", err);
        alert("Error al cargar la publicación");
      });
  }, [id]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/publicaciones/${id}/comentarios`)
      .then(res => res.json())
      .then(data => setComentarios(data))
      .catch(err => console.error("Error al obtener comentarios:", err));
  }, [id]);

  const manejarComentario = (e) => {
    e.preventDefault();
    const usuarioId = sessionStorage.getItem("userId");
    if (!usuarioId || !nuevoComentario.trim()) return;
  
    fetch("http://localhost:5000/api/comentarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId,
        publicacionId: id,
        titulo: "Comentario",
        mensaje: nuevoComentario
      })
    })
      .then(res => res.json())
      .then(data => {
        setNuevoComentario("");
        // 👇 Aquí volvemos a pedir todos los comentarios desde el backend
        fetch(`http://localhost:5000/api/publicaciones/${id}/comentarios`)
          .then(res => res.json())
          .then(data => setComentarios(data))
          .catch(err => console.error("Error al recargar comentarios:", err));
      })
      .catch(err => console.error("Error al enviar comentario:", err));
  };
  

  const handleDownload = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      if (!userId) return alert("Debes estar logueado para descargar.");
  
      const response = await fetch(`http://localhost:5000/api/publicaciones/${id}/descargar/${userId}`);
  
      if (!response.ok) {
        throw new Error("Error en la descarga");
      }
  
      // Obtener nombre sugerido del header (si el servidor lo envía)
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const fileName = fileNameMatch?.[1] || "descarga";
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error en la descarga:", error);
      alert("No se pudo descargar el archivo");
    }
  };
  

  if (!publicacion) return <p>Cargando publicación...</p>;

  return (
    <div className={styles["detail-main-container"]}>
      {/* Parte Izquierda: Visor 3D */}
      <section className={styles["detail-images"]}>
        <ModelViewer modelUrl={`http://localhost:5000/api/publicaciones/${id}/modelo`} />
      </section>

      {/* Parte Derecha: Información */}
      <section className={styles["detail-info"]}>

        <section className={styles["author-block"]}>
          <div className={styles["author"]}>
            <img
              className={styles["author-image"]}
              src={`http://localhost:5000/api/users/${publicacion.usuario?._id}/foto`}
              alt="Imagen del autor"
            />
            <h3>{publicacion.usuario?.name || "Autor desconocido"}</h3>
          </div>

          <div className={styles["buttons"]}>
          <Button
            variant="blue-rounded"
            label=" Descargar"
            icon={faDownload}
            onClick={() => handleDownload()}
          />

            <Button
              variant="green-rounded"
              label={liked ? "Ya te gusta" : " Me gusta"}
              icon={faHeart}
              disabled={liked}
              onClick={() => {
                fetch(`http://localhost:5000/api/publicaciones/${id}/like`, { method: "PATCH" })
                  .then(res => res.json())
                  .then(() => {
                    setLikes(prev => Math.min(prev + 1, 5));
                    setLiked(true);
                  })
                  .catch(err => console.error("Error al dar like:", err));
              }}
            />
          </div>

          <h2 className={styles["title"]}>{publicacion.titulo}</h2>

          <p className={styles["description"]}>
            {publicacion.descripcion}
          </p>
        </section>

        <section className={styles["details"]}>
          <h2>Detalles</h2>
          <div className={styles["span"]}>
            <p>Formato:</p>
            <p>.glb</p>
          </div>
          <div className={styles["span"]}>
            <p>Me gusta:</p>
            <div>
              {Array.from({ length: Math.min(likes, 5) }).map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles["tags"]}>
          <h2>Tags</h2>
          <div className={styles["tag-cloud"]}>
            {publicacion.categoria?.map((cat, index) => (
              <Button
                key={index}
                variant="grey-rounded"
                label={cat}
                to="/home"
              />
            ))}
          </div>
        </section>

        <section className={styles["comments"]}>
          <h2>Comentarios</h2>
          <form className={styles["comment-form"]} onSubmit={manejarComentario}>
            <textarea
              placeholder="Escribe tu comentario..."
              className={styles["comment-textarea"]}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
            />
            <Button variant="red-rounded" label="Publicar" type="submit" />
          </form>

          <div className={styles["comment-div"]}>
            {comentarios.length === 0 ? (
              <p>No hay comentarios aún.</p>
            ) : (
              comentarios.map((comentario) => (
                <Comment
                  key={comentario._id}
                  autor={comentario.usuario?.name || "Anónimo"}
                  mensaje={comentario.mensaje}
                  fecha={new Date(comentario.fecha).toLocaleString()}
                  foto={`http://localhost:5000/api/users/${comentario.usuario?._id}/foto`}
                />
              ))
            )}
          </div>
        </section>

      </section>
    </div>
  );
}

export default Detail;
