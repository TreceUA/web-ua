import { useState, useEffect } from "react"; // Añadimos useEffect
import { Link } from "react-router-dom";
import { Button, Category } from '../../Components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft, faCircle, faCircleUp, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import styles from "./Categories.module.css";

const apiUrl = process.env.REACT_APP_API_URL; // URL de la API

function Categories() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetch(`${apiUrl}/api/categorias`)
            .then(response => response.json())
            .then(data => setCategories(data))
            .catch(error => console.error('Error al traer las categorías:', error));
    }, []);

    return (
        <div className={styles["category-main-container"]}>
            <section className={styles["type-section"]}>
                <Button variant="red-rounded" label="3D" to="/home"/>
                <Button variant="red-rounded" label="2D" to="/home"/>
                <Button variant="red-rounded" label="Vídeo" to="/home"/>
                <Button variant="red-rounded" label="Audio" to="/home"/>
                <Button variant="red-rounded" label="Script" to="/home"/>
            </section>
            <h2 className={styles["category-title"]}>Categorías</h2>
            <section className={styles["category-grid"]}>
                {categories.map((category) => (
                    <Category key={category._id} id={category._id} nombre={category.nombre} fotoURL={`${apiUrl}/api/categorias/foto/${category.fotoId}`} />
                ))}
            </section>
            <footer className={styles["category-footer"]}>
                <Button variant="red-rounded" label="Mostrar más +" to="/home"/>
            </footer>
        </div>
    );
}

export default Categories;
