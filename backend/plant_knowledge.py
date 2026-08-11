"""Base de conocimiento agronómico por cultivo y enfermedad (PlantVillage + Colombia)."""
from __future__ import annotations

import re

# --- Plantas ---
PLANT_NAMES_ES: dict[str, tuple[str, str, str]] = {
    "Apple": ("Manzana", "Malus domestica", "Frutal"),
    "Blueberry": ("Arándano", "Vaccinium corymbosum", "Frutal"),
    "Cherry_(including_sour)": ("Cerezo", "Prunus avium", "Frutal"),
    "Corn_(maize)": ("Maíz", "Zea mays", "Cereal"),
    "Grape": ("Uva", "Vitis vinifera", "Frutal"),
    "Orange": ("Naranja / Cítrico", "Citrus × sinensis", "Frutal"),
    "Peach": ("Durazno", "Prunus persica", "Frutal"),
    "Pepper,_bell": ("Pimentón", "Capsicum annuum", "Hortícola"),
    "Potato": ("Papa", "Solanum tuberosum", "Tubérculo"),
    "Raspberry": ("Frambuesa", "Rubus idaeus", "Frutal"),
    "Soybean": ("Soya", "Glycine max", "Leguminosa"),
    "Squash": ("Calabaza", "Cucurbita pepo", "Hortícola"),
    "Strawberry": ("Fresa", "Fragaria × ananassa", "Frutal"),
    "Tomato": ("Tomate", "Solanum lycopersicum", "Hortícola"),
    # --- Cultivos agregados (ampliación Colombia) ---
    "Yuca": ("Yuca", "Manihot esculenta", "Tubérculo"),
    "Cafe": ("Café", "Coffea arabica", "Perenne"),
    "Cacao": ("Cacao", "Theobroma cacao", "Perenne"),
    "Platano": ("Plátano/Banano", "Musa spp.", "Frutal"),
    "Banano": ("Plátano/Banano", "Musa spp.", "Frutal"),
    "Mango": ("Mango", "Mangifera indica", "Frutal"),
    "Arroz": ("Arroz", "Oryza sativa", "Cereal"),
    "Citricos": ("Cítricos", "Citrus spp.", "Frutal"),
    "Algodon": ("Algodón", "Gossypium hirsutum", "Fibra"),
    "CanaDeAzucar": ("Caña de azúcar", "Saccharum officinarum", "Agroindustrial"),
    "Guayaba": ("Guayaba", "Psidium guajava", "Frutal"),
    "Frijol": ("Fríjol", "Phaseolus vulgaris", "Leguminosa"),
    "Papaya": ("Papaya", "Carica papaya", "Frutal"),
}

