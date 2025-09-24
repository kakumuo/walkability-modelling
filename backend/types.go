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
	Id               int32
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
	Id         int
	Structures []Structure
	Bounds     struct {
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
	Id             int32
	Point          Point
	ParentId       int32
	Traversability int8
	IsEntrance     bool
}

type PointCloud struct {
	Points map[int32]PointCloudNode
}

func NewPointCloud(model StructureModel, rad float64, lon float64, lat float64) PointCloud {
	points := make(map[int32]PointCloudNode)
	var curId int32 = 1

	// meter to lat:
	radLat := rad / 111_111
	radLon := radLat / math.Cos(lat*0.01745)
	density := 2 // {density} nodes for every meter

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

			points[curNode.Id] = curNode
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
				points[curId] = PointCloudNode{
					Id:             curId,
					Point:          prev.Point.Midpoint(cur.Point),
					Traversability: 10,
					IsEntrance:     true,
					ParentId:       s.Id,
				}

				curId += 1
			}
		}
	}

	return PointCloud{
		Points: points,
	}
}

// TODO: instead of buildling adjMatrix, add another attribute to PointCloud struct for id of next point cloud
func NewAdjMatrix(points PointCloud, rad float64, lat float64, lon float64) map[int32][]int32 {
	// use map of maps to ensure start node does not go to multiple of the same destination node
	adjMatrix := make(map[int32]map[int32]bool)

	radLat := rad / 111_111
	radLon := radLat / math.Cos(lat*0.01745)
	density := 2
	latInc, lonInc := (radLat / float64(density)), (radLon / float64(density))
	// DIST_THRESH := math.Sqrt(math.Pow(latInc, 2) + math.Pow(lonInc, 2))

	isValid := func(p1 Point, p2 Point) bool {
		return math.Abs(p1.X-p2.X) <= latInc && math.Abs(p1.Y-p2.Y) <= lonInc
	}

	for _, p := range points.Points {
		adjMatrix[p.Id] = make(map[int32]bool)
	}

	for _, p1 := range points.Points {
		if p1.Traversability == 0 {
			continue
		}
		adjMatrix[p1.Id] = make(map[int32]bool)
		for _, p2 := range points.Points {
			if p1.Id != p2.Id && isValid(p1.Point, p2.Point) && p2.Traversability > 0 {
				adjMatrix[p1.Id][p2.Id] = true
				adjMatrix[p2.Id][p1.Id] = true
			}
		}
	}

	// convert [int][int]true => [int][]int
	res := make(map[int32][]int32)
	for key, val := range adjMatrix {
		res[key] = make([]int32, len(val))
		i := 0
		for k := range val {
			res[key][i] = k
			i += 1
		}
	}

	return res
}

type ModelPath struct {
	StartId int32
	EndId   int32
	Path    []int32
}

type PathNode struct {
	Id   int32
	Dist int32
	Prev *PathNode
}

func NewModelPath(adjMatrix map[int32][]int32, startId int32, endId int32) ModelPath {
	res := ModelPath{StartId: startId, EndId: endId, Path: make([]int32, 0)}
	queue := []*PathNode{{Id: startId, Prev: nil}}
	visited := make(map[int32]bool)

	for len(queue) > 0 {
		curNode := queue[0]
		queue = queue[1:]
		visited[curNode.Id] = true

		if curNode.Id == endId {
			path := []int32{}
			for curNode != nil {
				path = append(path, curNode.Id)
				curNode = curNode.Prev
			}
			res.Path = path
			break
		}

		for _, next := range adjMatrix[curNode.Id] {
			if visited[next] {
				continue
			}
			queue = append(queue, &PathNode{Id: next, Prev: curNode})
		}
	}

	// reverse
	for i, j := 0, len(res.Path)-1; i < len(res.Path)/2; {
		res.Path[i], res.Path[j] = res.Path[j], res.Path[i]
		j -= 1
		i += 1
	}

	return res
}
