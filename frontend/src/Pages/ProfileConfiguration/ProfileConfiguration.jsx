import { Button, InputField, ProfileMenu } from '../../Components';
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { useAuth } from "../../Context";
import { applyUserPreferences, getCSSVariable } from '../../Utils';

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

/* Estilos */
import styles from "./ProfileConfiguration.module.css";
import { faCheck } from '@fortawesome/free-solid-svg-icons';

function ProfileConfiguration() {
  const { userId, logout } = useAuth();
  const [preferences, setPreferences] = useState({ theme: '', fontSize: '' });
  const [initial, setInitial] = useState({ theme: '', fontSize: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      console.log("ProfileConfiguration: userId aún no disponible");
      return;
    }

    (async () => {
      try {
        console.log("Fetching user:", userId);
        const res = await fetch(`${apiUrl}/api/users/${userId}`);
        console.log("GET /api/users status:", res.status, "ok?", res.ok);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status ${res.status}: ${text}`);
        }

        const user = await res.json();
        console.log("User payload:", user);

        const { theme = 'day', fontSize = 'medium' } = user;
        setPreferences({ theme, fontSize });
        setInitial({ theme, fontSize });
      } catch (err) {
        console.error("Error cargando usuario:", err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar tus preferencias',
          icon: 'error',
          background: getCSSVariable('--dark-grey'),     
          color: getCSSVariable('--white'),           
          customClass: {
            confirmButton: "swal-confirm-btn",
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const updates = {};
    if (preferences.theme !== initial.theme) updates.theme = preferences.theme;
    if (preferences.fontSize !== initial.fontSize) updates.fontSize = preferences.fontSize;
  
    if (Object.keys(updates).length === 0) {
      return Swal.fire({
        title: 'Sin cambios',
        text: 'No hay modificaciones para guardar',
        icon: 'info',
        background: getCSSVariable('--dark-grey'),     
        color: getCSSVariable('--white'),         
        customClass: {
          confirmButton: "swal-confirm-btn",
        },
      });
    }
  
    // Preguntar por la confirmación antes de proceder
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas guardar los cambios realizados en tus preferencias?',
      icon: 'warning',
      background: getCSSVariable('--dark-grey'),     
      color: getCSSVariable('--white'),           
      customClass: {
        confirmButton: "swal-confirm-btn",
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar cambios',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        console.log("PUT payload:", updates);
        const res = await fetch(`${apiUrl}/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        console.log("PUT /api/users status:", res.status, "ok?", res.ok);
  
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Status ${res.status}: ${text}`);
        }

        localStorage.setItem(
          'userPreferences',
          JSON.stringify({ theme: preferences.theme, fontSize: preferences.fontSize })
        );
        
        applyUserPreferences({ theme: preferences.theme, fontSize: preferences.fontSize });

        await res.json();
        Swal.fire({
          title: "¡Listo!",
          text: 'Tus preferencias han sido actualizadas',
          icon: 'success',
          background: getCSSVariable('--dark-grey'),     
          color: getCSSVariable('--white'),           
          customClass: {
            confirmButton: "swal-confirm-btn",
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });

        setInitial({ ...preferences });
      } catch (err) {
        console.error('Error al actualizar:', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron guardar los cambios',
          icon: 'error',
          background: getCSSVariable('--dark-grey'),     
          color: getCSSVariable('--white'),           
          customClass: {
            confirmButton: "swal-confirm-btn",
          },
        });
      }
    }
  };
  

  const handleDelete = async () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminarán todos tus assets y compras. Esta acción no se puede deshacer.',
      icon: 'warning',
      background: getCSSVariable('--dark-grey'),     
      color: getCSSVariable('--white'),          
      customClass: {
        confirmButton: "swal-confirm-btn",
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${apiUrl}/api/users/${userId}`, { method: 'DELETE' });
          console.log("DELETE /api/users status:", res.status, "ok?", res.ok);
          if (!res.ok) throw new Error();

          // Muestra el mensaje de éxito
          Swal.fire({
            title: 'Eliminado',
            text: 'Tu cuenta ha sido dada de baja',
            icon: 'success',
            background: getCSSVariable('--dark-grey'),     
            color: getCSSVariable('--white'),           
            customClass: {
              confirmButton: "swal-confirm-btn",
            }
          });
        
          // Limpia el contexto de autenticación
          logout();

        } catch {
          Swal.fire({
            title: 'Error',
            text: 'No se pudo dar de baja tu cuenta',
            icon: 'error',
            background: getCSSVariable('--dark-grey'),     
            color: getCSSVariable('--white'),           
            customClass: {
              confirmButton: "swal-confirm-btn",
            },
          });
        }
      }
    });
  };
  
  if (loading) return <p>Cargando...</p>;

  return (
    <div className={styles["profile-main-container"]}>
      <section className={styles["left-content"]}>
        <ProfileMenu />
      </section>
      <section className={styles["right-section"]}>
        <h1>Configuración</h1>
        <hr/>

        <section>
          <h2>Cuenta</h2>
          <div className={styles["responsive-div"]}>
            <section>
              <h3>Dar de baja la cuenta</h3>
              <small>Al darte de baja estarás eliminando todos tus assets y compras realizadas</small>
            </section>
            <Button onClick={handleDelete} label="Dar de baja" variant="white-red" />
          </div>
        </section>

        <hr/>

        <section>
          <h2>Preferencias de Interfaz</h2>
          <div className={styles["responsive-div"]}>
            <section>
              <h3>Tema</h3>
              <small>Realiza cambios en los colores de las fuentes, fondos e iconos</small>
            </section>
            <InputField
              id="theme"
              type="select"
              name="theme"
              value={preferences.theme}
              onChange={handleChange}
              arrOptions={[
                { label: "Noche", value: "night" },
                { label: "Día", value: "day" }
              ]}
            />
          </div>
          <div className={styles["responsive-div"]}>
            <section>
              <h3>Tamaño de fuente</h3>
              <small>Cambia el tamaño de letra: grande, mediano, pequeño</small>
            </section>
            <InputField
              id="fontSize"
              type="select"
              name="fontSize"
              value={preferences.fontSize}
              onChange={handleChange}
              arrOptions={[
                { label: "Grande", value: "large" },
                { label: "Mediano", value: "medium" },
                { label: "Pequeño", value: "small" }
              ]}
            />
          </div>
        </section>
        <hr/>
          <div className={styles['actions']}>
            <Button onClick={handleSubmit} label="Confirmar cambios" variant="red" icon={faCheck} role="submit"/>
          </div>
      </section>
    </div>
  );
}

export default ProfileConfiguration;
