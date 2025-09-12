package main

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"
)

func TestModel(t *testing.T) {
	fileName := "./structure_test.json"
	file, _ := os.ReadFile(fileName)

	var data OSMGeometry
	var rad, lat, lon float64 = 40.000000, 40.668828, -75.470724
	err := json.Unmarshal(file, &data)

	if err != nil {
		t.Error(err)
	}

	model := NewStructureModel(data, rad, lat, lon)
	fmt.Println(model)
}
