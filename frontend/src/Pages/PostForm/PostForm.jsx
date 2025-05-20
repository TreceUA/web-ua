import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp, faRotateLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Button, InputField, DeleteableTag } from '../../Components';
import { getCSSVariable } from "../../Utils";
import Swal from "sweetalert2";
import styles from "./PostForm.module.css";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function PostForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({ postTitle: "", postDescription: "" });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [initialFiles, setInitialFiles] = useState([]);
  const [miniatureFile, setMiniatureFile] = useState(null);
  const [initialMiniature, setInitialMiniature] = useState(null);
  const [arrOptions, setArrOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [initialTags, setInitialTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [fechaModificacion, setFechaModificacion] = useState(null);
  const [initialFormData, setInitialFormData] = useState({ postTitle: "", postDescription: "" });

  const dropAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const miniatureInputRef = useRef(null);
  const MAX_FILES = 10;

  const isDuplicate = (fileName) =>
    uploadedFiles.some((f) => f.name === fileName);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const addFiles = (files) => {
    const newFiles = [];

    for (const file of files) {
      if (isDuplicate(file.name)) continue;
      if (uploadedFiles.length + newFiles.length >= MAX_FILES) break;
      newFiles.push(file);
    }

    if (newFiles.length < files.length) {
      setErrors(prev => ({ ...prev, postFile: "Algunos archivos ya estaban añadidos o exceden el límite." }));
    } else {
      setErrors(prev => ({ ...prev, postFile: "" }));
    }

    if (newFiles.length) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    if(miniatureInputRef.current) miniatureInputRef.current.value = "";
  };

  const handleFileInput = (e) => {
    const { name, files } = e.target;
  
    if (name === "postFile") {
      addFiles(Array.from(files));
    } else if (name === "postMiniature") {
      const file = files[0];
      if (!file) return;
      setMiniatureFile(file);
      setErrors(prev => ({ ...prev, postMiniature: "" }));
    }
  
    if (fileInputRef.current) fileInputRef.current.value = "";
    if(miniatureInputRef.current) miniatureInputRef.current.value = "";
  };
  

  const handleDeleteFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const addTag = (e) => {
    const newTag = e.target.value;
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
    }
  };   

  const deleteTag = (tagToDelete) => {
    setSelectedTags(prevTags => prevTags.filter(tag => tag !== tagToDelete));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const filesToDelete = initialFiles.filter(initialFile =>
      !uploadedFiles.some(file => file.name === initialFile.nombre)
    );
  
    const hasNewFiles = uploadedFiles.some(file => file instanceof File);
    const hasRemainingInitialFiles = initialFiles.some(initialFile =>
      uploadedFiles.some(file => file.name === initialFile.nombre)
    );
  
    // Validaciones
    const newErrors = {};
    if (!formData.postTitle)       newErrors.postTitle = "El título es obligatorio";
    if (!formData.postDescription) newErrors.postDescription = "La descripción es obligatoria";
    if (!hasNewFiles && !hasRemainingInitialFiles) {
      newErrors.postFile = "Debe subir al menos un archivo";
    }
    if (!miniatureFile && !initialMiniature) {
      newErrors.postMiniature = "Debe subir una miniatura obligatoriamente";
    }    
  
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
  
    const compareTags = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    };
    
    
    if (isEditMode) {
      // ——— DEBUG: imprimir estado actual vs inicial ——
      console.log("=== DEBUG SIN CAMBIOS ===");
      console.log("formData.postTitle:", formData.postTitle);
      console.log("initialFormData.postTitle:", initialFormData.postTitle);
      console.log("formData.postDescription:", formData.postDescription);
      console.log("initialFormData.postDescription:", initialFormData.postDescription);
    
      //AA 

      const sortedCurrentTags = [...selectedTags].sort();
      const sortedInitialTags = [...initialTags].sort();
      console.log("selectedTags:", selectedTags);
      console.log("initialTags:", initialTags);
      console.log("sortedCurrentTags:", sortedCurrentTags);
      console.log("sortedInitialTags:", sortedInitialTags);
    
      const isMiniatureChanged = miniatureFile?.name !== initialMiniature?.nombre;
      console.log("miniatureFile?.name:", miniatureFile?.name);
      console.log("initialMiniature?.nombre:", initialMiniature?.nombre);
      console.log("isMiniatureChanged:", isMiniatureChanged);
    
      // Nuevo criterio: solo contamos como "nuevo" si es File y no estaba en initialFiles
      const hasNewFiles = uploadedFiles.some(
        file => file instanceof File &&
                !initialFiles.some(init => init.nombre === file.name)
      );
      console.log("uploadedFiles:", uploadedFiles);
      console.log("hasNewFiles:", hasNewFiles);
    
      // Archivos iniciales que han sido eliminados
      const filesToDelete = initialFiles.filter(
        init => !uploadedFiles.some(f => f.name === init.nombre)
      );
      console.log("initialFiles:", initialFiles);
      console.log("filesToDelete:", filesToDelete);
    
      const compareTags = (arr1, arr2) =>
        arr1.length === arr2.length && arr1.every((v, i) => v === arr2[i]);
    
      const sinCambios =
        formData.postTitle === initialFormData.postTitle &&
        formData.postDescription === initialFormData.postDescription &&
        compareTags(sortedCurrentTags, sortedInitialTags) &&
        filesToDelete.length === 0 &&
        !isMiniatureChanged &&
        !hasNewFiles;
    
      console.log("sinCambios:", sinCambios);
      console.log("=== FIN DEBUG ===");
    
      if (sinCambios) {
        await Swal.fire({
          title: 'Sin cambios',
          text: 'No hay modificaciones para guardar',
          icon: 'info',
          background: getCSSVariable('--dark-grey'),
          color: getCSSVariable('--white'),
          customClass: { confirmButton: "swal-confirm-btn" }
        });
        return;
      }
    
      const result = await Swal.fire({
        title: '¿Desea actualizar la publicación?',
        text: 'Se sustituirán los datos antiguos por los nuevos',
        icon: 'warning',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: { confirmButton: "swal-confirm-btn" },
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar cambios',
        cancelButtonText: 'Cancelar'
      });
    
      if (!result.isConfirmed) {
        return;
      }
    }    
  
    // Construir FormData
    const formPayload = new FormData();
    formPayload.append("titulo", formData.postTitle);
    formPayload.append("descripcion", formData.postDescription);

    selectedTags.forEach(tag => formPayload.append("categoria", tag));
  
    filesToDelete.forEach(file =>
      formPayload.append("eliminarArchivo", file.nombre)
    );
  
    uploadedFiles.forEach(file => {
      if (file instanceof File) {
        formPayload.append("archivo", file);
      }
    });

    if (miniatureFile instanceof File) {
      formPayload.append("miniatura", miniatureFile);
    }    
  
    const userId = sessionStorage.getItem("userId");

    for (const [key, value] of formPayload.entries()) {
      console.log(key, value);
    }

    try {
      const endpoint = isEditMode
        ? `${apiUrl}/api/publicaciones/${id}`
        : `${apiUrl}/api/publicaciones/${userId}`;
  
      const response = await fetch(endpoint, {
        method: isEditMode ? "PUT" : "POST",
        body: formPayload,
      });
  
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
  
      await Swal.fire({
        title: "¡Listo!",
        text: isEditMode
          ? 'La publicación se ha actualizado'
          : 'Se ha añadido una nueva publicación',
        icon: 'success',
        background: getCSSVariable('--dark-grey'),
        color: getCSSVariable('--white'),
        customClass: {
          confirmButton: "swal-confirm-btn",
        }
      });
  
      handleClear(false);
      const data = await response.json();
      const postId = data.publicacion._id; // usa el id retornado o el actual en modo edición
      window.location.href = `/detail/${postId}`;
    } catch (err) {
      console.error("Error al enviar publicación:", err);
      setErrors(prev => ({ ...prev, general: err.message }));
    }
  };
  

  const handleClear = async (swal) => {
    // Si no se desea mostrar el SweetAlert, limpiar directamente
    if (!swal) {
      clearForm();
      return;
    }
  
    // Mostrar SweetAlert y esperar confirmación
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
      clearForm();
    }
  };
  
  // Función auxiliar para limpiar el formulario
  const clearForm = () => {
    setFormData({ postTitle: "", postDescription: "" });
    setUploadedFiles([]);
    setInitialFiles([]);
    setMiniatureFile(null);
    setInitialMiniature(null);
    setSelectedTags([]);
    setInitialTags([]);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    if(miniatureInputRef.current) miniatureInputRef.current.value = "";
  };
  

  const fetchCategories = async () => {
    try {
      const response = await fetch('${apiUrl}0/api/categorias');
      const data = await response.json();

      if (Array.isArray(data)) {
        setArrOptions(
          data
            .filter(category => category.nombre !== "Sin categoría")
            .map(category => ({
              label: category.nombre,
              value: category.id,
            }))
        );        
      }
    } catch (error) {
      console.error('Error al obtener las categorías:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/publicaciones/${id}`);
      const data = await res.json();

      const userId = sessionStorage.getItem("userId");

      console.log("Lo que llega: ", data.usuarioId);
      console.log("SessionStorage: ", userId);

      if (!data.usuario || data.usuario._id !== userId) {
        window.location.href = "/home";
        return;
      }

      setFormData({
        postTitle: data.titulo,
        postDescription: data.descripcion,
      });
      setInitialFormData({
        postTitle: data.titulo,
        postDescription: data.descripcion,
      });

      const fakeFiles = data.archivos.map(file =>
        new File([""], file.nombre, { type: "application/octet-stream" })
      );

      setUploadedFiles(fakeFiles);
      setInitialFiles(data.archivos);
      setMiniatureFile(new File([""], data.miniatura.nombre, { type: "image/*" }));
      setInitialMiniature(data.miniatura);
      const categoriasFiltradas = data.categoria.filter(c => c !== "Sin categoría");
      setSelectedTags(categoriasFiltradas);
      setInitialTags(categoriasFiltradas);      
      setFechaModificacion(new Date(data.fecha));
    } catch (err) {
      console.error("Error al cargar publicación:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEditMode) fetchPost();
  }, [id]);


  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const preventDefaults = (e) => e.preventDefault();
    const highlight = () => (dropArea.style.opacity = "0.6");
    const unhighlight = () => (dropArea.style.opacity = "1");
    const handleDrop = (e) => {
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach(event =>
      dropArea.addEventListener(event, preventDefaults)
    );
    ["dragenter", "dragover"].forEach(event =>
      dropArea.addEventListener(event, highlight)
    );
    ["dragleave", "drop"].forEach(event =>
      dropArea.addEventListener(event, unhighlight)
    );
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach(event =>
        dropArea.removeEventListener(event, preventDefaults)
      );
      ["dragenter", "dragover"].forEach(event =>
        dropArea.removeEventListener(event, highlight)
      );
      ["dragleave", "drop"].forEach(event =>
        dropArea.removeEventListener(event, unhighlight)
      );
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, [uploadedFiles]);

  return (
    <div className={styles["post-main-container"]}>
      <section className={styles["left-section"]}>
        <h1>{isEditMode ? "Editar publicación" : "Nueva publicación"}</h1>
        <small>Los campos con el carácter '*' son obligatorios</small>
        {errors.general && <p className={styles["error"]}>{errors.general}</p>}
        <form onSubmit={handleSubmit} onReset={() => handleClear(true)}>
          <InputField
            id="postTitle"
            type="text"
            label="Título (*)"
            name="postTitle"
            placeholder="Título"
            value={formData.postTitle}
            onChange={handleChange}
            explicativeText={errors.postTitle}
            aria-required="true"
          />
          <InputField
            id="postDescription"
            type="textarea"
            label="Descripción (*)"
            name="postDescription"
            placeholder="Descripción"
            value={formData.postDescription}
            onChange={handleChange}
            explicativeText={errors.postDescription}
            aria-required="true"
          />
          <InputField
            id="postFile"
            type="file"
            label="Archivos (*)"
            name="postFile"
            placeholder="Seleccionar archivos"
            onChange={handleFileInput}
            explicativeText={errors.postFile}
            multiple
            ref={fileInputRef}
            aria-required="true"
          />
          <div className={styles["grid-list"]}>
            <ul>
              {uploadedFiles.map((file) => (
                <DeleteableTag
                  key={file.name}
                  file={file}
                  onDelete={() => handleDeleteFile(file.name)}
                />
              ))}
            </ul>
          </div>
          <InputField
            id="postMiniature"
            type="file"
            label="Miniatura (*)"
            name="postMiniature"
            placeholder="Seleccionar archivo"
            onChange={handleFileInput}
            explicativeText={errors.postMiniature}
            ref={miniatureInputRef}
            aria-required="true"
          />
          <div className={styles["grid-list"]}>
            {miniatureFile && (
              <DeleteableTag
              key={miniatureFile.name}
              file={miniatureFile}
              onDelete={() => {
                setMiniatureFile(null);
                setInitialMiniature(null);
              }}
            />            
            )}
          </div>
          <InputField
            id="postCategories"
            type="select"
            label="Categorías"
            name="postCategories"
            placeholder="Categoría"
            onChange={addTag}
            arrOptions={arrOptions}
          />
          <div className={styles["grid-list"]}>
            <ul>
            {selectedTags
            .filter(tag => tag !== "Sin categoría")
            .map((tag) => (
              <DeleteableTag key={tag} tag={tag} onDelete={() => deleteTag(tag)} />
            ))}
            </ul>
          </div>
          <div>
            <Button type="reset" variant="red" label="Limpiar" icon={faRotateLeft} role="submit" />
            <Button type="submit" variant="red" label={isEditMode ? "Actualizar" : "Aceptar"} icon={faCheck} role="submit" />
          </div>
        </form>
      </section>

      <section className={styles["right-section"]}>
        {isEditMode && fechaModificacion && (
          <h1>Última edición: {fechaModificacion.toLocaleDateString()}</h1>
        )}
        <div
          className={styles["droparea"]}
          ref={dropAreaRef}
          onClick={() => fileInputRef.current?.click()}
        >
          <FontAwesomeIcon className={styles["font-icon"]} icon={faCloudArrowUp} />
          <p>También puedes arrastrar aquí tus archivos</p>
          <small>Máximo 10 archivos</small>
        </div>
      </section>
    </div>
  );
}

export default PostForm;