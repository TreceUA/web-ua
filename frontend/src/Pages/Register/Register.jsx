import { Button, InputField } from '../../Components';
import { faUser, faLock, faEnvelope, faRotateLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Swal from "sweetalert2";
import { getCSSVariable } from '../../Utils';
import Lottie from "lottie-react";
import loginAnimation from "../../assets/manchas.json"; 

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

/* Estilos */
import styles from "./Register.module.css";

function Register() {
  const [formData, setFormData] = useState({ email: "", name: "", password: "", password_rep: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.email) newErrors.email = "El correo es obligatorio";
    if (!formData.name) newErrors.name = "El usuario es obligatorio";
    if (!formData.password) newErrors.password = "La contraseña es obligatoria";
    if (formData.password !== formData.password_rep) newErrors.password_rep = "Las contraseñas no coinciden";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch("${apiUrl}/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 400) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            name: "Este usuario o correo electrónico ya existe"
          }));
        } else {
          throw new Error(result.message || "Error en el registro");
        }
        return; // 👈 IMPORTANTE: evita seguir si hubo error
      }
      
      // ✅ Solo se ejecuta si todo fue bien
      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: '¡Tu cuenta ha sido creada!',
        confirmButtonText: "Continuar",
        background: "#1e1e1e",
        color: "#ffffff",
      }).then(() => {
        navigate("/login");
      });      

      console.log("Registro exitoso", result);
    } catch (error) {
      setErrors((prevErrors) => ({ ...prevErrors, general: error.message }));
    }
  };

  const handleClear = async () => {
    const result = await Swal.fire({
      title: '¿Limpiar formulario?',
      text: '¿Deseas borrar todos los campos introducidos?',
      icon: 'warning',
      background: getCSSVariable('--dark-grey'),
      color: getCSSVariable('--white'),
      customClass: {
        confirmButton: "swal-confirm-btn",
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      setFormData({ email: "", name: "", password: "", password_rep: "" });
      setErrors({});
    }
  };

  return (
    <div className={styles["login-main-container"]}>
      <section className={styles["left-section"]}>
        <h1>Regístrate</h1>
        <small>Los campos con el carácter '*' son obligatorios</small>
        <form onSubmit={handleSubmit}>
          <InputField 
            id="email"
            type="email"
            label="Correo electrónico (*)"
            name="email"
            placeholder="Correo"
            icon={faEnvelope}
            value={formData.email}
            onChange={handleChange}
            explicativeText={errors.email}
            aria-required="true"
          />
          <InputField 
            id="user"
            type="text"
            label="Nombre de usuario (*)"
            name="name"
            placeholder="Usuario"
            icon={faUser}
            value={formData.name}
            onChange={handleChange}
            explicativeText={errors.name}
            aria-required="true"
          />
          <InputField 
            id="password"
            type="password"
            label="Contraseña (*)"
            name="password"
            placeholder="Contraseña"
            icon={faLock}
            value={formData.password}
            onChange={handleChange}
            explicativeText={errors.password}
            aria-required="true"
          />
          <InputField 
            id="password_rep"
            type="password"
            label="Repetir contraseña (*)"
            name="password_rep"
            placeholder="Contraseña"
            icon={faLock}
            value={formData.password_rep}
            onChange={handleChange}
            explicativeText={errors.password_rep} 
            aria-required="true"
          />
          <div>
            <Button type="reset" variant="red" label="Limpiar" onClick={handleClear} icon={faRotateLeft} role="submit"/>
            <Button type="submit" variant="red" label="Aceptar" icon={faCheck} role="submit"/>
          </div>
        </form>
      </section>
      <section className={styles["right-section"]}>
        <Lottie 
          animationData={loginAnimation} 
          loop 
          autoplay 
          className={styles["right-animation"]}
        />
        <img alt="logo" src="/logo.png"/>
        <h1>Bienvenido</h1>
        <p>¿Ya tienes una cuenta?</p>
        <Button variant="white" label="Inicia sesión" to="/login" role="link"/>
      </section>
    </div>
  );
}

export default Register;
