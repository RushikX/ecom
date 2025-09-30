package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	MongoURI    string
	Database    string
	JWTSecret   string
	FrontendURL string
}

func Load() *Config {
	// Load .env file from the backend directory
	godotenv.Load(".env")

	return &Config{
		Port:        getEnv("PORT", "8080"),
		MongoURI:    getEnv("MONGO_URI", ""),
		Database:    getEnv("MONGO_DB", "ecom"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		FrontendURL: getEnv("FRONTEND_URL", ""),
	}
}


func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	// Only panic for truly required variables
	if defaultValue == "" && (key == "MONGO_URI" || key == "JWT_SECRET") {
		panic("Required environment variable " + key + " is not set")
	}
	return defaultValue
}
