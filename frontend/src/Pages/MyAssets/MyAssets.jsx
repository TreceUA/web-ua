import { useEffect, useState } from "react";
import { Button, ModelGrid, ProfileMenu, UpButton } from "../../Components";
import styles from "./MyAssets.module.css";
import { useAuth } from "../../Context";


const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function MyAssets() {
  const [publicaciones, setPublicaciones] = useState([]);
  const { userId } = useAuth();
  const [visibleCount, setVisibleCount] = useState(4);
  // --- Add isLoading and error states ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      cargarPublicaciones();
    } else {
       setIsLoading(false);
       setPublicaciones([]);
       setError("Usuario no identificado.");
    }
  }, [userId]);

  const cargarPublicaciones = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/publicaciones/usuario/${userId}`);
      if (!res.ok) {
           let errorMsg = res.statusText;
           try {
               const errData = await res.json();
               errorMsg = errData.message || errorMsg;
           } catch (parseError) {
           }
           throw new Error(`Error ${res.status}: ${errorMsg}`);
      }
      const data = await res.json();
      setPublicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar publicaciones:", err);
      setError(err.message || "No se pudieron cargar tus assets.");
      setPublicaciones([]); // Clear publications on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocal = (idEliminado) => {
    setPublicaciones(prev => {
      const nuevas = prev.filter(pub => pub._id !== idEliminado);
      if (nuevas.length < visibleCount && nuevas.length > 0) {
        setVisibleCount(nuevas.length);
      } else if (nuevas.length === 0) {
        setVisibleCount(4);
      }
      return nuevas;
    });
  };

  const handleMostrarMas = () => {
    setVisibleCount(prev => prev + 4);
  };

  const showMostrarMasButton = !isLoading && !error && publicaciones.length > visibleCount;

  return (
    <div className={styles["profile-main-container"]}>
      <UpButton />
      <section className={styles["left-content"]}>
        <ProfileMenu />
      </section>
      <section className={styles["right-content"]}>
        <header>
          <h1>Mis assets</h1>
        </header>

        {isLoading ? (
          <div className={styles["loading-message"]}>Cargando tus assets...</div>
        ) : error ? (
          <div className={styles["error-message"]}>{error}</div>
        ) : publicaciones.length === 0 ? (
             <div className={styles["no-results-message"]}>No has publicado ningún asset todavía.</div>
        ) : (
          <>
            <ModelGrid
              publicaciones={publicaciones.slice(0, visibleCount)}
              mostrarBotonEditar={false}
              mostrarBotonBorrar={true}
              onDelete={handleDeleteLocal}
            />
            {showMostrarMasButton && (
              <footer className={styles["model-footer"]}>
                <Button variant="red-rounded" label="Mostrar más +" onClick={handleMostrarMas} />
              </footer>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default MyAssets;