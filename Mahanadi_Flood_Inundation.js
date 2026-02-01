// =======================================================
// Project P6: Flood Inundation Mapping — Mahanadi Basin, Odisha
// =======================================================

// 0) AOI - Mahanadi Basin bounding box
var aoi = ee.Geometry.Polygon([
  [[84.0, 19.0],
   [84.0, 22.0],
   [87.0, 22.0],
   [87.0, 19.0],
   [84.0, 19.0]]
]);
Map.centerObject(aoi, 7);
Map.addLayer(aoi, {color:'red'}, 'AOI: Mahanadi Basin');

// 1) Load DEM (SRTM 30m) and visualize
var dem = ee.Image("USGS/SRTMGL1_003").clip(aoi);
Map.addLayer(dem, {min:0, max:200, palette:['white','green']}, "DEM");

// 2) Load CHIRPS daily rainfall for July 2022
var rain = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
  .filterBounds(aoi)
  .filterDate('2022-07-01', '2022-07-31')
  .sum()
  .clip(aoi);
Map.addLayer(rain, {min:0, max:300, palette:['white','blue']}, "Total Rainfall July 2022");

// 3) Optional: Sentinel-1 SAR overlay for visual reference (added first so other layers are above)
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD")
  .filterBounds(aoi)
  .filterDate('2022-07-01', '2022-07-31')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .select('VV')
  .mosaic()
  .clip(aoi);
Map.addLayer(s1, {min:-25, max:0}, "Sentinel-1 VV");

// 4) Identify heavy rainfall zones (>200mm)
var heavyRain = rain.gt(200).rename('HeavyRain');
Map.addLayer(heavyRain.updateMask(heavyRain), {palette:['blue']}, "Rainfall > 200mm");

// 5) Define flood-prone areas combining DEM and rainfall
var floodRisk = dem.lt(50).and(heavyRain).rename('FloodRisk');
Map.addLayer(floodRisk.updateMask(floodRisk), {palette:['red']}, "Potential Flood Zones");

// 6) Compute area statistics (km²) for flood-prone zones
var pixelAreaKm2 = ee.Image.pixelArea().divide(1e6);
var floodArea = pixelAreaKm2.updateMask(floodRisk).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});
var floodArea_km2 = ee.Number(floodArea.get('area')).or(0);
print('Flood-prone area (km²):', floodArea_km2);

// 7) Vectorize flood-prone areas
var floodVectors = floodRisk.selfMask().reduceToVectors({
  geometry: aoi,
  scale: 30,
  geometryType: 'polygon',
  labelProperty: 'flood',
  maxPixels: 1e13
});
Map.addLayer(floodVectors, {color:'red'}, 'Flood-prone Polygons');

// 8) Export raster and vector results to Google Drive
Export.image.toDrive({
  image: floodRisk.toByte(),
  description: 'MahanadiBasin_FloodRiskRaster',
  folder: 'GEE_Exports',
  fileNamePrefix: 'MahanadiBasin_FloodRiskRaster',
  region: aoi,
  scale: 30,
  maxPixels: 1e13
});

Export.table.toDrive({
  collection: floodVectors,
  description: 'MahanadiBasin_FloodRiskPolygons',
  folder: 'GEE_Exports',
  fileNamePrefix: 'MahanadiBasin_FloodRiskPolygons',
  fileFormat: 'SHP'
});

Export.table.toDrive({
  collection: ee.FeatureCollection([
    ee.Feature(null, {'FloodArea_km2': floodArea_km2})
  ]),
  description: 'MahanadiBasin_FloodAreaSummary',
  folder: 'GEE_Exports',
  fileNamePrefix: 'MahanadiBasin_FloodAreaSummary',
  fileFormat: 'CSV'
});

// 9) UI Legend for visualization
function addLegendFlood() {
  var panel = ui.Panel({style:{position:'bottom-right', padding:'8px', backgroundColor:'white'}});
  panel.add(ui.Label({value:'Flood Risk Legend', style:{fontWeight:'bold'}}));
  var makeRow = function(color, name){
    var box = ui.Label('', {backgroundColor: color, padding:'8px', margin:'0 6px 0 0'});
    var label = ui.Label(name);
    return ui.Panel([box, label], ui.Panel.Layout.Flow('horizontal'));
  };
  panel.add(makeRow('blue','Heavy Rainfall (>200mm)'));
  panel.add(makeRow('red','Potential Flood-prone (<50m elevation)'));
  Map.add(panel);
}
addLegendFlood();
