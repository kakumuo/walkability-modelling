package main

import (
	"encoding/json"
)

// API Response
type ResponseMessage struct {
	Success bool
	Message string
	Data    any
}

type Point struct {
	Longitude float64
	Latitude  float64
	X         float64
	Y         float64
}

type Node struct {
	Id    int
	Point Point
}

type Structure struct {
	Id               int
	StructureType    string
	Nodes            []Node
	BoundMax         Point
	BoundMin         Point
	StructureDetails map[string]string
}

type Model struct {
	Id         int
	Structures []Structure
	Bounds     struct {
		Center Point
		Radius float64
	}
}

func NewModel(resp OSMGeometry, rad float64, lon float64, lat float64) Model {
	res := Model{}
	var minLat, minLon float64 = 181, 91
	var maxLat, maxLon float64 = -181, -91

	norm := func(val, center float64) float64 {
		return (val - center)
	}

	for _, element := range resp.Elements {
		minLat = min(minLat, element.Bounds.MinLat)
		minLon = min(minLon, element.Bounds.MinLon)
		maxLat = min(maxLat, element.Bounds.MaxLat)
		maxLon = min(maxLon, element.Bounds.MaxLon)
	}

	res.Bounds.Radius = rad
	res.Bounds.Center = Point{
		Longitude: lon,
		Latitude:  lat,
		X:         0,
		Y:         0,
	}

	for _, element := range resp.Elements {

		curStruct := Structure{
			Id: element.Id,
		}

		if element.Tags.Building != "" {
			curStruct.StructureType = element.Tags.Building
		} else if element.Tags.Highway != "" {
			curStruct.StructureType = element.Tags.Highway
		}

		curStruct.BoundMax = Point{
			Latitude:  element.Bounds.MaxLat,
			Longitude: element.Bounds.MaxLon,
			X:         norm(element.Bounds.MaxLat, lat),
			Y:         norm(element.Bounds.MaxLon, lon),
		}

		curStruct.BoundMin = Point{
			Latitude:  element.Bounds.MinLat,
			Longitude: element.Bounds.MinLon,
			X:         norm(element.Bounds.MinLat, lat),
			Y:         norm(element.Bounds.MinLon, lon),
		}

		for i, geom := range element.Geometry {
			node := Node{
				Id: element.Nodes[i],
				Point: Point{
					Latitude:  geom.Lat,
					Longitude: geom.Lon,
					X:         norm(geom.Lat, lat),
					Y:         norm(geom.Lon, lon),
				},
			}

			curStruct.Nodes = append(curStruct.Nodes, node)
		}

		var tmp map[string]string
		inRec, _ := json.Marshal(element.Tags)
		json.Unmarshal(inRec, &tmp)
		curStruct.StructureDetails = tmp

		res.Structures = append(res.Structures, curStruct)
	}

	return res
}
