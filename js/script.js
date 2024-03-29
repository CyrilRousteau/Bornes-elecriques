

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
    const searchInput = document.getElementById('searchInput').value.toLowerCase();

    const filteredData = bornesData.filter(borne => {
        const commune = borne.commune.toLowerCase();
        const codePostal = borne.code_postal.toString().toLowerCase();
        const adresse = borne.adresse_station.toLowerCase();
        const amenageur = borne.nom_amenageur.toLowerCase();

        return commune.includes(searchInput) ||
               codePostal.includes(searchInput) ||
               adresse.includes(searchInput) ||
               amenageur.includes(searchInput);
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




function geoFindMe() {

    const status = document.querySelector("#status");
    const mapLink = document.querySelector("#map-link");
  
    mapLink.href = "";
    mapLink.textContent = "";
  
    function success(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
    
        let bornesGeoShape = bornesData.map(element => element.geo_shape);
        var bornesGeoJSON = L.geoJson({ "type": "FeatureCollection", "features": bornesGeoShape });
    
        var nearest = leafletKnn(bornesGeoJSON).nearest(L.latLng(latitude, longitude), 1);
    
        if (nearest && nearest.length > 0) {
            const closestLocation = nearest[0];
            const closestLatLng = L.latLng(closestLocation.lat, closestLocation.lon);
    
            const closestBorneDetails = bornesData.find(borne => borne.geo_point_2d.lat === closestLocation.lat && borne.geo_point_2d.lon === closestLocation.lon);
    
            if (closestBorneDetails) {
                const marker = L.marker(closestLatLng).addTo(mymap)
                                 .bindPopup(`<b>${closestBorneDetails.nom_station}</b>`);
                marker.on('click', function() {
                    openSidebar(generateDetailsHTML(closestBorneDetails));
                }).openPopup();
    
                // Affichage de l'itinéraire avec Leaflet Routing Machine
                L.Routing.control({
                    waypoints: [
                        L.latLng(latitude, longitude),
                        closestLatLng
                    ],
                    routeWhileDragging: true,
                    geocoder: L.Control.Geocoder.nominatim()
                }).addTo(mymap);
            } else {
                L.marker(closestLatLng).addTo(mymap)
                    .bindPopup("Borne la plus proche").openPopup();
            }
    
            mymap.setView(closestLatLng, 14);
        } else {
            console.log("Aucune borne trouvée à proximité.");
        }
    
        status.textContent = "";
        mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
        mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
    }
    
    
    function error() {
      status.textContent = "Unable to retrieve your location";
    }
  
    if (!navigator.geolocation) {
      status.textContent = "Geolocation is not supported by your browser";
    } else {
      status.textContent = "Locating…";
      navigator.geolocation.getCurrentPosition(success, error);
    }
  }
  
  document.querySelector("#find-me").addEventListener("click", geoFindMe);