# --- Enfermedades / estados (clave normalizada → español) ---
CONDITION_ES: dict[str, str] = {
    "healthy": "Estado saludable — sin síntomas visibles de enfermedad o plaga",
    "Apple_scab": "Sarna del manzano (Venturia inaequalis)",
    "Black_rot": "Pudrición negra (hongo)",
    "Cedar_apple_rust": "Roya del cedro-manzano (Gymnosporangium)",
    "Powdery_mildew": "Oídio (hongo)",
    "Cercospora_leaf_spot Gray_leaf_spot": "Mancha foliar por Cercospora",
    "Common_rust_": "Roya común del maíz (Puccinia sorghi)",
    "Northern_Leaf_Blight": "Tizón foliar norteño del maíz",
    "Esca_(Black_Measles)": "Esca / measles negro de la vid",
    "Leaf_blight_(Isariopsis_Leaf_Spot)": "Tizón foliar / mancha Isariopsis",
    "Haunglongbing_(Citrus_greening)": "Huanglongbing / enverdecimiento de cítricos",
    "Bacterial_spot": "Mancha bacteriana (Xanthomonas)",
    "Early_blight": "Tizón temprano (Alternaria solani)",
    "Late_blight": "Tizón tardío (Phytophthora infestans)",
    "Leaf_scorch": "Quemadura foliar",
    "Leaf_Mold": "Moho foliar (Passalora fulva)",
    "Septoria_leaf_spot": "Mancha foliar por Septoria",
    "Spider_mites Two-spotted_spider_mite": "Daño por ácaro de dos manchas (Tetranychus urticae)",
    "Target_Spot": "Mancha anillada (Target spot)",
    "Tomato_mosaic_virus": "Virus del mosaico del tomate",
    "Tomato_Yellow_Leaf_Curl_Virus": "Virus del rizado amarillo de las hojas del tomate",
    # --- Condiciones nuevas (cultivos ampliación Colombia) ---
    "Sana": "Estado saludable — sin síntomas visibles de plaga o enfermedad",
    "Bacteriosis": "Bacteriosis / añublo bacteriano — enfermedad bacteriana del cultivo",
    "RayadoPardo": "Virus del rayado pardo (Cassava Brown Streak Virus) — necrosis interna de la raíz",
    "AcaroVerde": "Ácaro verde (Mononychellus tanajoa) — plaga que raspa y deseca el follaje",
    "MosaicoViral": "Virus del mosaico (transmitido por mosca blanca) — moteado y deformación foliar",
    "Roya": "Roya — hongo foliar (género según cultivo: Hemileia, Puccinia, etc.)",
    "Phoma": "Mancha de hierro / Phoma — hongo foliar",
    "Minador": "Minador de la hoja — plaga (larva que excava galerías en la hoja)",
    "Cercospora": "Mancha de Cercospora — hongo foliar",
    "MazorcaNegra": "Mazorca negra (Phytophthora spp.) — pudrición de la mazorca de cacao",
    "Moniliasis": "Moniliasis (Moniliophthora roreri) — pudrición acuosa de la mazorca de cacao",
    "Sigatoka": "Sigatoka — mancha foliar fúngica del plátano/banano",
    "Cordana": "Mancha de Cordana — hongo foliar del plátano/banano",
    "Pestalotiopsis": "Mancha por Pestalotiopsis — hongo foliar",
    "Antracnosis": "Antracnosis (Colletotrichum spp.) — manchas necróticas en hoja o fruto",
    "CancroBacteriano": "Cancro bacteriano — lesiones necróticas causadas por bacteria",
    "PicudoCortador": "Picudo cortador — plaga (insecto que corta brotes y hojas)",
    "Marchitez": "Muerte descendente / marchitez — hongo que seca ramas progresivamente",
    "MoscaAgalla": "Mosca de las agallas — plaga que forma agallas en hojas y brotes",
    "MildiuPolvoso": "Mildiu polvoso / oídio — hongo que cubre la hoja de polvo blanco",
    "FumaginaNegra": "Fumagina — hongo negro superficial asociado a insectos chupadores",
    "ManchaParda": "Mancha parda — hongo foliar",
    "Carbon": "Carbón — hongo que ennegrece la panícula o el grano",
    "Hispa": "Hispa del arroz — plaga (coleóptero que raspa la hoja)",
    "Tungro": "Virus del tungro del arroz — transmitido por saltahojas; amarillamiento y enanismo",
    "ManchaNegra": "Mancha negra de los cítricos — hongo (Phyllosticta citricarpa)",
    "Verdeamiento": "Enverdecimiento / HLB (Huanglongbing) — bacteria cuarentenaria transmitida por psílido",
    "Melanosis": "Melanosis — hongo que produce lesiones corchosas en fruto y hoja",
    "Sarna": "Sarna / roña — hongo que produce lesiones corchosas en la superficie",
    "HojaEnferma": "Hoja con signos de enfermedad — patógeno específico por confirmar en campo",
    "PlantaEnferma": "Planta con signos de enfermedad — patógeno específico por confirmar en campo",
    "Mosaico": "Mosaico — virus transmitido por áfidos; moteado y deformación foliar",
    "PudricionRoja": "Pudrición roja del tallo — hongo (Colletotrichum falcatum)",
    "Amarillamiento": "Síndrome del amarillamiento — asociado a fitoplasma/virus, requiere confirmación",
    "Mancha": "Mancha foliar — hongo, especie por confirmar",
    "Momificacion": "Momificación del fruto — hongo que seca y momifica el fruto",
    "PudricionEstilar": "Pudrición del extremo estilar — hongo que pudre el fruto desde la flor",
    "ManchaAngular": "Mancha angular de la hoja — hongo (Pseudocercospora griseola)",
    "ManchaBacteriana": "Mancha bacteriana — bacteria que produce lesiones foliares",
    "Rizado": "Rizado de la hoja — virus transmitido por mosca blanca",
    "ManchaAnular": "Mancha anular — virus que produce anillos necróticos en hoja y fruto",
    "AcaroRojo": "Ácaro rojo del café — plaga que causa bronceado y caída prematura de las hojas",
    "Fitoftora": "Fitóftora (Phytophthora spp.) — hongo/oomiceto que pudre raíz y fruto",
    "Blast": "Quemazón / Blast del arroz (Magnaporthe oryzae) — hongo que quema hojas y panícula, muy destructivo",
    "RizadoViral": "Virus del rizado de la hoja del algodón — transmitido por mosca blanca",
}

