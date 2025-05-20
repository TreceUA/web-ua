import { Button, InputField, ProfileMenu } from '../../Components';
import { faCheck, faRotateLeft, faLock, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react"; // 🔄 CAMBIO
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../Context";
import Swal from "sweetalert2";
import { getCSSVariable } from '../../Utils';
import styles from "./Profile.module.css";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function Profile() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    web: "",
    twitter: "",
    insta: "",
    currentPassword: "",
    newPassword: "",
  });
  const { userId } = useAuth();
  const [errors, setErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const fileInputRef = useRef(null); // 🔄 CAMBIO

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error("No se encontró el ID del usuario en el contexto.");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/users/${userId}`);
        const data = await response.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          bio: data.biografia || "",
          web: data.web || "",
          twitter: data.twitter || "",
          insta: data.instagram || "",
        });
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  //--------- SUBIDA DE FORMULARIO -----------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.name) newErrors.name = "El nombre es obligatorio";
    if (!formData.email) newErrors.email = "El correo es obligatorio";
    if (showPasswordFields) {
      if (!formData.currentPassword) newErrors.currentPassword = "La contraseña actual es obligatoria";
      if (!formData.newPassword) newErrors.newPassword = "La nueva contraseña es obligatoria";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await Swal.fire({
      title: "¿Confirmar acción?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      background: "#1e1e1e",
      color: "#ffffff",
      customClass: {
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn"
      }
    });

    if (!result.isConfirmed) return;

    // 🔄 CAMBIO: Usamos FormData
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("biografia", formData.bio);
    formDataToSend.append("web", formData.web);
    formDataToSend.append("twitter", formData.twitter);
    formDataToSend.append("instagram", formData.insta);
    if (showPasswordFields && formData.newPassword) {
      formDataToSend.append("password", formData.newPassword);
    }

    if (fileInputRef.current?.files[0]) {
      formDataToSend.append("foto", fileInputRef.current.files[0]);
    }

    try {
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
        method: "PUT",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setErrors((prevErrors) => ({ ...prevErrors, email: "Usuario no encontrado" }));
        } else {
          throw new Error(result.message || "Error al actualizar el perfil");
        }
      } else {
        Swal.fire({
          title: "¡Perfil actualizado!",
          text: "Tu perfil ha sido actualizado correctamente.",
          icon: "success",
          confirmButtonText: "Continuar",
          background: "#1e1e1e",     
          color: "#ffffff",         
          customClass: {
            confirmButton: "swal-confirm-btn",
          }
        }).then(() => {
          window.location.reload();
        });
        
      }
    } catch (error) {
      setErrors((prevErrors) => ({ ...prevErrors, general: error.message }));
      console.error("Error inesperado:", error);
    }
  };
  //--------- CAMBIO DE VALORES -----------------------------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: "" }));
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: '¿Reestablecer formulario?',
      text: 'Se volverán a insertar tus datos actuales. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reestablecer',
      cancelButtonText: 'No, cancelar',
      background: getCSSVariable('--dark-grey'),
      color: getCSSVariable('--white'),
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton:  'swal-cancel-btn'
      }
    });
  
    if (!result.isConfirmed) return;
  
    try {
      const res = await fetch(`${apiUrl}/api/users/${userId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }
      const data = await res.json();
  
      setFormData({
        name: data.name      || '',
        email: data.email    || '',
        bio: data.biografia  || '',
        web: data.web        || '',
        twitter: data.twitter|| '',
        insta: data.instagram|| '',
        currentPassword: '',
        newPassword: ''
      });
      setPreviewUrl('');      // o recarga la imagen si lo deseas
      setErrors({});
    } catch (err) {
      console.error('Error al resetear formulario:', err);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo reestablecer el formulario',
        icon: 'error',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: { confirmButton: 'swal-confirm-btn' }
      });
    }
  };
  


  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
  };

  return (
    <div className={styles["profile-main-container"]}>
      <section className={styles["left-content"]}>
        <ProfileMenu />
      </section>

      <section className={styles["right-content"]}>
        <header>
          <h1>Perfil</h1>
          <small>Los campos con el carácter '*' son obligatorios</small>
        </header>
        <hr></hr>
        <form onSubmit={handleSubmit}>
          <h2>Información personal</h2>
          {errors.general && <p className={styles["error"]}>{errors.general}</p>}
          <div className={styles["seccion"]}>
            <div className={styles["pic-name-email-input"]}>
              <div className={styles["profile-pic-container"]}>
                <img
                 src={previewUrl || `${apiUrl}/api/users/${userId}/foto`}
                  alt="Foto de perfil"
                  className={styles["profile-pic"]}
                  onError={(e) => {e.target.src = '/profile.png';}}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  id="fileUpload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles["update-button"]}
                  onClick={() => fileInputRef.current?.click()} // ✅ Abrimos el input al hacer clic
                >
                  Cambiar foto
                </button>
              </div>

              <div className={styles["name-email-input"]}>
                <InputField
                  id="name"
                  type="text"
                  label="Nombre (*)"
                  name="name"
                  placeholder="Usuario"
                  value={formData.name}
                  onChange={handleChange}
                  explicativeText={errors.name}
                  aria-required="true"
                />
                <InputField
                  id="email"
                  type="text"
                  label="Email (*)"
                  name="email"
                  placeholder="usuario@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  explicativeText={errors.email}
                  aria-required="true"
                />
              </div>
            </div>

            <InputField
              id="bio"
              type="textarea"
              label="Biografía"
              name="bio"
              placeholder="Háblanos de ti"
              value={formData.bio}
              onChange={handleChange}
              explicativeText={errors.bio}
            />
          </div>
          <hr></hr>
          <h2>Social</h2>
          <div className={styles["seccion"]}>
            <InputField
              id="web"
              type="text"
              label="Web"
              name="web"
              placeholder="Tu sitio web"
              value={formData.web}
              onChange={handleChange}
              explicativeText={errors.web}
              className={styles["custom-input"]}
            />
            <InputField
              id="twitter"
              type="text"
              label="Twitter"
              name="twitter"
              placeholder="@nombre twitter"
              value={formData.twitter}
              onChange={handleChange}
              explicativeText={errors.twitter}
            />
            <InputField
              id="insta"
              type="text"
              label="Instagram"
              name="insta"
              placeholder="@nombre instagram"
              value={formData.insta}
              onChange={handleChange}
              explicativeText={errors.insta}
            />
          </div>
          <hr></hr>
          <h4 onClick={togglePasswordFields} className={styles["change-password-header"]}>
            <FontAwesomeIcon icon={faLock} />
            <span> Cambiar contraseña </span>
            <FontAwesomeIcon icon={showPasswordFields ? faChevronDown : faChevronUp} />
          </h4>

          {showPasswordFields && (
            <div className={styles["seccion"]}>
              <InputField
                id="currentPassword"
                type="password"
                label="Contraseña actual"
                name="currentPassword"
                placeholder="Introduce tu contraseña actual"
                value={formData.currentPassword}
                onChange={handleChange}
                explicativeText={errors.currentPassword}
              />
              <InputField
                id="newPassword"
                type="password"
                label="Nueva contraseña"
                name="newPassword"
                placeholder="Introduce la nueva contraseña"
                value={formData.newPassword}
                onChange={handleChange}
                explicativeText={errors.newPassword}
              />
            </div>
          )}
          <hr></hr>
          <div className={styles["profile-buttons"]}>
            <Button
              className={styles.btn_regist}
              variant="red"
              label="Reestablecer"
              icon={faRotateLeft}
              type="button"
              onClick={() => handleReset()}
            />
            <Button variant="red" label="Actualizar" icon={faCheck} type="submit" />
          </div>
        </form>
      </section>
    </div>
  );
}

export default Profile;
