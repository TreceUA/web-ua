import { Link } from "react-router-dom";
import styles from "./Category.module.css";

function Category({ id, nombre, fotoURL }) {
  return (
    <Link to={`/buscar?categories=${nombre}`} className={styles["article-category-link"]}>
      <article className={styles["article-category"]}>
        <header className={styles["category-header"]}>
          <img
            className={styles["category-image"]}
            src={fotoURL || "no-image.webp"} // Usa imagen por defecto si no hay foto
            alt={`Categoria ${nombre}`}
            onError={(e) => {e.target.src = '/no-image.webp';}} 
          />
        </header>
        <footer className={styles["category-footer"]}>
          <h3>{nombre}</h3>
        </footer>
      </article>
    </Link>
  );
}

export default Category;
