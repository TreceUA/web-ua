import styles from "./Model.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalf } from "@fortawesome/free-solid-svg-icons";

function Model() {
    return (
        <article className={styles["article-model"]}>
            <header className={styles["model-header"]}>
                {/* <img className={styles["model-image"]} src="../../../public/imageholder.png" alt="Imagen del modelo" /> */}
                <img className={styles["model-image"]} src="imageholder.png" alt="Imagen del modelo" />
            </header>
            <footer className={styles["model-footer"]}>
                <h3>Título</h3>
                <p>Artista</p>
                <span>
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStar} />
                    <FontAwesomeIcon icon={faStarHalf} />
                </span>
            </footer>
        </article>
    );
}

export default Model;