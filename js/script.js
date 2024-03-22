var monIcone = L.icon({
    iconUrl: 'assets/images/pointer.png',
    iconSize: [45, 50],
    iconAnchor: [22, 50],
    popupAnchor: [-3, -36]
});

var mymap = L.map('mapid').setView([-21.5, 165.5], 8);

function addTileLayer() {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(mymap);
}

addTileLayer();

var bornesData = [];

$.getJSON('data/bornes-caledonie.json', function(data) {
    bornesData = data;
    addMarkersToMap(bornesData);
});

function openSidebar(details) {
    document.getElementById("sidebar").style.width = "250px";
    document.getElementById("borneDetails").innerHTML = details;
}

function closeSidebar() {
    document.getElementById("sidebar").style.width = "0";
}

function generateDetailsHTML(borne) {
    return `
        <div class="detail">
            <span class="title">Commune:</span>
            <span class="value">${borne.commune}</span>
        </div>
        <div class="detail">
            <span class="title">Nom commercial:</span>
            <span class="value">${borne.nom_commercial}</span>
        </div>
        <div class="detail">
            <span class="title">Nom aménageur:</span>
            <span class="value">${borne.nom_amenageur}</span>
        </div>
        <div class="detail">
            <span class="title">Nom opérateur:</span>
            <span class="value">${borne.nom_operateur}</span>
        </div>
        <div class="detail">
            <span class="title">Nom station:</span>
            <span class="value">${borne.nom_station}</span>
        </div>
        <div class="detail">
            <span class="title">Nombre points de charge:</span>
            <span class="value">${borne.nb_points_charge}</span>
        </div>
        <div class="detail">
            <span class="title">Observation:</span>
            <span class="value">${borne.observations_station ? borne.observations_station : 'N/A'}</span>
        </div>
        <div class="detail">
            <span class="title">Adresse station:</span>
            <span class="value">${borne.adresse_station}</span>
        </div>
        <div class="detail">
            <span class="title">Code postal:</span>
            <span class="value">${borne.code_postal}</span>
        </div>
    `;
}


function createMarker(borne) {
    var lat = borne.geo_point_2d.lat;
    var lng = borne.geo_point_2d.lon;
    var details = generateDetailsHTML(borne);

    var marker = L.marker([lat, lng], {icon: monIcone}).addTo(mymap);
    marker.bindPopup("<b>" + borne.nom_station + "</b>");

    marker.on('click', function() {
        openSidebar(details);
    });
}

function addMarkersToMap(bornes) {
    mymap.eachLayer(function(layer) {
        if (!!layer.toGeoJSON) {
            mymap.removeLayer(layer);
        }
    });
    addTileLayer();

    bornes.forEach(createMarker);
}

function searchBornes() {
    const cityInput = document.getElementById('searchCity').value.toLowerCase();
    const postalCodeInput = document.getElementById('searchPostalCode').value.toLowerCase();
    const adresseInput = document.getElementById('searchAdresse').value.toLowerCase();
    const amenageurInput = document.getElementById('searchAmenageur').value.toLowerCase();

    const filteredData = bornesData.filter(borne => {
     
        const commune = borne.commune.toLowerCase();
        const codePostal = borne.code_postal.toString().toLowerCase();
        const adresse = borne.adresse_station.toLowerCase();
        const amenageur = borne.nom_amenageur.toLowerCase();

        return (cityInput === '' || commune.includes(cityInput)) &&
               (postalCodeInput === '' || codePostal.includes(postalCodeInput)) &&
               (adresseInput === '' || adresse.includes(adresseInput)) &&
               (amenageurInput === '' || amenageur.includes(amenageurInput));
    });

    if (filteredData.length > 0) {
        addMarkersToMap(filteredData);
        const bounds = L.latLngBounds(filteredData.map(borne => [borne.geo_point_2d.lat, borne.geo_point_2d.lon]));
        mymap.fitBounds(bounds);
    } else {
        alert("Aucun résultat trouvé pour votre recherche.");
        mymap.setView([-21.5, 165.5], 8);
    }
}


