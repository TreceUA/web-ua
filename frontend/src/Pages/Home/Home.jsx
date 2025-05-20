import { Button, ModelGrid, Category, UpButton } from '../../Components';
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate  } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { getCSSVariable } from '../../Utils';
import Swal from 'sweetalert2';
import styles from "./Home.module.css";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function Home() {
    const [categories, setCategories] = useState([]);
    const [publicaciones, setPublicaciones] = useState([]);
    const [visibleCount, setVisibleCount] = useState(4);
    const location = useLocation();
    const navigate = useNavigate();
    const alertProcessedRef = useRef(false);

    const handleMostrarMas = () => {
        setVisibleCount(prev => prev + 4);
    };

    useEffect(() => {
        fetch(`${apiUrl}/api/categorias`)
            .then(response => response.json())
            .then(data => setCategories(data))
            .catch(error => console.error('Error al traer las categorías:', error));
    }, []);

    useEffect(() => {
        fetch(`${apiUrl}/api/publicaciones`)
            .then(response => response.json())
            .then(data => setPublicaciones(data))
            .catch(error => console.error('Error al traer las publicaciones:', error));
    }, []);

    useEffect(() => {
        if (location.state?.needsAuthAlert && !alertProcessedRef.current) {
          const intendedPath = location.state.from || 'la página anterior';

          alertProcessedRef.current = true;
    
          navigate('.', { state: null, replace: true });    
    
          const showAlert = async () => {
              try {
                  const result = await Swal.fire({
                      title: 'Acceso Restringido',
                      text: `Necesitas iniciar sesión para acceder a "${intendedPath}".`,
                      icon: 'warning',
                      background: getCSSVariable('--dark-grey') || '#333333',
                      color: getCSSVariable('--white') || '#ffffff',
                      customClass: {
                          confirmButton: "swal-confirm-btn",
                          cancelButton: "swal-cancel-btn",
                      },
                      showCancelButton: true,
                      confirmButtonText: 'Iniciar Sesión', 
                      cancelButtonText: 'Entendido',
                      allowOutsideClick: false,
                      allowEscapeKey: false,
                  });
    
                  if (result.isConfirmed) {
                      navigate('/login');
                  }
    
              } catch (error) {
                  console.error("SweetAlert error:", error);
              }
          };
    
           showAlert();
    
    
        } else if (!location.state?.needsAuthAlert) {
            alertProcessedRef.current = false;
        }
      }, [location, navigate]);
    
    return (
        <div className={styles["home-main-container"]}>
           
            <UpButton />
            
            <section className={styles["home-welcome"]}>
                <div>
                    <img alt="logo" src="/logo.png" />
                </div>
                <div>
                    <p>¡Bienvenido!</p>
                    <p>Descubre, organiza y comparte<br></br>los assets que impulsan tus proyectos</p>
                </div>
            </section>
            
            <section className={styles["type-section"]}>
                <Link to="/buscar?types=3D">
                    <Button variant="red-rounded" label="3D" />
                </Link>
                <Link to="/buscar?types=2D">
                    <Button variant="red-rounded" label="2D" />
                </Link>
                <Link to="/buscar?types=Vídeo">
                    <Button variant="red-rounded" label="Vídeo" />
                </Link>
                <Link to="/buscar?types=Audio">
                    <Button variant="red-rounded" label="Audio" />
                </Link>
                <Link to="/buscar?types=Script">
                    <Button variant="red-rounded" label="Script" />
                </Link>
            </section>

            <section className={styles["category-section"]}>
                <header className={styles["category-header"]}>
                    <h2>Categorías</h2>
                    {/* <div className={styles["category-arrows"]}>
                        <button className={styles["circle-button"]}>
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <button className={styles["circle-button"]}>
                            <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                    </div> */}
                </header>
                <div className={styles["categories"]}>
                    {categories.map((category) => (
                        <Category key={category._id} id={category._id} nombre={category.nombre} fotoURL={`${apiUrl}/api/categorias/foto/${category.fotoId}`} />
                    ))}
                </div>
                {/* <footer className={styles["category-footer"]}>
                    <span>
                        <FontAwesomeIcon icon={faCircle} />
                        <FontAwesomeIcon icon={faCircle} />
                        <FontAwesomeIcon icon={faCircle} />
                    </span>
                </footer> */}
            </section>

            <section className={styles["product-section"]}>
                <header className={styles["product-header"]}>
                    <h2>Todas las publicaciones</h2>
                </header>
                <ModelGrid publicaciones={publicaciones.slice(0, visibleCount)} />
                <footer className={styles["model-footer"]}>
                    <Button variant="red-rounded" label="Mostrar más +" onClick={handleMostrarMas} />
                </footer>
            </section>
            <Marquee
                gradient={false}  // Desactiva el gradiente
                speed={40}  // Ajusta la velocidad de desplazamiento
                pauseOnHover={true}  // Pausa el desplazamiento cuando el ratón está encima
                direction="left"  // Dirección de izquierda a derecha
                loop={0}  // Hace que el Marquee repita de forma indefinida
                className={styles.marquee}
            >
               {/* Duplicamos las imágenes para lograr el ciclo continuo */}
               {[...publicaciones, ...publicaciones].map((pub, i) => (
                    <img
                        key={i}
                        src={`${apiUrl}/api/publicaciones/${pub._id}/miniatura`} 
                        onError={(e) => { e.target.src = '/no-image.webp'; }}
                        alt={`preview ${i}`}
                        style={{
                            height: "100px",
                            marginRight: "30px",
                            borderRadius: "10px"
                        }}
                    />
                ))}
            </Marquee>

        </div>

    );
}

export default Home;
