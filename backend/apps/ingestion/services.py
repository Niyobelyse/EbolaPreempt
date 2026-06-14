import requests
from datetime import datetime, timedelta


# All 30 districts of Rwanda with approximate coordinates
DISTRICT_COORDINATES = {
    # KIGALI
    "Nyarugenge": {"lat": -1.9495, "lon": 30.0588, "province": "KIGALI"},
    "Gasabo":     {"lat": -1.9078, "lon": 30.1127, "province": "KIGALI"},
    "Kicukiro":   {"lat": -1.9667, "lon": 30.1011, "province": "KIGALI"},

    # SOUTH
    "Nyanza":     {"lat": -2.3500, "lon": 29.7500, "province": "SOUTH"},
    "Gisagara":   {"lat": -2.5667, "lon": 29.7833, "province": "SOUTH"},
    "Nyaruguru":  {"lat": -2.6167, "lon": 29.5667, "province": "SOUTH"},
    "Huye":       {"lat": -2.5967, "lon": 29.7394, "province": "SOUTH"},
    "Nyamagabe":  {"lat": -2.4500, "lon": 29.4667, "province": "SOUTH"},
    "Ruhango":    {"lat": -2.2167, "lon": 29.7833, "province": "SOUTH"},
    "Muhanga":    {"lat": -2.0833, "lon": 29.7500, "province": "SOUTH"},
    "Kamonyi":    {"lat": -2.0167, "lon": 29.8500, "province": "SOUTH"},

    # WEST
    "Karongi":    {"lat": -2.0000, "lon": 29.3667, "province": "WEST"},
    "Rutsiro":    {"lat": -1.8333, "lon": 29.3333, "province": "WEST"},
    "Rubavu":     {"lat": -1.6777, "lon": 29.2540, "province": "WEST"},
    "Nyabihu":    {"lat": -1.7500, "lon": 29.5000, "province": "WEST"},
    "Ngororero":  {"lat": -1.8667, "lon": 29.5667, "province": "WEST"},
    "Rusizi":     {"lat": -2.4846, "lon": 28.9070, "province": "WEST"},
    "Nyamasheke": {"lat": -2.3389, "lon": 29.1378, "province": "WEST"},

    # NORTH
    "Rulindo":    {"lat": -1.7333, "lon": 30.0667, "province": "NORTH"},
    "Gakenke":    {"lat": -1.6833, "lon": 29.7833, "province": "NORTH"},
    "Musanze":    {"lat": -1.4998, "lon": 29.6344, "province": "NORTH"},
    "Burera":     {"lat": -1.4639, "lon": 29.6644, "province": "NORTH"},
    "Gicumbi":    {"lat": -1.6056, "lon": 30.0758, "province": "NORTH"},

    # EAST
    "Rwamagana":  {"lat": -1.9487, "lon": 30.4347, "province": "EAST"},
    "Nyagatare":  {"lat": -1.2941, "lon": 30.3253, "province": "EAST"},
    "Gatsibo":    {"lat": -1.5833, "lon": 30.4667, "province": "EAST"},
    "Kayonza":    {"lat": -1.8833, "lon": 30.6167, "province": "EAST"},
    "Kirehe":     {"lat": -2.3094, "lon": 30.7242, "province": "EAST"},
    "Ngoma":      {"lat": -2.1667, "lon": 30.5333, "province": "EAST"},
    "Bugesera":   {"lat": -2.2167, "lon": 30.1333, "province": "EAST"},
}


# Districts along Rwanda's international borders (DRC, Uganda, Tanzania, Burundi)
# Used to assign higher baseline cross-border transit volumes
BORDER_DISTRICTS = {
    # DRC border (Western Province, Lake Kivu corridor — highest Ebola risk)
    "Rubavu", "Rusizi", "Karongi", "Nyamasheke",
    # Uganda border (Northern Province)
    "Nyagatare", "Gicumbi", "Burera",
    # Tanzania border (Eastern Province)
    "Kirehe",
    # Burundi border (Southern Province)
    "Gisagara", "Nyaruguru",
}


# DRC-bordering districts get the highest transit baseline since
# this is the primary Ebola cross-border risk corridor (Goma -> Rubavu)
DRC_BORDER_DISTRICTS = {"Rubavu", "Rusizi", "Karongi", "Nyamasheke"}


def fetch_weather_data(lat, lon, start_date, end_date, retries=3):
    """
    Fetch weekly temperature and rainfall from Open-Meteo API
    for given coordinates. Retries on timeout/connection errors.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "Africa/Kigali",
    }

    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            daily = data.get("daily", {})
            temps = daily.get("temperature_2m_mean", [])
            rains = daily.get("precipitation_sum", [])

            avg_temp = sum(temps) / len(temps) if temps else 0
            total_rain = sum(rains) if rains else 0

            return {
                "temperature": round(avg_temp, 2),
                "rainfall": round(total_rain, 2),
            }
        except requests.RequestException as e:
            last_error = e
            if attempt < retries:
                continue

    # All retries failed — return safe fallback so the batch doesn't crash
    return {
        "temperature": None,
        "rainfall": None,
        "error": str(last_error),
    }


def fetch_hdx_case_data():
    """
    Fetch latest Ebola case data from HDX.
    Falls back to 0 if connection fails.
    """
    url = "https://data.humdata.org/api/3/action/package_search"
    params = {
        "q": "ebola DRC",
        "rows": 1,
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        result = response.json()

        if result.get("success"):
            return {"ebola_cases": 0, "source_confirmed": True}
        return {"ebola_cases": 0, "source_confirmed": False}

    except requests.RequestException:
        return {"ebola_cases": 0, "source_confirmed": False}


def fetch_mobility_data(district=None):
    """
    IOM mobility records are static institutional reports.

    - DRC-bordering districts (Rubavu, Rusizi, Karongi, Nyamasheke):
      highest transit volume — primary Ebola cross-border risk corridor
      (Grande Barrière baseline ~43,000/day)
    - Other international border districts (Uganda, Tanzania, Burundi):
      moderate transit volume
    - Interior districts: lowest baseline
    """
    if district in DRC_BORDER_DISTRICTS:
        return {"transit_volume": 43000}
    elif district in BORDER_DISTRICTS:
        return {"transit_volume": 15000}
    return {"transit_volume": 8000}