package main

import "os"

func main() {
	content := `PORT=8080
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ecom
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=
`
	os.WriteFile(".env", []byte(content), 0644)
}
