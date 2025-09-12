package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

/*
/api

	/model
		POST(modelId:int) -> modelId:int - create/rename model
		GET(modelId:int) - gets details about a specific model
		/init
			POST(rad:int, lon:int, lat:int, modelId:int)
		/geometry
			GET(modelId:int)
		/pointcloud
			GET(modelId:int)
	/location
		/search
			GET(address:string)
	// /profile (GET, POST, DELETE)

// response structure
success: boolean
message: if success == true then success else failure reason
data: if success == true then {...data} else {}
*/
const MODELS_PATH = "data/models"
const CONFIG_FILENAME = "config.json"
const STRUCT_MODEL_FILENAME = "structModel.json"
const POINTCLOUD_MODEL_FILENAME = "pointCloud.json"

func main() {
	http.HandleFunc("POST /api/model", func(w http.ResponseWriter, req *http.Request) {

		w.Header().Set("Content-Type", "application/json")
		responseData := ResponseMessage{Success: true}

		// send resposne
		defer func() {
			responseJson, _ := json.MarshalIndent(responseData, "", "    ")
			fmt.Fprint(w, string(responseJson))
		}()

		bodyData, err := io.ReadAll(req.Body)
		var bodyObj ModelConfig
		json.Unmarshal(bodyData, &bodyObj)

		if len(bodyData) == 0 {
			responseData.Success = false
			responseData.Message = "Message body is required"
			return
		}

		if err != nil {
			responseData.Success = false
			responseData.Message = err.Error()
			return
		}

		files, err := os.ReadDir(MODELS_PATH)
		if err != nil {
			fmt.Println("Directory not found, creating directory")
			os.MkdirAll(MODELS_PATH, os.ModeDir)
		}

		targetData := ModelConfig{
			Id:          -1,
			Name:        "",
			CreatedDate: time.Now(),
			UpdatedDate: time.Now(),
		}

		for _, file := range files {
			if file.Name() == fmt.Sprint(bodyObj.Id) {
				targetData.Id = bodyObj.Id
				break
			}
		}

		var targetFolderPath string = ""
		var targetFilePath string = ""
		if targetData.Id == -1 {
			now := time.Now()
			targetData.Id = now.UnixMilli()
			targetData.CreatedDate = now
			targetData.UpdatedDate = now

			targetFolderPath = fmt.Sprintf("%s/%d", MODELS_PATH, targetData.Id)
			targetFilePath = targetFolderPath + "/" + CONFIG_FILENAME
			os.Mkdir(targetFolderPath, os.ModeDir)
			os.Create(targetFilePath)

			responseData.Message = "Created model"
			targetData.Name = bodyObj.Name
		} else {
			targetFolderPath = fmt.Sprintf("%s/%d", MODELS_PATH, targetData.Id)
			targetFilePath = targetFolderPath + "/" + CONFIG_FILENAME
			fileData, _ := os.ReadFile(targetFilePath)
			var fileObj ModelConfig
			json.Unmarshal(fileData, &fileObj)

			targetData.CreatedDate = fileObj.CreatedDate
			targetData.Name = bodyObj.Name
			responseData.Message = "Updated model"
		}

		outputData, _ := json.Marshal(targetData)
		os.WriteFile(targetFilePath, outputData, 0755)

		responseData.Data = targetData
	})

	http.HandleFunc("GET /api/model", func(w http.ResponseWriter, req *http.Request) {
		responseData := ResponseMessage{Success: true}

		defer func() {
			responseJson, _ := json.MarshalIndent(responseData, "", "    ")
			fmt.Fprint(w, string(responseJson))
		}()

		if !req.URL.Query().Has("modelId") {
			responseData.Success = false
			responseData.Message = "Field 'modelId' required in query"
			return
		}

		modelId := req.URL.Query().Get("modelId")
		filePath := fmt.Sprintf("%s/%s/config.json", MODELS_PATH, modelId)
		data, err := os.ReadFile(filePath)

		if err != nil {
			responseData.Success = false
			responseData.Message = fmt.Sprintf("Model not found with id: %s", modelId)
			return
		}

		var outputObj ModelConfig
		err = json.Unmarshal(data, &outputObj)
		if err != nil {
			responseData.Message = err.Error()
			responseData.Success = false
			return
		}
		responseData.Data = outputObj
	})

	http.HandleFunc("POST /api/model/init", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		base, err := url.Parse("https://overpass-api.de/api/interpreter")
		responseData := ResponseMessage{}

		// send resposne
		defer func() {
			responseJson, _ := json.Marshal(responseData)
			fmt.Fprint(w, string(responseJson))
		}()

		if err != nil {
			responseData.Message = "Unable to parse base url"
			return
		}

		isEmpty := func(field string, obj url.Values) bool {
			return !obj.Has(field) || obj.Get(field) == ""
		}

		if isEmpty("modelId", req.URL.Query()) {
			responseData.Message = "Field 'modelId' is not present in query params"
		} else if isEmpty("lon", req.URL.Query()) {
			responseData.Message = "Longitude is not present in query params"
			return
		} else if isEmpty("lat", req.URL.Query()) {
			responseData.Message = "Latitude is not present in query params"
			return
		} else if isEmpty("rad", req.URL.Query()) {
			responseData.Message = "Radius is not present in query params"
			return
		}

		modelId := req.URL.Query().Get("modelId")
		targetFolder := fmt.Sprintf("%s/%s", MODELS_PATH, modelId)
		_, err = os.Stat(targetFolder)

		if err != nil {
			responseData.Message = fmt.Sprintf("Model not found with id: %s", modelId)
		}

		lonStr := req.URL.Query().Get("lon")
		latStr := req.URL.Query().Get("lat")
		radStr := req.URL.Query().Get("rad")

		lon, _ := strconv.ParseFloat(lonStr, 64)
		lat, _ := strconv.ParseFloat(latStr, 64)
		rad, _ := strconv.ParseFloat(radStr, 64)

		client := &http.Client{}
		bodyStr := fmt.Sprintf(`
			[out:json][timeout:90];
			way(around:%f,%f,%f);
			out body geom;
		`, rad, lat, lon)

		resp, err := client.Do(&http.Request{
			URL:  base,
			Body: io.NopCloser(strings.NewReader(bodyStr)),
		})

		if err != nil {
			responseData.Message = err.Error()
			return
		}

		defer func() {
			if responseData.Success {
				resp.Body.Close()
			}
		}()

		if resp.StatusCode == http.StatusOK {
			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				responseData.Message = err.Error()
				return
			}

			var geometryData OSMGeometry
			err = json.Unmarshal(bodyBytes, &geometryData)
			if err != nil {
				responseData.Message = err.Error()
				return
			}

			responseData.Message = "success"
			responseData.Success = true

			targetStructureFilePath := fmt.Sprintf("%s/%s", targetFolder, STRUCT_MODEL_FILENAME)
			targetPathingFilePath := fmt.Sprintf("%s/%s", targetFolder, POINTCLOUD_MODEL_FILENAME)

			structModel := NewStructureModel(geometryData, rad, lon, lat)
			data, _ := json.MarshalIndent(structModel, "", "    ")
			err = os.WriteFile(targetStructureFilePath, data, 0755)
			fmt.Println("Updating struct model...")

			if err != nil {
				fmt.Println(err.Error())
			}

			pointCloud := NewPointCloud(structModel, rad, lon, lat)
			data, _ = json.MarshalIndent(pointCloud, "", "    ")
			err = os.WriteFile(targetPathingFilePath, data, 0755)
			fmt.Println("Updating point cloud...")

			if err != nil {
				fmt.Println(err.Error())
			}
		}
	})

	http.HandleFunc("GET /api/model/geometry", func(w http.ResponseWriter, req *http.Request) {
		responseData := ResponseMessage{Success: true}

		// send resposne
		defer func() {
			responseJson, _ := json.Marshal(responseData)
			fmt.Fprint(w, string(responseJson))
		}()

		modelId := req.URL.Query().Get("modelId")
		targetFilePath := fmt.Sprintf("%s/%s/%s", MODELS_PATH, modelId, STRUCT_MODEL_FILENAME)
		_, err := os.Stat(targetFilePath)

		if err != nil {
			responseData.Message = fmt.Sprintf("Model not found with id: %s", modelId)
			responseData.Success = false
		}

		data, _ := os.ReadFile(targetFilePath)
		var obj StructureModel

		json.Unmarshal(data, &obj)
		responseData.Data = obj
	})

	http.HandleFunc("GET /api/model/pointCloud", func(w http.ResponseWriter, req *http.Request) {
		responseData := ResponseMessage{Success: true}

		// send resposne
		defer func() {
			responseJson, _ := json.Marshal(responseData)
			fmt.Fprint(w, string(responseJson))
		}()

		modelId := req.URL.Query().Get("modelId")
		targetFilePath := fmt.Sprintf("%s/%s/%s", MODELS_PATH, modelId, POINTCLOUD_MODEL_FILENAME)
		_, err := os.Stat(targetFilePath)

		if err != nil {
			responseData.Message = fmt.Sprintf("Model not found with id: %s", modelId)
			responseData.Success = false
		}

		data, _ := os.ReadFile(targetFilePath)
		var obj PointCloud

		json.Unmarshal(data, &obj)
		responseData.Data = obj
	})

	http.HandleFunc("GET /api/location/search", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		base, err := url.Parse("https://nominatim.openstreetmap.org/search")
		responseData := ResponseMessage{Success: true}

		// send resposne
		defer func() {
			responseJson, _ := json.Marshal(responseData)
			fmt.Fprint(w, string(responseJson))
		}()

		if err != nil {
			responseData.Message = "Unable to parse base url"
			return
		}

		if !req.URL.Query().Has("address") {
			responseData.Message = "Parameter 'q' not supplied"
			return
		}

		params := url.Values{}
		params.Add("q", req.URL.Query().Get("address"))
		params.Add("format", "jsonv2")
		params.Add("addressdetails", "1")
		params.Add("limit", "10")
		base.RawQuery = params.Encode()

		fmt.Println(base.String())

		client := &http.Client{}
		resp, err := client.Get(base.String())

		if err != nil {
			responseData.Message = err.Error()
			return
		}

		defer func() {
			if responseData.Success {
				resp.Body.Close()
			}
		}()

		if resp.StatusCode == http.StatusOK {
			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				responseData.Message = err.Error()
				return
			}

			var bodyJson []OSMLocation
			err = json.Unmarshal(bodyBytes, &bodyJson)
			if err != nil {
				responseData.Message = err.Error()
				return
			}

			responseData.Message = "success"
			responseData.Success = true
			responseData.Data = bodyJson
		}
	})

	log.Fatal(http.ListenAndServe(":4001", nil))
}
