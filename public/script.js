
document.addEventListener('DOMContentLoaded', () => {
    const departmentSelect = document.getElementById('department');
    const locationSelect = document.getElementById('location');
    const artGrid = document.getElementById('artGrid');
    const paginationContainer = document.getElementById('pagination');
    
    let currentPage = 1; 
    const itemsPerPage = 20; 
    let totalItems = 0; 
    let artData = []; 

    const locations = [
        'Africa',
        'United States',
        'Asia',
        'India',
        'Peru',
        'France',
        'Japan',
        'China',
        'Egypt',
        'Spain'
    ];


    // Función departamentos
    async function loadDepartments() {
        try {
            const departmentsResponse = await fetch('/api/departments');
            const departmentData = await departmentsResponse.json();

            const defaultDeptOption = document.createElement('option');
            defaultDeptOption.value = '';
            defaultDeptOption.textContent = 'Seleccione un departamento';
            departmentSelect.appendChild(defaultDeptOption);

            departmentData.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.departmentId;
                option.textContent = dept.displayName;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar los departamentos:', error);
        }
    }

    // Función para llenar las localidades en el select
    function loadLocations() {
        const defaultLocOption = document.createElement('option');
        defaultLocOption.value = '';
        defaultLocOption.textContent = 'Seleccione una localidad';
        locationSelect.appendChild(defaultLocOption);

        locations.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            locationSelect.appendChild(option);
        });
    }

    // Función de búsqueda
    document.getElementById('filterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        currentPage = 1;

        const department = departmentSelect.value;
        const keyword = document.getElementById('keyword').value;
        const location = locationSelect.value;

        const errorMessageDiv = document.getElementById('error-message');
        errorMessageDiv.style.display = 'none'; 

        artGrid.innerHTML = ''; 

        if (department && !keyword && !location) {
            errorMessageDiv.textContent = 'Debe escribir una palabra clave.';
            errorMessageDiv.style.display = 'block'; 
            return; 
        }
        if (location && !keyword && !department) {
            errorMessageDiv.textContent = 'Debe escribir una palabra clave.';
            errorMessageDiv.style.display = 'block'; 
            return; 
        }

        await fetchArt(department, keyword, location);
    });

    async function fetchArt() {
        const department = departmentSelect.value;
        const keyword = document.getElementById('keyword').value.trim();
        const location = locationSelect.value;

        const keywordRegex = /^(?=.*[A-Za-záéíóúÁÉÍÓÚñÑ])[A-Za-záéíóúÁÉÍÓÚñÑ0-9\s]*$/;

        if (keyword && !keywordRegex.test(keyword)) {
            artGrid.innerHTML = '<p>Por favor, ingrese una palabra clave válida (solo letras).</p>';
            paginationContainer.innerHTML = ''; 
            return; 
        }

        if (!keyword && !department && !location) {
            artGrid.innerHTML = '<p>Por favor, ingrese al menos una palabra clave o seleccione un departamento o localidad.</p>';
            paginationContainer.innerHTML = ''; 
            return; 
        }

        let url = 'https://collectionapi.metmuseum.org/public/collection/v1/search?';
        const queryParams = [];

        if (department) {
            queryParams.push(`departmentId=${encodeURIComponent(department)}`);
        }
        if (location) {
            queryParams.push(`geoLocation=${encodeURIComponent(location)}`);
        }
        if (keyword) {
            queryParams.push(`q=${encodeURIComponent(keyword)}`);
        }

        if (queryParams.length > 0) {
            url += queryParams.join('&'); 
        }

        console.log('URL de búsqueda construida:', url); 

        try {
            const response = await fetch(url);
            artData = await response.json();
            
            if (artData && artData.objectIDs && artData.objectIDs.length > 0) {
                totalItems = Math.min(artData.objectIDs.length, 200); 
                artData.objectIDs = artData.objectIDs.slice(0, totalItems); 
                displayArt(); 
                setupPagination(); 
            } else {
                artGrid.innerHTML = '<p>No se encontraron resultados.</p>'; 
                paginationContainer.innerHTML = ''; 
            }
        } catch (error) {
            console.error('Error fetching art:', error);
            artGrid.innerHTML = '<p>Error al cargar los objetos de arte.</p>'; 
            paginationContainer.innerHTML = ''; 
        }
    }

    function displayArt() {
        artGrid.innerHTML = '';
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        
        const currentItems = artData.objectIDs.slice(start, end);
        
        if (currentItems.length > 0) {
            currentItems.forEach(async (objectID) => {
                try {
                    const response = await fetch(`/api/objects/${objectID}`);
                    const obj = await response.json();
    
                    const card = document.createElement('div');
                    card.classList.add('card');
    
                    // Crear la barra de fecha
                    const dateBar = document.createElement('div');
                    dateBar.classList.add('date-bar');
                    dateBar.textContent = `Creado: ${obj.objectDate || 'Fecha no especificada'}`;
                    dateBar.style.display = 'none'; // Ocultar inicialmente
    
                    const imageUrl = obj.primaryImage || obj.primaryImageSmall || 'sinimagen.jpg'; 
                    const image = document.createElement('img');
                    image.src = imageUrl;
                    image.alt = obj.title;
    
                    // Contenido adicional de la tarjeta
                    card.innerHTML += `
                        ${image.outerHTML}  <!-- Añade la imagen a la tarjeta -->
                        <div class="card-title">${obj.title}</div>
                        <div class="card-meta">
                            <p>Cultura: ${obj.culture || 'No especificada'}</p>
                            <p>Dinastía: ${obj.dynasty || 'No especificada'}</p>
                        </div>
                        <p>Departamento: ${obj.department}</p>
                        <p>Artista: ${obj.artistDisplayName || 'No especificado'}</p>
                        ${obj.additionalImages && obj.additionalImages.length > 0 ? '<button class="button" onclick="viewMoreImages(' + obj.objectID + ')">Ver más imágenes</button>' : ''}
                    `;
                    
                    // Añadir la barra de fecha al card
                    card.appendChild(dateBar); // Añade la barra de fecha a la tarjeta
    
                    // Mostrar la barra de fecha al pasar el mouse
                    card.addEventListener('mouseenter', () => {
                        dateBar.style.display = 'block'; // Mostrar la barra
                    });
                    card.addEventListener('mouseleave', () => {
                        dateBar.style.display = 'none'; // Ocultar la barra
                    });
    
                    artGrid.appendChild(card);
                } catch (error) {
                    console.error('Error fetching object details:', error);
                }
            });
        } else {
            artGrid.innerHTML = '<p>No se encontraron resultados.</p>';
        }
    }
    
    
    

    // Función para configurar la paginación
    function setupPagination() {
        paginationContainer.innerHTML = ''; 
        const totalPages = Math.ceil(totalItems / itemsPerPage); 
    
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.innerText = i;
            button.classList.add('page-button');
            button.addEventListener('click', () => {
                currentPage = i;
                displayArt(); 
            });
            paginationContainer.appendChild(button);
        }
    }

    loadDepartments();
    loadLocations();
});

function viewMoreImages(objectID) {
    window.location.href = `/images.html?objectID=${objectID}`;
}


