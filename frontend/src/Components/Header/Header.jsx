import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import NavBar from "../NavBar/NavBar";
import SearchBar from "../SearchBar/SearchBar";
import Button from "../Button/Button";
import { faSignInAlt, faUserPlus, faBars , faUser, faFolder, faDownload, faCog, faSignOutAlt, faCaretDown, faArrowUpFromBracket} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../Context";  

const apiUrl = process.env.REACT_APP_API_URL;

export default function Header( ) { //{ isAuth, setIsAuth } antes lo usaba
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const profileButtonRef = useRef(null);

    // Usamos el hook useAuth para obtener isAuth y logout
    const { isAuth, logout, userId } = useAuth();
    const [foto, setFoto] = useState("");

    useEffect(() => {
        const fetchUserPhoto = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`${apiUrl}/api/users/${userId}`);
                const data = await response.json();
                setFoto(data.foto || "");
            } catch (error) {
                console.error("Error al cargar la foto del usuario:", error);
            }
        };

        fetchUserPhoto();
    }, [userId]);

    const handleLogout = () => {
        //setIsAuth(false); // Ahora sí actualiza el estado
        logout();  // Usamos la función logout del contexto para cerrar sesión
        setProfileMenuOpen(false);// Cierra el menú después del logout
      };
    
    useEffect(() => {
        // Función que se ejecuta cuando se hace clic en cualquier parte de la página
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current && !profileMenuRef.current.contains(event.target) && 
                !profileButtonRef.current.contains(event.target)
            ) {
                setProfileMenuOpen(false); // Cierra el menú si el clic es fuera de los dos elementos
            }
        };

        // Añadimos el event listener cuando el componente se monta
        document.addEventListener("click", handleClickOutside);

        // Limpiamos el event listener cuando el componente se desmonta
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);
    
    return (
        <header className={styles.header} role="banner">
            <div className={styles.leftContent}>
                <div className={styles.navigation}>
                     <div className={styles.topNav}>
                     <a href="/home" aria-label="Ir a la página de inicio" title="Ir a la página de inicio">
                        <img className={styles.logo} alt="Logo de MolaMazoGames" src="/logo.png" />
                        <p className={styles.logofont}>MolaMazoGames</p>
                    </a>

                        <FontAwesomeIcon icon={faBars} className={styles.menuIcon} onClick={() => setMenuOpen(!menuOpen)}/>
                    </div> 
                    <NavBar menuOpen={menuOpen} />  {/* Pasamos el estado a NavBar */}
                </div>                 
                <SearchBar />
            </div>
            <div className={styles.rightContent}>
                {!isAuth ? 
                    <>
                        <Button  variant="headerButtonWhite" label="Iniciar sesión" icon={faSignInAlt} onClickFunction={() => console.log("Redirigiendo a inicio de sesión...")} to="/login" role="link"/> 
                        <Button  className={styles.btn_regist}  variant="headerButtonBlack" label="Registrarse" icon={faUserPlus} onClickFunction={() => console.log("Redirigiendo a registro...")} to="/register" role="link"/> 
                    </>
                :
                    <>  
                    <Button  variant="headerButtonWhite" label="Subir asset" icon={faArrowUpFromBracket} onClickFunction={() => console.log("Redirigiendo a subir asset...")} to="/post-form" role="link"/> 

                    <div className={styles.drop} onClick={() => setProfileMenuOpen(!profileMenuOpen)} ref={profileButtonRef}>
                        <img alt="foto de perfil" src={`${apiUrl}/api/users/${userId}/foto`} onError={(e) => {e.target.src = '/profile.png';}}/>
                        <FontAwesomeIcon icon={faCaretDown} />
                    </div>

                    {/* Menú desplegable */}
                    {profileMenuOpen && (
                        <div className={styles.profileMenu} ref={profileMenuRef} role="navigation">
                            <p className={styles.menuTitle}>Tus opciones</p>
                            <ul role="navigation">
                                <a href="/profile"><li><FontAwesomeIcon icon={faUser} /> Perfil</li></a>
                                <a href="/my-assets"><li><FontAwesomeIcon icon={faFolder} /> Mis assets</li></a>
                                <a href="/my-downloads"><li><FontAwesomeIcon icon={faDownload} /> Mis descargas</li></a>
                                <a href="/profile-configuration"><li><FontAwesomeIcon icon={faCog} /> Configuración</li></a>
                                <li className={styles.logout} onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Cerrar sesión</li>
                            </ul>
                        </div>
                    )}

                    </>
                }
            </div>
            
                
        </header>
      );
}