CLASS_KIND_OVERRIDES: dict[str, str] = {
    "Yuca___Sana": "healthy",
    "Yuca___Bacteriosis": "bacterial",
    "Yuca___RayadoPardo": "viral",
    "Yuca___AcaroVerde": "pest",
    "Yuca___MosaicoViral": "viral",
    "Cafe___Sana": "healthy",
    "Cafe___Roya": "fungal",
    "Cafe___Phoma": "fungal",
    "Cafe___Minador": "pest",
    "Cafe___Cercospora": "fungal",
    "Cafe___AcaroRojo": "pest",
    "Cacao___Sana": "healthy",
    "Cacao___MazorcaNegra": "fungal",
    "Cacao___Moniliasis": "fungal",
    "Platano___Sana": "healthy",
    "Platano___Sigatoka": "fungal",
    "Platano___Cordana": "fungal",
    "Platano___Pestalotiopsis": "fungal",
    "Banano___Sana": "healthy",
    "Banano___Sigatoka": "fungal",
    "Banano___Cordana": "fungal",
    "Banano___Pestalotiopsis": "fungal",
    "Mango___Sana": "healthy",
    "Mango___Antracnosis": "fungal",
    "Mango___CancroBacteriano": "bacterial",
    "Mango___PicudoCortador": "pest",
    "Mango___Marchitez": "fungal",
    "Mango___MoscaAgalla": "pest",
    "Mango___MildiuPolvoso": "fungal",
    "Mango___FumaginaNegra": "fungal",
    "Arroz___Sana": "healthy",
    "Arroz___Bacteriosis": "bacterial",
    "Arroz___ManchaParda": "fungal",
    "Arroz___Carbon": "fungal",
    "Arroz___Hispa": "pest",
    "Arroz___Tungro": "viral",
    "Arroz___Blast": "fungal",
    "Citricos___Sana": "healthy",
    "Citricos___ManchaNegra": "fungal",
    "Citricos___Cancro": "bacterial",
    "Citricos___Verdeamiento": "citrus",
    "Citricos___Melanosis": "fungal",
    "Citricos___Sarna": "fungal",
    "Algodon___Sana": "healthy",
    "Algodon___HojaEnferma": "fungal",
    "Algodon___PlantaEnferma": "fungal",
    "Algodon___RizadoViral": "viral",
    "Algodon___Bacteriosis": "bacterial",
    "Algodon___Marchitez": "fungal",
    "CanaDeAzucar___Sana": "healthy",
    "CanaDeAzucar___Mosaico": "viral",
    "CanaDeAzucar___PudricionRoja": "fungal",
    "CanaDeAzucar___Roya": "fungal",
    "CanaDeAzucar___Amarillamiento": "viral",
    "Guayaba___Sana": "healthy",
    "Guayaba___Cancro": "fungal",
    "Guayaba___Mancha": "fungal",
    "Guayaba___Momificacion": "fungal",
    "Guayaba___Roya": "fungal",
    "Guayaba___Antracnosis": "fungal",
    "Guayaba___Sarna": "fungal",
    "Guayaba___PudricionEstilar": "fungal",
    "Guayaba___PudricionFitoftora": "fungal",
    "Guayaba___PudricionFitoftora": "fungal",
    "Frijol___Sana": "healthy",
    "Frijol___Roya": "fungal",
    "Frijol___ManchaAngular": "fungal",
    "Papaya___Sana": "healthy",
    "Papaya___Antracnosis": "fungal",
    "Papaya___ManchaBacteriana": "bacterial",
    "Papaya___Rizado": "viral",
    "Papaya___ManchaAnular": "viral",
}

