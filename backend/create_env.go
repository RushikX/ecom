package main

import "os"

func main() {
	content := `PORT=8080
MONGO_URI=mongodb+srv://rushik:rushik@atlascluster.xxzji77.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=ecom
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:5174
`
	os.WriteFile(".env", []byte(content), 0644)
}
