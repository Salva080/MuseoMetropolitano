const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.static('public'));

// Endpoint para obtener los departamentos
app.get('/api/departments', async (req, res) => {
    try {
        const response = await axios.get('https://collectionapi.metmuseum.org/public/collection/v1/departments');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Error fetching departments' });
    }
});


// Endpoint para búsqueda
app.get('/search', async (req, res) => {
    const { keyword, departmentId, geoLocation } = req.query;

    let url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?';
    const params = [];

    if (departmentId) {
        params.push(`departmentId=${departmentId}`);
    }
    if (keyword) {
        params.push(`q=${keyword}`);
    }
    if (geoLocation) {
        params.push(`geoLocation=${geoLocation}`);
    }

    if (params.length > 0) {
        url += params.join('&');
    }

    console.log('URL de búsqueda en el servidor:', url);

    try {
        const response = await axios.get(url);
        
        // Si no hay objetos, responder con un mensaje
        if (!response.data || response.data.total === 0) {
            return res.status(404).send('No se encontraron objetos.');
        }

        const objects = response.data.objectIDs; // Suponiendo que estamos trabajando con los IDs de los objetos
        const translatedObjectsPromises = objects.map(async (id) => {
            const objResponse = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
            const obj = objResponse.data;

            // Traducir el título y la descripción
            const translatedTitle = await translateText(obj.title || '');
            const translatedDescription = await translateText(obj.description || '');

            return {
                ...obj,
                translatedTitle, // Título traducido
                translatedDescription // Descripción traducida
            };
        });

        const translatedObjects = await Promise.all(translatedObjectsPromises);
        
        res.json(translatedObjects);
    } catch (error) {
        console.error('Error al realizar la búsqueda:', error);
        res.status(500).send('Error en la búsqueda');
    }
});

// Endpoint para obtener un objeto específico
app.get('/api/objects/:objectID', async (req, res) => {
    const { objectID } = req.params;

    try {
        const response = await axios.get(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching object data:', error);
        res.status(500).json({ error: 'Error fetching object data' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
