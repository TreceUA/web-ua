import { useEffect, useState } from "react";
import { Button, ModelGrid, ProfileMenu, UpButton } from '../../Components';
import styles from "./MyDownloads.module.css";
import { useAuth } from "../../Context";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function MyDownloads() {
  const [descargas, setDescargas] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useAuth();

  const handleMostrarMas = () => {
    setVisibleCount(prev => prev + 4);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (!userId) {
      setError("No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      setDescargas([]);
      return;
    }

    fetch(`${apiUrl}/api/users/${userId}/descargas`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errData => {
            throw new Error(errData.message || `Error ${response.status}: Error al obtener descargas`);
          }).catch(() => {
            throw new Error(`Error ${response.status}: Error al obtener descargas`);
          });
        }
        return response.json();
      })
      .then(data => {
        setDescargas(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(error => {
        setError(error.message || "Ocurrió un error al cargar tus descargas.");
        setIsLoading(false);
        setDescargas([]);
      });
  }, [userId]);

  const handleRemoveDownloadFromState = (publicationIdToRemove) => {
    setDescargas(currentDescargas => {
      const nuevasDescargas = currentDescargas.filter(pub => pub._id !== publicationIdToRemove);
      if (nuevasDescargas.length < visibleCount && nuevasDescargas.length > 0) {
          setVisibleCount(nuevasDescargas.length);
      } else if (nuevasDescargas.length === 0) {
          setVisibleCount(4);
      }
      return nuevasDescargas;
    });
  };

  const showMostrarMasButton = !isLoading && !error && descargas.length > visibleCount;

  return (
    <div className={styles["profile-main-container"]}>
      <UpButton />
      <section className={styles["left-content"]}>
        <ProfileMenu />
      </section>

      <section className={styles["right-content"]}>
        <header>
          <h1>Mis descargas</h1>
        </header>

        {isLoading ? (
          <div className={styles["loading-message"]}>Cargando tus descargas...</div>
        ) : error ? (
          <div className={styles["error-message"]}>{error}</div>
        ) : descargas.length === 0 ? (
            <div className={styles["no-results-message"]}>No tienes ninguna descarga guardada.</div>
        ) : (
          <>
            <ModelGrid
              publicaciones={descargas.slice(0, visibleCount)}
              mostrarBotonDescarga={true}
              mostrarBotonQuitarDescarga={true}
              onRemoveDownload={handleRemoveDownloadFromState}
              mostrarBotonEditar={false}
              mostrarBotonBorrar={false}
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

export default MyDownloads;