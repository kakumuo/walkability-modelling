
export type ResponseMessage<T> = {
	Success:boolean
	Message:string
	Data:T
}

// Model details
export type Model = {
  Id: number;
  Structures: Structure[];
  Bounds: Bounds
};

export type Bounds = {
    Center: Point;
    BoundMin: Point;
    BoundMax: Point;
    Radius: number;
};

export type Structure = {
  Id: number;
  StructureType: string;
  Nodes: Node[];
  BoundMax: Point;
  BoundMin: Point;
  StructureDetails: Record<string, string>;
};

export type Point = {
  Longitude: number;
  Latitude: number;
  X: number;
  Y: number;
};

export type PointCloudNode = {
	Id:             number
	Point:          Point
	Traversability: number
	IsEntrance:     boolean
}

export type PointCloud = {
  Points: {[key: number]:PointCloudNode}
}

export type Node = {
  Id: number;
  Point: Point;
};

export type ModelConfig = {
  Name:string, 
  Id:number, 
  CreatedDate:number, 
  UpdatedDate:number
}

// Address details
export interface OSMAddress {
  iso3166_2_lvl4: string;
  city: string;
  country: string;
  country_code: string;
  county: string;
  state: string;
  road: string;
  suburb: string;
  town: string;
}

export interface OSMLocation {
  address: OSMAddress;
  addresstype: string;
  boundingbox: [number, number, number, number];
  category: string;
  display_name: string;
  importance: number;
  lat: number | string;
  lon: number | string;
  license: string;
  name: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  place_rank: number;
  type: string;
}

export type ModelPath = {
	StartId:number
	EndId:number
	Path:number[]
}
