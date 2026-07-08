let members = [];
let currentLang = "ES";
let root;
let polygonSeries;

const activeColor = am5.color(0xB55434);
const hoverColor = am5.color(0xF16B00);
const inactiveColor = am5.color(0xE6E6E6);

const labels = {
  ES: {
    select: "Seleccione un país",
    empty: "Seleccione un país en el mapa.",
    visit: "Visitar institución",
    search: "Buscar institución o país",
    noResults: "No se encontraron resultados."
  },
  EN: {
    select: "Select a country",
    empty: "Select a country on the map.",
    visit: "Visit institution",
    search: "Search institution or country",
    noResults: "No results found."
  },
  FR: {
    select: "Sélectionnez un pays",
    empty: "Sélectionnez un pays sur la carte.",
    visit: "Visiter l’institution",
    search: "Rechercher une institution ou un pays",
    noResults: "Aucun résultat trouvé."
  },
  PT: {
    select: "Selecione um país",
    empty: "Selecione um país no mapa.",
    visit: "Visitar instituição",
    search: "Buscar instituição ou país",
    noResults: "Nenhum resultado encontrado."
  }
};

function getCountryName(item) {
  return item[`country${currentLang}`] || item.countryES || "";
}

function getDescription(item) {
  return item[`description${currentLang}`] || item.descriptionES || "";
}

function renderPanel(countryCode) {
  const list = members.filter(item => item.countryCode === countryCode);

  const panelTitle = document.getElementById("panelTitle");
  const content = document.getElementById("content");

  if (!list.length) {
    panelTitle.textContent = labels[currentLang].select;
    content.textContent = labels[currentLang].empty;
    return;
  }

  panelTitle.textContent = getCountryName(list[0]);

  content.innerHTML = list.map(item => `
    <div class="card">
      ${item.logo ? `<img src="${item.logo}" alt="${item.institutionName}">` : ""}
      <h3>${item.institutionName}</h3>
      <p>${getDescription(item)}</p>
      ${item.website ? `<a href="${item.website}" target="_blank">${labels[currentLang].visit}</a>` : ""}
    </div>
  `).join("");
}

function renderSearch(query) {
  const content = document.getElementById("content");
  const panelTitle = document.getElementById("panelTitle");

  const q = query.toLowerCase().trim();

  if (!q) {
    panelTitle.textContent = labels[currentLang].select;
    content.textContent = labels[currentLang].empty;
    return;
  }

  const results = members.filter(item =>
    item.institutionName.toLowerCase().includes(q) ||
    getCountryName(item).toLowerCase().includes(q) ||
    getDescription(item).toLowerCase().includes(q)
  );

  panelTitle.textContent = "Resultados";

  if (!results.length) {
    content.textContent = labels[currentLang].noResults;
    return;
  }

  content.innerHTML = results.map(item => `
    <div class="card">
      ${item.logo ? `<img src="${item.logo}" alt="${item.institutionName}">` : ""}
      <h3>${item.institutionName}</h3>
      <p><strong>${getCountryName(item)}</strong></p>
      <p>${getDescription(item)}</p>
      ${item.website ? `<a href="${item.website}" target="_blank">${labels[currentLang].visit}</a>` : ""}
    </div>
  `).join("");
}

function initMap() {
  root = am5.Root.new("map");
  root.setThemes([am5themes_Animated.new(root)]);

  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",
      panY: "translateY",
      projection: am5map.geoMercator()
    })
  );

  polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ["AQ"]
    })
  );

  const activeCountries = [...new Set(members.map(item => item.countryCode))];

  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",
    interactive: true,
    fill: inactiveColor,
    stroke: am5.color(0xffffff),
    strokeWidth: 0.5
  });

  polygonSeries.mapPolygons.template.adapters.add("fill", function(fill, target) {
    const id = target.dataItem?.dataContext?.id;
    return activeCountries.includes(id) ? activeColor : inactiveColor;
  });

  polygonSeries.mapPolygons.template.states.create("hover", {
    fill: hoverColor
  });

  polygonSeries.mapPolygons.template.events.on("click", function(ev) {
    const countryCode = ev.target.dataItem.dataContext.id;
    renderPanel(countryCode);
  });

  chart.set("zoomControl", am5map.ZoomControl.new(root, {}));
}

Papa.parse("members.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    members = results.data.filter(item => item.active === "TRUE" || item.active === true || item.active === "true");
    initMap();
  }
});

document.getElementById("language").addEventListener("change", function(e) {
  currentLang = e.target.value;
  document.getElementById("search").placeholder = labels[currentLang].search;
  document.getElementById("panelTitle").textContent = labels[currentLang].select;
  document.getElementById("content").textContent = labels[currentLang].empty;
});

document.getElementById("search").addEventListener("input", function(e) {
  renderSearch(e.target.value);
});
