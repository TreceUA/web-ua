import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* Estilos */
import styles from "./UpButton.module.css";

function UpButton() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button className={styles.upButton} onClick={scrollToTop} aria-label="Volver al inicio de esta página" title="Volver al inicio de esta página">
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
}

export default UpButton;