DISEASE_TEMPLATES: dict[str, dict] = {
    "fungal": {
        "treatment": [
            "Corta y elimina las hojas o frutos que ya tengan la enfermedad, para que no contagien al resto de la planta",
            "Aplica un fungicida autorizado por el ICA (por ejemplo a base de cobre o mancozeb), siguiendo las instrucciones de la etiqueta",
            "Deja más espacio entre las plantas y poda un poco para que circule mejor el aire",
            "Evita mojar las hojas al regar (riego por aspersión) en las horas de más humedad, como muy temprano en la mañana",
        ],
        "causes": [
            "Humedad muy alta (más del 80%) junto con lluvias seguidas",
            "Rocío durante la noche y poca circulación de aire entre las hojas",
            "Restos de plantas enfermas de cosechas anteriores que quedaron en el suelo",
            "Temperaturas templadas, que son las que más favorecen a este tipo de hongos",
        ],
        "prevention": [
            "Si existen variedades resistentes a esta enfermedad, prefiérelas para la próxima siembra",
            "Alterna este cultivo con otros distintos en el mismo terreno (rotación de cultivos)",
            "Limpia y desinfecta las herramientas antes de pasar de una planta a otra",
            "Revisa el cultivo una vez por semana, sobre todo en época de lluvias",
        ],
    },
    "bacterial": {
        "treatment": [
            "Elimina las plantas que estén muy afectadas, para que no sigan contagiando a las demás",
            "Aplica un producto a base de cobre autorizado por el ICA, siguiendo la etiqueta",
            "No trabajes en el cultivo cuando las hojas estén mojadas, porque así se dispersa más fácil la bacteria",
            "Usa siempre semilla o material de siembra certificado, garantizado libre de esta bacteria",
        ],
        "causes": [
            "El agua de riego o de lluvia salpica tierra contaminada hacia las hojas",
            "Heridas en la planta por granizo o por el uso de herramientas",
            "Semilla o material de siembra que ya venía infectado",
            "Clima cálido y húmedo, que favorece a las bacterias",
        ],
        "prevention": [
            "Siembra solo con material sano y de buena procedencia",
            "Riega directamente al suelo en vez de mojar las hojas",
            "Alterna este cultivo con otros en el mismo terreno",
            "Limpia bien las herramientas entre planta y planta",
        ],
    },
    "viral": {
        "treatment": [
            "No existe una cura para las enfermedades virales: lo que debes hacer es eliminar las plantas enfermas para que no sigan contagiando",
            "Controla el insecto que transmite el virus (mosca blanca, pulgón u otro según el cultivo) — es la verdadera fuente del problema",
            "Para la próxima siembra, usa semilla o material vegetal certificado, garantizado libre de virus",
            "Desinfecta tus herramientas con una solución de cloro entre planta y planta",
        ],
        "causes": [
            "El virus se transmite principalmente por insectos (mosca blanca, pulgones, saltahojas, según el cultivo)",
            "Uso de material de siembra que ya venía infectado desde el vivero o de la finca",
            "Contacto directo con plantas que ya tienen la enfermedad",
            "En la mayoría de los casos el virus no viaja por la semilla que da fruto, solo por el material de siembra vegetativo (estacas, esquejes)",
        ],
        "prevention": [
            "Prefiere variedades tolerantes a este virus, si existen",
            "Usa mallas para evitar que los insectos transmisores entren al cultivo",
            "Haz control frecuente de los insectos que transmiten la enfermedad",
        ],
    },
    "pest": {
        "treatment": [
            "Confirma con una lupa que realmente es esta plaga (busca huevos, larvas o el insecto adulto)",
            "Si la plaga apenas está empezando, puedes usar jabón potásico o aceite agrícola, que son más suaves",
            "Si la infestación ya es fuerte, aplica un insecticida o acaricida autorizado por el ICA, siguiendo la etiqueta",
            "Si tienes acceso a ellos, libera o favorece los enemigos naturales de esta plaga (otros insectos que se la comen)",
        ],
        "causes": [
            "Falta de diversidad de plantas e insectos alrededor del cultivo",
            "Plantas debilitadas por falta de agua o de nutrientes",
            "Época seca o clima que favorece a este insecto en particular",
            "Uso previo de insecticidas fuertes que mataron también a los enemigos naturales de la plaga",
        ],
        "prevention": [
            "Revisa el cultivo regularmente con trampas para detectar la plaga a tiempo",
            "Siembra plantas que atraigan a los enemigos naturales de esta plaga",
            "Mantén un riego y una nutrición adecuados para que la planta esté fuerte",
        ],
    },
    "healthy": {
        "treatment": [
            "Sigue con las buenas prácticas que ya estás aplicando",
            "Revisa el cultivo de forma preventiva cada 7 a 10 días, aunque no veas nada raro",
            "Anota el estado del cultivo cada vez que lo revises, para llevar un registro en el tiempo",
        ],
        "causes": [],
        "prevention": [
            "Asegúrate de que el riego y el drenaje sean los adecuados",
            "Fertiliza según lo que indique un análisis de suelo",
            "Mantén limpias las herramientas y el material de siembra",
            "Alterna cultivos en el mismo terreno cuando sea posible",
        ],
    },
    "citrus": {
        "treatment": [
            "Repórtalo al ICA o a la autoridad agrícola de tu zona — es una enfermedad de control obligatorio en Colombia",
            "Los árboles muy afectados deben eliminarse siguiendo el protocolo oficial",
            "Controla estrictamente el insecto que transmite la enfermedad (el psílido asiático de los cítricos)",
            "No traigas ni trasplantes material vegetal desde zonas donde ya se haya reportado esta enfermedad",
        ],
        "causes": [
            "Una bacteria transmitida por un insecto llamado psílido asiático de los cítricos",
            "Material de siembra que ya venía infectado",
            "Cercanía a huertos de cítricos que ya tienen la enfermedad",
        ],
        "prevention": [
            "Usa siempre plantines certificados y de buena procedencia",
            "Vigila la presencia del psílido con trampas",
            "Usa mallas protectoras en los viveros",
        ],
    },
}


