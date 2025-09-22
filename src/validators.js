function assertPointGeoJSON(g) {
  if (!g || g.type !== 'Point' || !Array.isArray(g.coordinates) || g.coordinates.length !== 2) {
    const msg = 'geom must be GeoJSON Point [lon, lat] in EPSG:4326';
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
}

function assertPolygonGeoJSON(g) {
  if (!g || g.type !== 'Polygon' || !Array.isArray(g.coordinates) || g.coordinates.length === 0) {
    const msg = 'geom must be GeoJSON Polygon (array of linear rings) in EPSG:4326';
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
}

function parsePagination(q) {
  const limit = Math.min(1000, Math.max(1, parseInt(q.limit || '100', 10)));
  const offset = Math.max(0, parseInt(q.offset || '0', 10));
  return { limit, offset };
}

module.exports = { assertPointGeoJSON, assertPolygonGeoJSON, parsePagination };