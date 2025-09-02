package main

import (
	"encoding/json"
)

type Point struct {
	Longitude float32
	Latitude  float32
	X         float32
	Y         float32
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
	Id          int
	Structures  []Structure
	ModelCenter struct {
		Center Point
		Radius float32
	}
}

func NewModel(resp OSMGeometry, rad float32, lon float32, lat float32) Model {
	res := Model{}
	var minLat, minLon float32 = 181, 91
	var maxLat, maxLon float32 = -181, -91

	norm := func(val, minval, maxval float32) float32 {
		return val - (minval+maxval)/2
	}

	for _, element := range resp.Elements {
		minLat = min(minLat, element.Bounds.MinLat)
		minLon = min(minLon, element.Bounds.MinLon)
		maxLat = min(maxLat, element.Bounds.MaxLat)
		maxLon = min(maxLon, element.Bounds.MaxLon)
	}

	res.ModelCenter.Radius = rad
	res.ModelCenter.Center = Point{
		Longitude: lon,
		Latitude:  lat,
		X:         0,
		Y:         0,
	}

	for _, element := range resp.Elements {

		curStruct := Structure{
			Id:            element.Id,
			StructureType: element.Tags.Building,
		}

		curStruct.BoundMax = Point{
			Latitude:  element.Bounds.MaxLat,
			Longitude: element.Bounds.MaxLon,
			X:         norm(element.Bounds.MaxLat, maxLat, minLat),
			Y:         norm(element.Bounds.MaxLon, maxLon, minLon),
		}

		curStruct.BoundMin = Point{
			Latitude:  element.Bounds.MinLat,
			Longitude: element.Bounds.MinLon,
			X:         norm(element.Bounds.MinLat, maxLat, minLat),
			Y:         norm(element.Bounds.MinLon, maxLon, minLon),
		}

		for i, geom := range element.Geometry {
			node := Node{
				Id: element.Nodes[i],
				Point: Point{
					Latitude:  geom.Lat,
					Longitude: geom.Lon,
					X:         norm(geom.Lat, maxLat, minLat),
					Y:         norm(geom.Lon, maxLon, minLon),
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
