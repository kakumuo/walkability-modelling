package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

/*
	api
		location
			GET search(address:string)
			GET geometry(lon:float, lat:float, rad:float)
			GET analytics(lon:float, lat:float)
		model (GET, POST, DELETE)
		profile (GET, POST, DELETE)


	// response structure
	success: boolean
	message: if success == true then success else failure reason
	data: if success == true then {...data} else {}
*/

func main() {
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

	http.HandleFunc("GET /api/location/geometry", func(w http.ResponseWriter, r *http.Request) {
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

		if isEmpty("lon", r.URL.Query()) {
			responseData.Message = "Longitude is not present in query params"
			return
		} else if isEmpty("lat", r.URL.Query()) {
			responseData.Message = "Latitude is not present in query params"
			return
		} else if isEmpty("rad", r.URL.Query()) {
			responseData.Message = "Radius is not present in query params"
			return
		}

		lonStr := r.URL.Query().Get("lon")
		latStr := r.URL.Query().Get("lat")
		radStr := r.URL.Query().Get("rad")

		lon, _ := strconv.ParseFloat(lonStr, 64)
		lat, _ := strconv.ParseFloat(latStr, 64)
		rad, _ := strconv.ParseFloat(radStr, 64)

		client := &http.Client{}
		bodyStr := fmt.Sprintf(`
			[out:json][timeout:90];
			way(around:%f,%f,%f);
			out body geom;
		`, rad, lat, lon)

		fmt.Println(bodyStr)

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

			var bodyJson OSMGeometry
			err = json.Unmarshal(bodyBytes, &bodyJson)
			if err != nil {
				responseData.Message = err.Error()
				return
			}

			responseData.Message = "success"
			responseData.Success = true

			responseData.Data = NewModel(bodyJson, rad, lon, lat)
			// responseData.Data = bodyJson
		}
	})

	log.Fatal(http.ListenAndServe(":4001", nil))
}
