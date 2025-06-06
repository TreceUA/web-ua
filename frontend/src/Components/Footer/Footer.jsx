import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./Footer.module.css"
import { faGlobe } from "@fortawesome/free-solid-svg-icons"
import { faCopyright } from "@fortawesome/free-regular-svg-icons"

export default function Footer() {
    return (
        <footer className={styles.footerContainer} role="contentinfo">
            <div className={styles.idioma}>
                <FontAwesomeIcon icon={faGlobe} />
                <p>Español</p>
            </div>
            <div className={styles.copyrightContainer}>
                <div className={styles.copyright}>
                    <p>Copyright</p>
                    <FontAwesomeIcon icon={faCopyright} />
                </div>
                <p>{new Date().getFullYear()}. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
}
