import { useEffect, useState } from "react";
import styles from "./Model.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalf, faHeart, faDownload, faEdit, faTrash, faMinus } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getCSSVariable } from "../../Utils";

const apiUrl = process.env.REACT_APP_API_URL;

function Model({ _id, titulo, autor, imagen, mostrarBotonDescarga= false, mostrarBotonEditar = false, mostrarBotonBorrar = false, mostrarBotonQuitarDescarga = false, onDelete, onRemoveDownload }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Obtener cantidad actual de likes al montar
    fetch(`${apiUrl}/api/publicaciones/${_id}`)
      .then(res => res.json())
      .then(data => setLikes(data.likes || 0))
      .catch(err => console.error("Error al obtener likes:", err));
  }, [_id]);

  const renderStars = (likes) => {
    const fullStars = Math.floor(likes);
    const hasHalfStar = likes % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FontAwesomeIcon key={`full-${i}`} icon={faStar} />);
    }

    if (hasHalfStar) {
      stars.push(<FontAwesomeIcon key="half" icon={faStarHalf} />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FontAwesomeIcon key={`empty-${i}`} icon={["far", "star"]} />);
    }

    return stars;
  };

  const handleLike = (e) => {
    e.preventDefault();
    if (liked) return;

    fetch(`${apiUrl}/api/publicaciones/${_id}/like`, {
      method: "PATCH"
    })
      .then(res => res.json())
      .then(() => {
        setLikes(prev => Math.min(prev + 1, 5));
        setLiked(true);
      })
      .catch(err => console.error("Error al dar like:", err));
  };

  const handleDownload = async () => {
    try {
      const userId = sessionStorage.getItem("userId");
      if (!userId) return await Swal.fire({
        title: 'Permiso denegado',
        text: 'Inicia sesión para poder realizar descargas',
        icon: 'warning',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: {
          confirmButton: "swal-confirm-btn",
        }
      });

      const response = await fetch(`${apiUrl}/api/publicaciones/${_id}/descargar/${userId}`);

      if (!response.ok) {
          let errorMsg = "Error en la descarga";
          try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
          } catch(e) {

          }
          throw new Error(errorMsg);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
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
      await Swal.fire({
        title: 'Error',
        text: error.message || 'No se ha podido realizar la descarga',
        icon: 'error',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: {
          confirmButton: "swal-confirm-btn",
        }
      });
    }
};

  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: "¿Borrar publicación?",
        text: "¿Deseas eliminar esta publicación, con todos los archivos asociados?",
        icon: "warning",
        background: getCSSVariable("--dark-grey"),
        color: getCSSVariable("--white"),
        customClass: {
          confirmButton: "swal-confirm-btn",
          cancelButton: "swal-cancel-btn",
        },
        showCancelButton: true,
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "Cancelar",
      });
  
      if (result.isConfirmed) {  
        const response = await fetch(
          `${apiUrl}/api/publicaciones/${_id}`,
          {
            method: "DELETE",
          }
        );
  
        if (!response.ok) {
          throw new Error(`API error! status: ${response.status}`);
        }
  
        if (typeof onDelete === "function") {
          onDelete(_id);
        } else {
        }

        await Swal.fire({
          title: "Eliminada",
          text: "La publicación fue eliminada correctamente",
          icon: "success",
          background: getCSSVariable("--dark-grey"),
          color: getCSSVariable("--white"),
          customClass: {
            confirmButton: "swal-confirm-btn",
          },
        });
      } else {

      }
    } catch (err) {
      await Swal.fire({
          title: 'Error',
          text: 'No se pudo completar la eliminación.',
          icon: 'error',
          background: getCSSVariable('--dark-grey'),
          color: getCSSVariable('--white'),
          customClass: {
            confirmButton: "swal-confirm-btn",
          }
        });
    }
  };
  
  const handleRemoveDownload = async () => {
    const userId = sessionStorage.getItem("userId");

    try {
      const result = await Swal.fire({
        title: "¿Quitar de descargas?",
        text: "¿Deseas eliminar esta publicación de tu lista de descargas?",
        icon: "warning",
        background: getCSSVariable("--dark-grey"),
        color: getCSSVariable("--white"),
        customClass: {
          confirmButton: "swal-confirm-btn",
          cancelButton: "swal-cancel-btn",
        },
        showCancelButton: true,
        confirmButtonText: "Sí, quitar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {

        const response = await fetch(
          `${apiUrl}/api/users/${userId}/descargas/${_id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          let errorMsg = `API error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            
          }
          throw new Error(errorMsg);
        }

        if (typeof onRemoveDownload === "function") {
          onRemoveDownload(_id);
        } else {

        }

        await Swal.fire({
          title: "Eliminado",
          text: "La publicación fue eliminada de tus descargas",
          icon: "success",
          background: getCSSVariable("--dark-grey"),
          color: getCSSVariable("--white"),
          customClass: {
            confirmButton: "swal-confirm-btn",
          },
        });
      } else {
        ;
      }
    } catch (err) {
      await Swal.fire({
          title: 'Error',
          text: err.message || 'No se pudo quitar la publicación de tus descargas.',
          icon: 'error',
          background: getCSSVariable('--dark-grey'),
          color: getCSSVariable('--white'),
          customClass: {
            confirmButton: "swal-confirm-btn",
          }
        });
    }
  };

  return (
    <article className={styles["article-model"]}>
      {mostrarBotonDescarga && (
        <button
        className={styles["download-button"]}
        onClick={()=>handleDownload()}
        title="Descargar publicación"
        aria-label="Descargar publicación"
        >
        <FontAwesomeIcon icon={faDownload} />
      </button>

      )}

      {mostrarBotonEditar && (
        <Link
          to={`/post-form/${_id}`}
          className={styles["edit-button"]}
          title="Editar publicación"
          aria-label="Editar publicación"
        >
          <FontAwesomeIcon icon={faEdit} />
        </Link>
      )}

      {mostrarBotonBorrar && (
        <button
        className={styles["delete-button"]}
        onClick={()=>handleDelete()}
        title="Eliminar publicación"
        aria-label="Borrar publicación"
        >
        <FontAwesomeIcon icon={faTrash} />
      </button>

      )}

      {mostrarBotonQuitarDescarga && (
        <button
        className={styles["delete-button"]}
        onClick={()=>handleRemoveDownload()}
        title="Eliminar publicación de Mis descargas"
        aria-label="Eliminar publicación de Mis descargas"
        >
        <FontAwesomeIcon icon={faMinus} />
      </button>

      )}

      <Link to={`/detail/${_id}`}>
        <header className={styles["model-header"]}>
          <img
            className={styles["model-image"]}
            src={imagen || '/no-image.webp'}
            alt="Imagen del modelo"
            onError={(e) => { e.target.src = '/no-image.webp'; }}
          />
        </header>
        <footer className={styles["model-footer"]}>
          <h3>{titulo}</h3>
          <div className={styles["likes-container"]}>
            <span aria-label="Contador de likes" title="Contador de likes">{renderStars(likes)}</span>
            <button
              className={styles["like-button"]}
              disabled={liked}
              onClick={handleLike}
              title={liked ? "Ya diste me gusta" : "Dar me gusta"}
              aria-label="Botón de like"
            >
              <FontAwesomeIcon icon={faHeart} style={{ color: liked ? "red" : "gray" }} />
            </button>
          </div>
        </footer>
      </Link>
    </article>
  );
}

export default Model;
