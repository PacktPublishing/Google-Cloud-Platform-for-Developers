package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/julienschmidt/httprouter"
)

type Car struct {
	VIN   string `json:"vin"`
	Make  string `json:"make"`
	Model string `json:"model"`
	Year  int    `json:"year"`
}

var (
	cars []*Car
)

func loadCars(cars *[]*Car) error {
	raw, _ := ioutil.ReadFile("./cars.json")
	return json.Unmarshal(raw, &cars)
}

func main() {
	if err := loadCars(&cars); err != nil {
		log.Printf("Failed to load cars from file: %v", err)
		return
	}

	router := httprouter.New()
	router.GET("/api/cars", GetCars)
	router.GET("/api/cars/:id", GetCarByID)

	port := "8080"
	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	log.Printf("Go server starting on port %s", port)

	log.Fatal(http.ListenAndServe(":"+port, router))
}

// GetCars returns all cars as JSON array
func GetCars(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	log.Print("Fetching all cars")

	if err := json.NewEncoder(w).Encode(cars); err != nil {
		http.Error(w, "JSON serialization error", http.StatusInternalServerError)
	}
}

// GetCarByID returns a single car with the given VIN ID
func GetCarByID(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
	id := p.ByName("id")

	log.Printf("Fetching car for ID %s", id)

	for _, c := range cars {
		if c.VIN == id {
			if err := json.NewEncoder(w).Encode(c); err != nil {
				http.Error(w, "JSON serialization error", http.StatusInternalServerError)
			}
			return
		}
	}

	http.Error(w, "Car not found", http.StatusNotFound)
}
