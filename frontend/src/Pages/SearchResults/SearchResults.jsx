import { useState, useEffect } from "react"; 
import { Button, ModelGrid, Category, UpButton } from '../../Components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceFrown } from "@fortawesome/free-solid-svg-icons";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import styles from "./SearchResults.module.css";
import Marquee from "react-fast-marquee";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function SearchResults() {
    const [categories, setCategories] = useState([]);
    const [publicaciones, setPublicaciones] = useState([]);
    const [visibleCount, setVisibleCount] = useState(4);
    const [sliderPublicaciones, setsliderPublicaciones] = useState([]);

    const handleMostrarMas = () => {
        setVisibleCount(prev => prev + 4);
    };
        
    // BUSQUEDA
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query') || '';
    const selectedCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
    const selectedFormats = searchParams.get('formats') ? searchParams.get('formats').split(',') : [];
    const selectedTypes = searchParams.get('types') ? searchParams.get('types').split(',') : [];
    const selectedStars = searchParams.get('ratings') || '';

    const navigate = useNavigate();

    const removeFilter = (filterType) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete(filterType);
        navigate({ pathname: '/buscar', search: `?${newSearchParams.toString()}` });
    };
    

    const handleTypeClick = (filterType) => {
        const currentParams = new URLSearchParams(window.location.search);
        const existingFilters = currentParams.get('types') ? currentParams.get('types').split(',') : [];

        if (!existingFilters.includes(filterType)) {
            existingFilters.push(filterType);
        } else {
            // Si el tipo ya está en los filtros, lo eliminamos
            existingFilters.splice(existingFilters.indexOf(filterType), 1);
        }

        currentParams.set('types', existingFilters.join(','));
        navigate(`/buscar?${currentParams.toString()}`);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/categorias`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    },
                });
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error al traer las categorías:', error);
            }
        };
    
        fetchCategories();
    }, []);  // Usamos un array vacío para que esto solo se ejecute una vez
    
    useEffect(() => {
        const fetchSearchResults = async () => {
            const params = new URLSearchParams();
            if (query) params.append("query", query);
            if (selectedCategories.length > 0) params.append("categories", selectedCategories.join(','));
            if (selectedFormats.length > 0) params.append("formats", selectedFormats.join(','));
            if (selectedTypes.length > 0) params.append("types", selectedTypes.join(','));
            if (selectedStars) params.append("ratings", selectedStars);
     
            try {
                const response = await fetch(`${apiUrl}/api/publicaciones?${params.toString()}`);
                const data = await response.json();
                setPublicaciones(data);
            } catch (error) {
                console.error("Error al obtener publicaciones:", error);
            }            
        };
        fetchSearchResults();
    }, [searchParams]);
    
    useEffect(() => {
        fetch(`${apiUrl}/api/publicaciones`)
            .then(response => response.json())
            .then(data => setsliderPublicaciones(data))
            .catch(error => console.error('Error al traer las publicaciones:', error));
    }, []);
    
    return (
        <div className={styles["searchResults-main-container"]}>
            <UpButton />

            <section className={styles["home-welcome"]}>
                <div>
                    <img alt="logo" src="/logo.png" />
                </div>
                <div>
                    <p>Encuentra gran variedad de assets  <br></br> por tipo, categoría o valoración</p>
                </div>
            </section>

            <section className={styles["type-section"]}>
                <Link 
                    to={`/buscar?types=3D${selectedCategories.length > 0 ? '&categories=' + selectedCategories.join(',') : ''}${selectedFormats.length > 0 ? '&formats=' + selectedFormats.join(',') : ''}${selectedStars ? '&ratings=' + selectedStars : ''}`}
                >
                    <Button variant="red-rounded" label="3D" />
                </Link>
                <Link 
                    to={`/buscar?types=2D${selectedCategories.length > 0 ? '&categories=' + selectedCategories.join(',') : ''}${selectedFormats.length > 0 ? '&formats=' + selectedFormats.join(',') : ''}${selectedStars ? '&ratings=' + selectedStars : ''}`}
                >
                    <Button variant="red-rounded" label="2D" />
                </Link>
                <Link 
                    to={`/buscar?types=Vídeo${selectedCategories.length > 0 ? '&categories=' + selectedCategories.join(',') : ''}${selectedFormats.length > 0 ? '&formats=' + selectedFormats.join(',') : ''}${selectedStars ? '&ratings=' + selectedStars : ''}`}
                >
                    <Button variant="red-rounded" label="Vídeo" />
                </Link>
                <Link 
                    to={`/buscar?types=Audio${selectedCategories.length > 0 ? '&categories=' + selectedCategories.join(',') : ''}${selectedFormats.length > 0 ? '&formats=' + selectedFormats.join(',') : ''}${selectedStars ? '&ratings=' + selectedStars : ''}`}
                >
                    <Button variant="red-rounded" label="Audio" />
                </Link>
                <Link 
                    to={`/buscar?types=Script${selectedCategories.length > 0 ? '&categories=' + selectedCategories.join(',') : ''}${selectedFormats.length > 0 ? '&formats=' + selectedFormats.join(',') : ''}${selectedStars ? '&ratings=' + selectedStars : ''}`}
                >
                    <Button variant="red-rounded" label="Script" />
                </Link>
            </section>

            <section className={styles["filter-section"]}>
                <h3>Filtros activos:</h3>
                <div className={styles.filterTags}>
                    {query && (
                        <div className={styles.filterTag}>
                            <span>Buscando: <strong>{query}</strong></span>
                            <button
                                className={styles.clearFilter}
                                onClick={() => removeFilter('query')}
                                aria-label="Eliminar filtro de búsqueda"
                            >
                                ✖
                            </button>
                        </div>
                    )}
                    {selectedCategories.length > 0 && (
                        <div className={styles.filterTag}>
                            <span>Categorías: {selectedCategories.map(c => (
                                <strong key={c}> {c} </strong>))}
                            </span>
                            <button
                                className={styles.clearFilter}
                                onClick={() => removeFilter('categories')}
                                aria-label="Eliminar filtro de categorías"
                            >
                                ✖
                            </button>
                        </div>
                    )}
                    {selectedFormats.length > 0 && (
                        <div className={styles.filterTag}>
                            <span>Formatos: {selectedFormats.map(f => (
                                <strong key={f}> {f} </strong>))}
                            </span>
                            <button
                                className={styles.clearFilter}
                                onClick={() => removeFilter('formats')}
                                aria-label="Eliminar filtro de formatos"
                            >
                                ✖
                            </button>
                        </div>
                    )}
                    {selectedTypes.length > 0 && (
                        <div className={styles.filterTag}>
                            <span>Tipos: {selectedTypes.map(t => (
                                <strong key={t}> {t} </strong>))}
                            </span>
                            <button
                                className={styles.clearFilter}
                                onClick={() => removeFilter('types')}
                                aria-label="Eliminar filtro de tipos"
                            >
                                ✖
                            </button>
                        </div>
                    )}
                    {selectedStars && (
                        <div className={styles.filterTag}>
                            <span>Valoración mínima: <strong>{selectedStars} estrellas</strong></span>
                            <button
                                className={styles.clearFilter}
                                onClick={() => removeFilter('ratings')}
                                aria-label="Eliminar filtro de valoraciones"
                            >
                                ✖
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section className={styles["product-section"]}>
                <header className={styles["product-header"]}>
                    <h2>Resultados obtenidos</h2>
                </header>
                {publicaciones.length > 0 ? (
                    <>
                        <ModelGrid publicaciones={publicaciones.slice(0, visibleCount)} />
                        <footer className={styles["model-footer"]}>
                            <Button variant="red-rounded" label="Mostrar más +" onClick={handleMostrarMas} />
                        </footer>
                    </>
                ) : (
    
                    <div className={styles["no-results-wrapper"]}>
                        <FontAwesomeIcon icon={faFaceFrown} size="3x" />
                        <p>No se encontraron resultados.</p>
                    </div>

                )}
            </section>
            {sliderPublicaciones.length > 0 && (
                <Marquee
                    gradient={false}
                    speed={40}
                    pauseOnHover={true}
                    direction="left"

                    className={styles.marquee}
                >
                    {[...sliderPublicaciones, ...sliderPublicaciones].map((pub, i) => (
                        <img
                            key={i}
                            src={`${apiUrl}/api/publicaciones/${pub._id}/miniatura`} 
                            alt={`preview ${i}`}
                            style={{
                                height: "100px",
                                marginRight: "30px",
                                borderRadius: "10px"
                            }}
                        />
                    ))}
                </Marquee>
            )}

        </div>
    );
}

export default SearchResults;
