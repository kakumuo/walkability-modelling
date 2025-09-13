package main

import (
	"encoding/json"
	"math"
	"time"
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

func (o Point) Distance(d Point) float64 {
	return math.Sqrt(math.Pow(d.X-o.X, 2) + math.Pow(d.Y-o.Y, 2))
}

func (o Point) Midpoint(d Point) Point {
	return Point{
		Latitude:  (d.Latitude + o.Latitude) / 2,
		Longitude: (d.Longitude + o.Longitude) / 2,
		X:         (d.X + o.X) / 2,
		Y:         (d.Y + o.Y) / 2,
	}
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

func (s Structure) containsPointBounds(p Point) bool {
	return p.Latitude > s.BoundMin.Latitude && p.Latitude < s.BoundMax.Latitude && p.Longitude < s.BoundMin.Longitude && p.Longitude > s.BoundMax.Longitude
}

type StructureModel struct {
	Id           int
	Structures   []Structure
	PathingModel PointCloud
	Bounds       struct {
		Center   Point
		BoundMin Point
		BoundMax Point
		Radius   float64
	}
}

type ModelConfig struct {
	Name        string
	Id          int64
	CreatedDate time.Time
	UpdatedDate time.Time
}

const (
	STRUCTURETYPE_BUILDLING = "building"
	STRUCTURETYPE_ROAD      = "road"
)

func NewStructureModel(resp OSMGeometry, rad float64, lon float64, lat float64) StructureModel {
	res := StructureModel{}
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

	// Conversion factors
	metersPerDegLat := 111320.0
	metersPerDegLon := 111320.0 * math.Cos(lat*math.Pi/180.0)

	// Convert meters to degrees
	radLat := rad / metersPerDegLat
	radLon := rad / metersPerDegLon

	res.Bounds.BoundMin = Point{
		Longitude: lon - radLon,
		Latitude:  lat - radLat,
		X:         -radLat,
		Y:         -radLon,
	}

	res.Bounds.BoundMax = Point{
		Longitude: lon + radLon,
		Latitude:  lat + radLat,
		X:         radLat,
		Y:         radLon,
	}

	//TODO: generate point cloud

	for _, element := range resp.Elements {

		curStruct := Structure{
			Id: element.Id,
		}

		if element.Tags.Building != "" {
			curStruct.StructureType = STRUCTURETYPE_BUILDLING
		} else if element.Tags.Highway != "" {
			curStruct.StructureType = STRUCTURETYPE_ROAD
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

	// res.PathingModel = NewPathingModel(resp, rad, lon, lat)
	return res
}

type PointCloudNode struct {
	Id             int
	Point          Point
	Traversability int8
	IsEntrance     bool
}

type PointCloud struct {
	Points []PointCloudNode
}

func NewPointCloud(model StructureModel, rad float64, lon float64, lat float64) PointCloud {
	points := make([]PointCloudNode, 0)
	curId := 0

	// meter to lat:
	radLat := rad / 111_111
	radLon := radLat / math.Cos(lat*0.01745)
	density := 5 // {density} nodes for every meter

	latInc, lonInc := (radLat / float64(density)), (radLon / float64(density))

	//FIXME: sometimes generates one less row than needed
	for curLat := lat - radLat; curLat <= lat+radLat; curLat += latInc {
		for curLon := lon - radLon; curLon <= lon+radLon; curLon += lonInc {
			curPoint := Point{
				Longitude: curLon,
				Latitude:  curLat,
				X:         lat - curLat,
				Y:         lon - curLon,
			}

			curNode := PointCloudNode{
				Id:             curId,
				Point:          curPoint,
				Traversability: 10,
			}

			for _, s := range model.Structures {
				// TODO: check with bulidling points, instead of bounds
				if s.containsPointBounds(curPoint) {
					switch s.StructureType {
					case STRUCTURETYPE_BUILDLING:
						curNode.Traversability = 0
					case STRUCTURETYPE_ROAD:
						curNode.Traversability = 5
					}
					break
				}
			}

			points = append(points, curNode)
			curId += 1
		}
	}

	// add building entrance and exits
	const BUILDING_ENTRANCE_THRESH = .0001
	for _, s := range model.Structures {
		if s.StructureType != STRUCTURETYPE_BUILDLING {
			continue
		}

		for i := 1; i < len(s.Nodes); i++ {
			cur, prev := s.Nodes[i], s.Nodes[i-1]

			if cur.Point.Distance(prev.Point) > BUILDING_ENTRANCE_THRESH {
				points = append(points, PointCloudNode{
					Id:             curId,
					Point:          prev.Point.Midpoint(cur.Point),
					Traversability: 10,
					IsEntrance:     true,
				})

				curId += 1
			}
		}
	}

	return PointCloud{
		Points: points,
	}
}
