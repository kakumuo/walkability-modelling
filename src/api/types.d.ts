
type ResponseMessage<T> = {
	Success:boolean
	Message:string
	Data:T
}

// Model details
type Model = {
  Id: number;
  Structures: Structure[];
  Bounds: {
    Center: Point;
    Radius: number;
  };
};

type Structure = {
  Id: number;
  StructureType: string;
  Nodes: Node[];
  BoundMax: Point;
  BoundMin: Point;
  StructureDetails: Record<string, string>;
};

type Point = {
  Longitude: number;
  Latitude: number;
  X: number;
  Y: number;
};

type Node = {
  Id: number;
  Point: Point;
};

// Address details
export interface OSMAddress {
  ISO3166_2_lvl4: string;
  City: string;
  Country: string;
  Country_code: string;
  County: string;
  State: string;
  Road: string;
  Suburb: string;
  Town: string;
}

export interface OSMLocation {
  Address: OSMAddress;
  Addresstype: string;
  Boundingbox: [number, number, number, number];
  Category: string;
  Display_name: string;
  Importance: number;
  Lat: number | string;
  Lon: number | string;
  License: string;
  Name: string;
  Osm_id: number;
  Osm_type: string;
  Place_id: number;
  Place_rank: number;
  Type: string;
}
