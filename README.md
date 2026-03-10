# 🌊 Flood Inundation Mapping using DEM & Rainfall

### *(Google Earth Engine | Mahanadi Basin, Odisha)*

## 📌 Project Overview

Floods are among the most destructive natural disasters in India, causing extensive damage to life, property, and infrastructure. Accurate identification of flood-prone areas is essential for **disaster preparedness, risk mitigation, and planning**.

This project implements a **satellite-based flood inundation mapping workflow** using **Google Earth Engine (GEE)** by integrating:

* **Topography (DEM)**
* **Satellite-derived rainfall**
* **Synthetic Aperture Radar (SAR) data**

The workflow identifies **potential flood-prone zones**, quantifies the affected area, and generates **export-ready raster and vector outputs** suitable for disaster management applications.

---

## 🎯 Objectives

* Identify **flood-prone regions** using elevation and rainfall thresholds
* Integrate **multi-source satellite datasets**
* Quantify **flood-risk area (km²)**
* Generate **raster and vector flood products**
* Enable scalable and reproducible **cloud-based EO analysis**

---

## 🛰️ Study Area

**Mahanadi River Basin, Odisha (India)**
Defined using a geographic bounding box covering the major flood-affected regions of the basin.

---

## 🧰 Tools & Datasets

### 🔹 Platform

* **Google Earth Engine (JavaScript API)**

### 🔹 Satellite & Geospatial Data

| Dataset               | Source | Purpose                         |
| --------------------- | ------ | ------------------------------- |
| SRTM DEM (30 m)       | USGS   | Terrain & elevation analysis    |
| CHIRPS Daily Rainfall | UCSB   | Rainfall accumulation           |
| Sentinel-1 SAR (VV)   | ESA    | Flood-sensitive radar reference |

---

## 🧠 Methodology (Step-by-Step)

### **Step 1: Define Area of Interest (AOI)**

A bounding polygon is created to spatially constrain the analysis to the **Mahanadi Basin**.

```javascript
var aoi = ee.Geometry.Polygon([
  [[84.0, 19.0], [84.0, 22.0], [87.0, 22.0], [87.0, 19.0], [84.0, 19.0]]
]);
Map.centerObject(aoi, 7);
```

✔ Ensures efficient processing

✔ Limits computation to the basin

---

### **Step 2: Load Digital Elevation Model (DEM)**

SRTM DEM (30 m) is used to identify **low-lying areas** prone to flooding.

```javascript
var dem = ee.Image("USGS/SRTMGL1_003").clip(aoi);
```

✔ Terrain controls flood accumulation

✔ Standard dataset used in ISRO/EO workflows

---

### **Step 3: Aggregate Monthly Rainfall**

CHIRPS daily rainfall is accumulated for **July 2022**, a peak monsoon period.

```javascript
var rain = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
  .filterBounds(aoi)
  .filterDate('2022-07-01', '2022-07-31')
  .sum()
  .clip(aoi);
```

✔ Captures extreme rainfall events

✔ Essential driver of flooding

---

### **Step 4: Sentinel-1 SAR Overlay (Reference)**

Sentinel-1 SAR is added for **visual flood sensitivity**, as radar penetrates cloud cover.

```javascript
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterBounds(aoi)
  .filterDate('2022-07-01', '2022-07-31')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .select('VV')
  .mosaic()
  .clip(aoi);
```

✔ Radar-based flood relevance

✔ Useful for validation & interpretation

---

### **Step 5: Identify Heavy Rainfall Zones**

Rainfall greater than **200 mm** is classified as extreme.

```javascript
var heavyRain = rain.gt(200);
```

✔ Threshold-based disaster screening

✔ Filters significant rainfall events

---

### **Step 6: Flood-Prone Zone Identification**

Flood-risk zones are identified using a logical condition:

> **Low Elevation (< 50 m) + Heavy Rainfall (> 200 mm)**

```javascript
var floodRisk = dem.lt(50).and(heavyRain);
```

✔ Simple yet effective first-order flood model

✔ Mimics operational screening methods

---

### **Step 7: Flood Area Quantification**

The total flood-prone area is calculated in **square kilometers**.

```javascript
var pixelAreaKm2 = ee.Image.pixelArea().divide(1e6);
var floodArea = pixelAreaKm2.updateMask(floodRisk).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});
```

✔ Converts spatial results into actionable metrics

✔ Useful for disaster reporting

---

### **Step 8: Vectorization of Flood Zones**

Raster flood zones are converted into polygons.

```javascript
var floodVectors = floodRisk.selfMask().reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13
});
```

✔ Enables GIS integration

✔ Suitable for planning & decision systems

---

### **Step 9: Export Outputs**

Exporting results for offline analysis.

#### Raster Export

```javascript
Export.image.toDrive({
  image: floodRisk.toByte(),
  description: 'MahanadiBasin_FloodRiskRaster',
  scale: 30,
  region: aoi
});
```

#### Vector Export

```javascript
Export.table.toDrive({
  collection: floodVectors,
  description: 'MahanadiBasin_FloodRiskPolygons',
  fileFormat: 'SHP'
});
```

#### Summary CSV

```javascript
Export.table.toDrive({
  collection: ee.FeatureCollection([
    ee.Feature(null, {'FloodArea_km2': floodArea.get('area')})
  ]),
  description: 'FloodAreaSummary',
  fileFormat: 'CSV'
});
```

---

## 🗺️ Visualization & Legend

A custom UI legend is added to improve interpretability.

✔ Heavy Rainfall Zones

✔ Flood-Prone Areas

---

## 📊 Outputs

* **Flood risk raster (GeoTIFF)**
* **Flood-prone polygons (Shapefile)**
* **Area statistics (CSV)**

---

## 🚀 Applications

* Flood risk assessment
* Disaster preparedness planning
* Emergency response prioritization
* Satellite-based decision support systems

---

## 🔮 Future Enhancements

* Dynamic flood propagation modeling
* SAR-based water extraction
* Time-series rainfall-runoff analysis
* Machine learning-based flood prediction

---

## 🧠 Key Learning Outcomes

* Cloud-based EO processing using GEE
* Multi-sensor satellite data integration
* Raster-to-vector geospatial workflows
* Disaster-oriented spatial analysis

---

## 📌 Author

**Pon Ajith Kumar P**
B.Tech – Information Technology
