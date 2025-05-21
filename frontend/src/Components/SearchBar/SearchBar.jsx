import styles from "./SearchBar.module.css";
import { Button, InputField, DeleteableTag } from '../../Components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faFilter, faStar } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

export default function SearchBar() {

  const [showFilters, setShowFilters] = useState(false);
  const [arrOptions, setArrOptions] = useState([]);
  

  const navigate = useNavigate();  //Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);

  const [searchParams] = useSearchParams(); // Leer los parámetros de búsqueda de la URL



  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/categorias`); // Reemplaza si tu endpoint es otro
      const data = await response.json();
  
      if (data && Array.isArray(data)) {
        setArrOptions(data.map(category => ({
          label: category.nombre,  // Esto depende de cómo venga tu objeto de categoría
          value: category.id       // El ID de la categoría
        })));
      }
    } catch (error) {
      console.error('Error al obtener las categorías:', error);
    }
  }

  useEffect(() => {
    const query = searchParams.get('query') || '';
    const categories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
    const formats = searchParams.get('formats') ? searchParams.get('formats').split(',') : [];
    const types = searchParams.get('types') ? searchParams.get('types').split(',') : [];
    const ratings = searchParams.get('ratings') ? searchParams.get('ratings').split(',') : [];

    setSearchQuery(query);
    setSelectedTags(categories);
    setSelectedFormats(formats);
    setSelectedAssetTypes(types);
    setSelectedRatings(ratings);
  }, [searchParams]);

  const addTag = (e) => {
    const newTag = e.target.value;
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prevTags => [...prevTags, newTag]);
    }
  };

  const deleteTag = (tagToDelete) => {
    setSelectedTags(prevTags => prevTags.filter(tag => tag !== tagToDelete));
  };

  const handleFormatChange = (e) => {
    const value = e.target.value;
    setSelectedFormats(prev =>
      e.target.checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };
  
  const handleAssetTypeChange = (e) => {
    const value = e.target.value;
    setSelectedAssetTypes(prev =>
      e.target.checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };
  
  const handleRatingChange = (e) => {
    const value = e.target.value;
    setSelectedRatings(prev =>
      e.target.checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };
  

  // Búsquedas
  const handleApplyFilters = (e) => {
    e.preventDefault();
  
    const params = new URLSearchParams();

    // Texto de búsqueda
    if (searchQuery.trim() !== '') {
      params.append('query', searchQuery.trim());
    }

    // Categorías
    if (selectedTags.length > 0) {
      params.append('categories', selectedTags.join(','));
    }
  
    // Formatos
    if (selectedFormats.length > 0) {
      params.append('formats', selectedFormats.join(','));
    }
  
    // Tipo de asset
    if (selectedAssetTypes.length > 0) {
      params.append('types', selectedAssetTypes.join(','));
    }
  
    // Puntuaciones
    if (selectedRatings.length > 0) {
      params.append('ratings', selectedRatings.join(','));
    }
  
    navigate(`/buscar?${params.toString()}`);
  };
  
  

  useEffect(() => {
    fetchCategories();
  }, []); 

    return (
      <div className={styles.searchBarWrapper}>
        <form onSubmit={handleApplyFilters}>

          <div className={styles.searchBar}>
            <div>
              <button aria-label="Confirmar búsqueda" title="Aplicar búsqueda" role="submit">
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className={styles.filter} onClick={() => setShowFilters(!showFilters)} aria-label="Filtro de búsqueda" title="Filtros de búsqueda">
              <FontAwesomeIcon icon={faFilter} />
            </button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className={styles.filterPanel}>
              <h4>Filtros</h4>
              {/* <form onSubmit={handleApplyFilters}> */}
                <div className={styles.filters}>

                  {/* Sección de categoría */}
                  <section className={styles.filterSection}>
                <h5>Categoría</h5>
                <InputField
                  id="postCategories"
                  type="select"
                  name="postCategories"
                  placeholder="Categoría"
                  onChange={addTag}
                  arrOptions={arrOptions}
                />
                <div className={styles["grid-list"]}>
                  <ul>
                    {selectedTags.map((tag) => (
                      <DeleteableTag key={tag} tag={tag} onDelete={() => deleteTag(tag)} />
                    ))}
                  </ul>
                </div>
              </section>

              {/* Filtro de Formatos */}
              <section className={styles.filterSection}>
                <h5>Formato</h5>
                <label>
                  <input
                    type="checkbox"
                    value=".glb"
                    checked={selectedFormats.includes(".glb")}
                    onChange={handleFormatChange}
                  /> .glb
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".png"
                    checked={selectedFormats.includes(".png")}
                    onChange={handleFormatChange}
                  /> .png
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".jpg"
                    checked={selectedFormats.includes(".jpg")}
                    onChange={handleFormatChange}
                  /> .jpg
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".mp4"
                    checked={selectedFormats.includes(".mp4")}
                    onChange={handleFormatChange}
                  /> .mp4
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".mp3"
                    checked={selectedFormats.includes(".mp3")}
                    onChange={handleFormatChange}
                  /> .mp3
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".txt"
                    checked={selectedFormats.includes(".txt")}
                    onChange={handleFormatChange}
                  /> .txt
                </label>
                <label>
                  <input
                    type="checkbox"
                    value=".zip"
                    checked={selectedFormats.includes(".zip")}
                    onChange={handleFormatChange}
                  /> .zip
                </label>
              </section>

              {/* Filtro de Tipos */}
              <section className={styles.filterSection}>
                <h5>Tipo</h5>
                <label>
                  <input
                    type="checkbox"
                    value="2D"
                    checked={selectedAssetTypes.includes("2D")}
                    onChange={handleAssetTypeChange}
                  /> 2D
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="3D"
                    checked={selectedAssetTypes.includes("3D")}
                    onChange={handleAssetTypeChange}
                  /> 3D
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Vídeo"
                    checked={selectedAssetTypes.includes("Vídeo")}
                    onChange={handleAssetTypeChange}
                  /> Vídeo
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Audio"
                    checked={selectedAssetTypes.includes("Audio")}
                    onChange={handleAssetTypeChange}
                  /> Audio
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Script"
                    checked={selectedAssetTypes.includes("Script")}
                    onChange={handleAssetTypeChange}
                  /> Script
                </label>
              </section>

              {/* Filtro de Puntuación */}
              <section className={styles.filterSection}>
                <h5>Puntuación</h5>
                <label>
                  <input
                    type="checkbox"
                    value="1"
                    checked={selectedRatings.includes("1")}
                    onChange={handleRatingChange}
                  />
                  <span className={styles["span"]}>
                    <p>&gt;</p>
                    <FontAwesomeIcon icon={faStar} />
                    
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="2"
                    checked={selectedRatings.includes("2")}
                    onChange={handleRatingChange}
                  />
                  <span className={styles["span"]}>
                    <p>&gt;</p>
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="3"
                    checked={selectedRatings.includes("3")}
                    onChange={handleRatingChange}
                  />
                  <span className={styles["span"]}>
                    <p>&gt;</p>
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="4"
                    checked={selectedRatings.includes("4")}
                    onChange={handleRatingChange}
                  />
                  <span className={styles["span"]}>
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                  </span>
                </label>
              </section>

                </div>
                <Button variant="white-rounded" label="Aplicar filtros" type="submit" role="submit"/>
              {/* </form> */}
            </div>
          )}

        </form>
      </div>
      );
}
