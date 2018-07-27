package colors

import (
	"encoding/json"
	"math/rand"
	"net/http"
)

type colorResponse struct {
	Color    string `json:"color"`
	Provider string `json:"provider"`
	Instance int    `json:"instance"`
}

var instanceId int

func init() {
	instanceId = rand.Int()
	http.HandleFunc("/colors", handler)
}

func handler(w http.ResponseWriter, r *http.Request) {
	response := colorResponse{"blue", "Go 1.8 on App Engine standard environment", instanceId}
	body, err := json.Marshal(response)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("content-type", "application/json")
	w.Write(body)
}
