package main

import "encoding/json"

// OSM Geometry Response
type OSMGeometry struct {
	Elements []OSMElement `json:"elements"`
}

type OSMElement struct {
	Bounds   OSMBounds  `json:"bounds"`
	Geometry []OSMPoint `json:"geometry"`
	Id       int        `json:"id"`
	Nodes    []int      `json:"nodes"`
	Tags     OSMTagSet  `json:"tags"`
	Type     string     `json:"type"`
}

type OSMBounds struct {
	MaxLat float32 `json:"maxlat"`
	MaxLon float32 `json:"maxlon"`
	MinLat float32 `json:"minlat"`
	MinLon float32 `json:"minlon"`
}

type OSMPoint struct {
	Lat float32 `json:"lat"`
	Lon float32 `json:"lon"`
}

type OSMTagSet struct {
	Building string `json:"building"`
	Highway  string `json:"highway"`
	Name     string `json:"name"`
	Footway  string `json:"sidewalk"`
}

// OSM Location Response
type OSMLocation struct {
	Address     OSMAddress     `json:"address"`
	AddressType string         `json:"addresstype"`
	BoundingBox [4]json.Number `json:"boundingbox"`
	Category    string         `json:"category"`
	DisplayName string         `json:"display_name"`
	Importance  float32        `json:"importance"`
	Latitude    json.Number    `json:"lat"`
	Longitude   json.Number    `json:"lon"`
	License     string         `json:"license"`
	Name        string         `json:"name"`
	OSMId       int            `json:"osm_id"`
	OSMType     string         `json:"osm_type"`
	PlaceId     int            `json:"place_id"`
	PlaceRank   int            `json:"place_rank"`
	Type        string         `json:"type"`
}

type OSMAddress struct {
	IsoCode     string `json:"ISO3166-2-lvl4"`
	City        string `json:"city"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	County      string `json:"county"`
	State       string `json:"state"`
	Road        string `json:"road"`
	Suburb      string `json:"suburb"`
	Town        string `json:"town"`
}