def normalize_class_name(class_name: str) -> tuple[str, str, str, str, str, str, str]:
    """Parsea Tomato___Late_blight en metadatos agronómicos."""
    if "___" in class_name:
        plant_part, cond_part = class_name.split("___", 1)
    else:
        plant_part, cond_part = class_name, "healthy"

    plant_key = plant_part.strip()
    cond_key = cond_part.strip()

    if plant_key in PLANT_NAMES_ES:
        plant_es, scientific, category = PLANT_NAMES_ES[plant_key]
    else:
        plant_es = plant_key.replace("_", " ").replace(",", "").replace("(including sour)", "").strip()
        scientific = ""
        category = "Cultivo"

    cond_es = CONDITION_ES.get(cond_key)
    if not cond_es:
        cond_es = cond_key.replace("_", " ").replace("  ", " ").strip()

    override_key = f"{plant_key}___{cond_key}"
    kind = CLASS_KIND_OVERRIDES.get(override_key)
    if kind is None:
        kind = classify_condition(cond_key, cond_es)

    return plant_key, plant_es, scientific, category, cond_key, cond_es, kind


def classify_condition(cond_key: str, cond_es: str) -> str:
    """Heurística de respaldo por palabras clave (inglés + español)."""
    lower = (cond_key + " " + cond_es).lower()

    if "healthy" in lower or "sana" in lower or "sano" in lower or cond_key.lower() in ("healthy", "sana", "sano"):
        return "healthy"
    if any(x in lower for x in ("mite", "spider", "ácaro", "acaro", "picudo", "mosca", "minador", "hispa", "gusano", "chinche", "weevil")):
        return "pest"
    if any(x in lower for x in ("virus", "mosaic", "mosaico", "curl", "rizado", "rayado", "streak", "anular", "tungro")):
        return "viral"
    if any(x in lower for x in ("bacterial", "bacteriana", "bacteriosis")):
        return "bacterial"
    if "huanglongbing" in lower or "greening" in lower or "verdeamiento" in lower:
        return "citrus"
    if any(x in lower for x in (
        "blight", "rust", "rot", "mildew", "spot", "scab", "esca", "mold", "scorch",
        "roya", "mancha", "moho", "tizon", "tizón", "sarna", "pudricion", "pudrición",
        "antracnosis", "mildiu", "fumagina", "momificacion", "momificación", "carbon",
        "carbón", "cancro", "marchitez",
    )):
        return "fungal"
    return "fungal"


