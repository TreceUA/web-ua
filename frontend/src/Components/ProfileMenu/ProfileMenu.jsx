import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faFolder, faDownload, faCog } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../../Context"; // o desde donde lo tengas
import { useEffect, useState } from "react";

import styles from "./ProfileMenu.module.css";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

export default function ProfileMenu() {
    const { userId } = useAuth();
    const [userData, setUserData] = useState({
        name: "",
        foto: "",
        uploads: 0,
        downloads: 0,
    });

    useEffect(() => {
      const fetchUserData = async () => {
          if (!userId) return;
  
          try {
              // Petición para datos básicos del usuario
              const resUser = await fetch(`${apiUrl}/api/users/${userId}`);
              const dataUser = await resUser.json();
  
              // Petición para publicaciones subidas
              const resUploads = await fetch(`${apiUrl}/api/publicaciones/usuario/${userId}`);
              const dataUploads = await resUploads.json();
  
              // Petición para descargas
              const resDownloads = await fetch(`${apiUrl}/api/users/${userId}/descargas`);
              const dataDownloads = await resDownloads.json();
  
              setUserData({
                  name: dataUser.name || "Usuario",
                  foto: dataUser.foto || "",
                  uploads: dataUploads.length || 0,
                  downloads: dataDownloads.length || 0,
              });
          } catch (error) {
              console.error("Error al obtener los datos del usuario:", error);
          }
      };
  
      fetchUserData();
  }, [userId]);
  

    return (
        <div className={styles.profilemenu}>
            <div className={styles.profilebox}>
                <div className={styles.photoname}>
                    <img alt="Foto de perfil" src={`${apiUrl}/api/users/${userId}/foto`} onError={(e) => {e.target.src = '/profile.png';}}></img>
                    <p>{userData.name}</p>
                </div>
                <div className={styles.uploadsdownloads}>
                  <p>{userData.uploads} Publicaciones</p>
                  <p>{userData.downloads} Descargas</p>
                </div>
            </div>
            <Link to="/profile">
                <FontAwesomeIcon icon={faUser} /> Perfil
            </Link>
            <Link to="/my-assets">
                <FontAwesomeIcon icon={faFolder} /> Mis Assets
            </Link>
            <Link to="/my-downloads">
                <FontAwesomeIcon icon={faDownload} /> Mis descargas
            </Link>
            <Link to="/profile-configuration">
                <FontAwesomeIcon icon={faCog} /> Configuración
            </Link>
        </div>
      );
}
