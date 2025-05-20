/* Componentes */
import { Link, useNavigate } from "react-router-dom";
import { Button, InputField } from '../../Components';
import { faUser, faLock, faCheck, faRotateLeft, faRotate } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useAuth } from "../../Context";
import { getCSSVariable } from "../../Utils";
import Swal from 'sweetalert2';
import Lottie from "lottie-react";
import loginAnimation from "../../assets/burbuja.json"; 

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

/* Estilos */
import styles from "./Login.module.css";

function Login() {
  const [formData, setFormData] = useState({ name: "", password: "" });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prevErrors) => ({ ...prevErrors, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    
   if (!formData.name) newErrors.name = "El usuario es obligatorio";
   if (!formData.password) newErrors.password = "La contraseña es obligatoria";
   
   if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
   }
    
    try {
      const response = await fetch("${apiUrl}/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          setErrors((prevErrors) => ({ ...prevErrors, name: "Este usuario o correo electrónico no existe" }));
        } else if (response.status=== 401) {
          setErrors((prevErrors) => ({ ...prevErrors, name: "Contraseña incorrecta" }));
          
        }else {
          throw new Error(result.message || "Error en el login");
        }
        console.log("Login incorrecto", result);
      }else{
        console.log("Login exitoso", result);

        // Suponiendo que el backend te devuelve el id en `result.userId`
        login(result.user._id); // Guarda el id en el contexto y sessionStorage
        navigate("/home"); // Redirigís al usuario a una ruta protegida
      }

      
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
      setFormData({ name: "", password: "" });
      setErrors({});
    }
  };
  

  return (
    <div className={styles["login-main-container"]}>
      <section className={styles["left-section"]}>
        <h1>Inicia sesión</h1>
        <small>Los campos con el carácter '*' son obligatorios</small>
        {errors.general && <p className={styles["error"]}>{errors.general}</p>}
        <form onSubmit={handleSubmit}>
          <InputField 
            id="name" 
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
          <div>
            <Button type="reset" variant="red" label="Limpiar" onClick={handleClear} icon={faRotateLeft} role="reset"/>
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
        <p>¿No tienes una cuenta?</p>
        <Button variant="white" label="Regístrate" to="/register" role="link"/>
      </section>
    </div>
  );
}

export default Login;
