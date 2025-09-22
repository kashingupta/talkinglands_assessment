# Spatial Data Platform REST API

A Node.js backend for storing, querying, and managing geospatial data (points and polygons) using Express and PostgreSQL/PostGIS.

---

## Features

- Store, update, and list multiple geospatial points and polygons
- Filter by bounding box or geometry relationship (within/intersects)
- Find nearest points by coordinates
- Query points within polygons
- All geometries use GeoJSON and EPSG:4326 coordinates
- Modular, well-commented Express codebase

---

## Prerequisites

- Node.js (v18+)
- npm
- PostgreSQL (v12+) **with PostGIS enabled**
- Recommended: usage of `curl` for API testing

---

## Setup Instructions

1. **Clone the repository**
Replace with actual repo URL
git clone <repo-url>
cd backend_assessment

2. **Install dependencies**
npm install


3. **Create and configure your environment**

- Copy and edit `.env` for environment variables:
  ```
  PORT=3000
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/spatialdb
  ```
- Adjust `DATABASE_URL` as needed for your PostgreSQL setup.

4. **Create database and enable PostGIS/pgcrypto extensions**
createdb spatialdb
psql -d spatialdb -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d spatialdb -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"


5. **Apply database migrations**
npm run migrate # Loads schema and spatial tables


6. **Start the server**
npm start


---

## API Documentation

All endpoints use and return JSON. All geometry uses GeoJSON format, with coordinates in `[longitude, latitude]` (WGS84/EPSG:4326).

### General

- `GET /health`  
_Check server and DB health_

---

### Points API

- **Create Point**
- `POST /points`
- Request body:
 ```
 {
   "name": "Location A",
   "properties": { "category": "poi" },
   "geom": { "type": "Point", "coordinates": [77.5946, 12.9716] }
 }
 ```

- **List Points**
- `GET /points?bbox=77.0,12.5,78.0,13.5`
 - `bbox` format: `[minLon,minLat,maxLon,maxLat]`
- `GET /points?within=<GeoJSON Polygon>`
 - `within` GeoJSON Polygon (stringified)
- Supports pagination with `limit` and `offset`

- **Get Point by ID**
- `GET /points/{id}`

- **Update Point (Partial)**
- `PATCH /points/{id}`
 ```
 {
   "name": "Updated Name",
   "properties": {},
   "geom": { }
 }
 ```

- **Delete Point**
- `DELETE /points/{id}`

- **Find Nearest Points**
- `GET /points/nearest/to?lon=77.6&lat=12.97&limit=3`
 - Returns nearest point(s) to given coordinate

---

### Polygons API

- **Create Polygon**
- `POST /polygons`
 ```
 {
   "name": "Area 1",
   "properties": { "zone": "res" },
   "geom": {
     "type": "Polygon",
     "coordinates": [
       [ [77.58,12.96], [77.62,12.96], [77.62,12.99], [77.58,12.99], [77.58,12.96] ]
     ]
   }
 }
 ```

- **List Polygons**
- `GET /polygons?bbox=77.0,12.5,78.0,13.5`
- `GET /polygons?intersects=<GeoJSON geometry>`
- Supports pagination with `limit` and `offset`

- **Get Polygon by ID**
- `GET /polygons/{id}`

- **Update Polygon (Partial)**
- `PATCH /polygons/{id}`

- **Delete Polygon**
- `DELETE /polygons/{id}`

- **List Points Inside Polygon**
- `GET /polygons/{polygonId}/points`
 - Returns all points that lie within the specified polygon

---

## Example Usage

Create a point:
curl -X POST http://localhost:3000/points
-H "Content-Type: application/json"
-d '{"name":"TestPoint","geom":{"type":"Point","coordinates":[77.6,12.97]}}'

List points in a bounding box:
curl "http://localhost:3000/points?bbox=77.0,12.5,78.0,13.5"

Find nearest points:
curl "http://localhost:3000/points/nearest/to?lon=77.6&lat=12.97&limit=3"

Create a polygon:
curl -X POST http://localhost:3000/polygons
-H "Content-Type: application/json"
-d '{"name":"Area 1","geom":{"type":"Polygon","coordinates":[[[77.58,12.96],[77.62,12.96],[77.62,12.99],[77.58,12.99],[77.58,12.96]]]}}'


List points within a polygon:
curl "http://localhost:3000/polygons/<polygonId>/points"


---

## Development Notes

- Code is organized under `src/` directory
- DB migrations (`src/sql/migrations.sql`) setup the necessary tables and indexes
- Modular routers for points and polygons
- Use Nodemon for development (`npm run dev`)
- For production, ensure secure `.env` handling, and consider rate limiting/auth middleware

---

**Tip:**  
All API errors are consistently returned as JSON objects.  
Geometries must be valid GeoJSON. All coordinates are floats in WGS84.