def colombia_regions(category: str, plant_es: str) -> list[str]:
    mapping = {
        "Tomate": ["Boyacá", "Cundinamarca", "Antioquia", "Santander", "Nariño"],
        "Papa": ["Boyacá", "Nariño", "Cundinamarca", "Antioquia"],
        "Maíz": ["Huila", "Tolima", "Meta", "Córdoba", "Cundinamarca"],
        "Naranja / Cítrico": ["Meta", "Tolima", "Valle del Cauca", "Atlántico"],
        "Café": ["Eje Cafetero", "Huila", "Nariño"],
        "Yuca": ["Córdoba", "Sucre", "Bolívar", "Cauca", "Magdalena"],
        "Cacao": ["Santander", "Arauca", "Huila", "Tumaco (Nariño)", "Antioquia"],
        "Plátano/Banano": ["Urabá (Antioquia)", "Magdalena", "Quindío", "Valle del Cauca"],
        "Mango": ["Tolima", "Cundinamarca", "Magdalena", "Cesar"],
        "Arroz": ["Tolima", "Huila", "Casanare", "Meta", "Córdoba"],
        "Cítricos": ["Meta", "Tolima", "Valle del Cauca", "Atlántico"],
        "Algodón": ["Tolima", "Córdoba", "Cesar", "Valle del Cauca"],
        "Caña de azúcar": ["Valle del Cauca", "Cauca", "Risaralda"],
        "Guayaba": ["Santander (Vélez)", "Meta", "Cundinamarca"],
        "Fríjol": ["Antioquia", "Huila", "Santander", "Nariño"],
        "Papaya": ["Meta", "Córdoba", "Cundinamarca", "Santander"],
    }
    return mapping.get(plant_es, ["Altiplano cundiboyacense", "Eje Cafetero", "Valle del Cauca", "Santander", "Antioquia"])


def season_for(kind: str, plant_es: str) -> str:
    if kind == "healthy":
        return f"Monitoreo continuo del {plant_es.lower()}; siembra según calendario regional ICA"
    if kind in ("fungal", "bacterial"):
        return "Mayor riesgo en lluvias Andinas: marzo–junio y septiembre–diciembre"
    if kind == "viral":
        return "Vectores activos en época seca-cálida y en invernaderos todo el año"
    if kind == "pest":
        return "Picos de plaga en transición seca-lluviosa; monitoreo quincenal"
    return "Consultar calendario fitosanitario del municipio"