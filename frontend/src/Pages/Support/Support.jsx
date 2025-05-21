import { Button, InputField } from '../../Components';
import Swal from 'sweetalert2';
import { getCSSVariable } from "../../Utils";
import styles from "./Support.module.css";
import { useState } from 'react';
import { useRef } from 'react';
import { faCheck, faRotateLeft} from "@fortawesome/free-solid-svg-icons";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function Support() {
  const fileInputRef = useRef(null);
  const selectRef = useRef(null);
  const [form, setForm] = useState({
    issueType: "",
    description: "",
    attachment: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
     if (errors[name]) {
       setErrors((prev) => ({ ...prev, [name]: null }));
     }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, attachment: file }));
     if (errors.attachment) {
       setErrors((prev) => ({ ...prev, attachment: null }));
     }
  };

  const resetForm = () => {
    setForm({
      issueType: "",
      description: "",
      attachment: null
    });
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (selectRef.current) selectRef.current.value = "";

  };


  const handleClear = async () => {
     if (!form.issueType && !form.description && !form.attachment) {
         return;
     }
    const result = await Swal.fire({
      title: '¿Limpiar formulario?',
      text: 'Se borrarán todos los datos introducidos.',
      icon: 'warning',
      background: getCSSVariable('--dark-grey'),
      color: getCSSVariable('--white'),
      customClass: {
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        resetForm();
    }
  };

   const validateForm = () => {
    const newErrors = {};
    if (!form.issueType) { 
      newErrors.issueType = "Debes seleccionar un tipo de problema.";
    }
    if (!form.description.trim()) {
      newErrors.description = "La descripción no puede estar vacía.";
    } else if (form.description.trim().length < 10) {
       newErrors.description = "La descripción debe tener al menos 10 caracteres.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData();
    formData.append('issueType', form.issueType);
    formData.append('description', form.description);
    if (form.attachment) {
      formData.append('attachment', form.attachment, form.attachment.name);
    }

    try {
      const response = await fetch(`${apiUrl}/api/support/issues`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Error al enviar el reporte.";
        let backendErrors = {};
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || `Error ${response.status}`;
            backendErrors = errorData.errors || {};
        } catch (parseError) {
             errorMsg = response.statusText || errorMsg;
        }
        if (Object.keys(backendErrors).length > 0) {
             setErrors(backendErrors);
        }
        throw new Error(errorMsg);
      }

      await Swal.fire({
        title: '¡Enviado!',
        text: 'Tu reporte ha sido enviado correctamente.',
        icon: 'success',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: { confirmButton: "swal-confirm-btn" }
      });
      resetForm();

    } catch (error) {
      if (Object.keys(errors).length === 0) {
         await Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo enviar el reporte. Inténtalo de nuevo.',
            icon: 'error',
            background: getCSSVariable('--dark-grey'),
            color: getCSSVariable('--white'),
            customClass: { confirmButton: "swal-confirm-btn" }
         });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={styles["support-main-container"]}>
      <section className={styles["right-content"]}>
        <header>
          <h1>Soporte</h1>
          <p>Encuentra respuestas o reporta un problema relacionado con los assets o la plataforma.</p>
        </header>
        <hr />
        <div className={styles["faq-section"]}>
          <h2>Preguntas Frecuentes</h2>
          <ul>
            <li><strong>¿Qué tipo de archivos puedo subir?</strong> Se permiten .fbx, .obj, .png, .tga, .wav, .mp3, entre otros.</li>
            <li><strong>¿Cómo versiono correctamente un asset?</strong> Usa nombres como `modelo_v2.fbx` o `textura-final.tga`.</li>
            <li><strong>¿Cómo asigno un asset a un proyecto?</strong> Al subirlo, selecciona el proyecto en el formulario.</li>
            <li><strong>No puedo previsualizar un asset</strong> Asegúrate de que el formato sea compatible o contacta soporte.</li>
          </ul>
        </div>
        <hr />
        <div className={styles["form-section"]}>
          <h2>Reportar un problema</h2>
          <small>Los campos con el carácter '*' son obligatorios</small>
          <form className={styles["support-form"]} onSubmit={handleSubmit} noValidate>
            <InputField
              id="issue-type"
              type="select"
              name="issueType"
              label="Tipo de problema (*)"
              arrOptions={[
                { value: "", label: "Selecciona un tipo...", disabled: true },
                { value: "bug", label: "Bug/Error en la plataforma" },
                { value: "asset-issue", label: "Problema con un Asset" },
                { value: "suggestion", label: "Sugerencia/Mejora" },
                { value: "question", label: "Duda general" },
                { value: "other", label: "Otro" },
              ]}
              value={form.issueType}
              onChange={handleChange}
              ref={selectRef}
              aria-required="true"
              explicativeText={errors.issueType}
            />

            <InputField
              id="description"
              type="textarea"
              name="description"
              label="Descripción (*)"
              placeholder="Describe detalladamente el problema o sugerencia..."
              value={form.description}
              onChange={handleChange}
              aria-required="true"
              explicativeText={errors.description}
            />

            <InputField
              id="attachment"
              type="file"
              name="attachment"
              label="Adjuntar archivo (Opcional)"
              onChange={handleFileChange}
              ref={fileInputRef}
              explicativeText={errors.attachment}
            />

            <div className={styles["support-buttons"]}>
              <Button
                variant="white"
                label="Limpiar"
                icon={faRotateLeft}
                type="button"
                onClick={handleClear}
                disabled={isSubmitting}
                role="reset"
              />
              <Button
                variant="red"
                label="Enviar"
                icon={faCheck}
                type="submit"
                disabled={isSubmitting}
                role="submit"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Support;