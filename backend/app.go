package main

import (
	"log"
	"net/http"
)

func main() {
	// Location Search
	http.HandleFunc("/location/search", func(w http.ResponseWriter, r *http.Request) {

	})

	log.Fatal(http.ListenAndServe(":4001", nil))
}

/*
 */
