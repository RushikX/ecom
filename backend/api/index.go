package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// Configuration
type Config struct {
	Port        string
	MongoURI    string
	Database    string
	JWTSecret   string
	FrontendURL string
}

// User model
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password" json:"-"`
	Role      string             `bson:"role" json:"role"`
	IsActive  bool               `bson:"isActive" json:"isActive"`
	Address   string             `bson:"address,omitempty" json:"address,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Product model
type Product struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price"`
	Category    string             `bson:"category" json:"category"`
	Stock       int                `bson:"stock" json:"stock"`
	Images      []string           `bson:"images" json:"images"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Cart model
type Cart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Items     []CartItem         `bson:"items" json:"items"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type CartItem struct {
	ProductID primitive.ObjectID `bson:"productId" json:"productId"`
	Quantity  int                `bson:"quantity" json:"quantity"`
	Product   *Product           `bson:"product,omitempty" json:"product,omitempty"`
}

// Order model
type Order struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Items     []CartItem         `bson:"items" json:"items"`
	Total     float64            `bson:"total" json:"total"`
	Status    string             `bson:"status" json:"status"`
	Address   string             `bson:"address" json:"address"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Request models
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AddToCartRequest struct {
	ProductID primitive.ObjectID `json:"productId"`
	Quantity  int                `json:"quantity"`
}

type UpdateCartItemRequest struct {
	Quantity int `json:"quantity"`
}

// Global variables
var (
	app            *fiber.App
	mongoClient    *mongo.Client
	database       *mongo.Database
	userCollection *mongo.Collection
	productCollection *mongo.Collection
	cartCollection *mongo.Collection
	orderCollection *mongo.Collection
	cfg            *Config
)

func init() {
	// Load configuration
	cfg = loadConfig()

	// Connect to MongoDB
	connectMongoDB()

	// Create Fiber app
	app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	// Configure CORS based on environment
	var allowedOrigins string
	if cfg.FrontendURL != "" {
		allowedOrigins = cfg.FrontendURL + ",http://localhost:5173,http://localhost:5174"
	} else {
		allowedOrigins = "*"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: cfg.FrontendURL != "",
	}))

	// Initialize collections
	userCollection = database.Collection("users")
	productCollection = database.Collection("products")
	cartCollection = database.Collection("carts")
	orderCollection = database.Collection("orders")

	// Seed demo data
	seedDemoData()

	// Setup routes
	setupRoutes()
}

func loadConfig() *Config {
	// Load .env file
	godotenv.Load()

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
	return defaultValue
}

func connectMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	mongoClient = client
	database = client.Database(cfg.Database)
}

func setupRoutes() {
	// Health check
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "Server is running"})
	})

	// Debug endpoint
	app.Get("/api/debug", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Debug endpoint working",
		})
	})

	// Auth routes
	app.Post("/api/auth/login", loginHandler)
	app.Post("/api/auth/signup", signupHandler)
	app.Get("/api/auth/profile", authRequired, getProfileHandler)
	app.Put("/api/auth/profile", authRequired, updateProfileHandler)

	// Product routes
	app.Get("/api/products", getProductsHandler)
	app.Get("/api/products/:id", getProductHandler)

	// Cart routes
	app.Get("/api/cart", authRequired, getCartHandler)
	app.Post("/api/cart", authRequired, addToCartHandler)
	app.Put("/api/cart/:productId", authRequired, updateCartItemHandler)
	app.Delete("/api/cart/:productId", authRequired, removeFromCartHandler)
	app.Delete("/api/cart", authRequired, clearCartHandler)

	// Order routes
	app.Post("/api/orders", authRequired, createOrderHandler)
	app.Get("/api/orders", authRequired, getOrdersHandler)
	app.Get("/api/orders/:id", authRequired, getOrderHandler)
}

// Handler is the main entry point for Vercel
func Handler(w http.ResponseWriter, r *http.Request) {
	adaptor.FiberApp(app)(w, r)
}

// Auth middleware
func authRequired(c *fiber.Ctx) error {
	token := c.Get("Authorization")
	if token == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Authorization header required"})
	}

	if len(token) < 7 || token[:7] != "Bearer " {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token format"})
	}

	tokenString := token[7:]
	claims := jwt.MapClaims{}

	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	c.Locals("userId", claims["userId"])
	return c.Next()
}

// Handlers
func loginHandler(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var user User
	err := userCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if !user.IsActive {
		return c.Status(401).JSON(fiber.Map{"error": "Account is deactivated"})
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": user.ID.Hex(),
		"email":  user.Email,
		"role":   user.Role,
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user":  user,
	})
}

func signupHandler(c *fiber.Ctx) error {
	var req SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if user already exists
	var existingUser User
	err := userCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "User already exists"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	user := User{
		ID:        primitive.NewObjectID(),
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      "customer",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = userCollection.InsertOne(context.Background(), user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
	}

	return c.Status(201).JSON(fiber.Map{"message": "User created successfully"})
}

func getProfileHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var user User
	err = userCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	user.Password = ""
	return c.JSON(user)
}

func updateProfileHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var updateData map[string]interface{}
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	updateData["updatedAt"] = time.Now()
	delete(updateData, "password") // Don't allow password updates through this endpoint

	_, err = userCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": updateData})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profile updated successfully"})
}

func getProductsHandler(c *fiber.Ctx) error {
	ctx := context.Background()
	cursor, err := productCollection.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch products"})
	}
	defer cursor.Close(ctx)

	var products []Product
	if err = cursor.All(ctx, &products); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode products"})
	}

	return c.JSON(fiber.Map{"products": products})
}

func getProductHandler(c *fiber.Ctx) error {
	productID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var product Product
	err = productCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&product)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(product)
}

func getCartHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var cart Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			cart = Cart{
				ID:        primitive.NewObjectID(),
				UserID:    objectID,
				Items:     []CartItem{},
				UpdatedAt: time.Now(),
			}
			_, err = cartCollection.InsertOne(context.Background(), cart)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create cart"})
			}
		} else {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch cart"})
		}
	}

	// Populate product details
	var cartItems []fiber.Map
	for _, item := range cart.Items {
		var product Product
		err := productCollection.FindOne(context.Background(), bson.M{"_id": item.ProductID}).Decode(&product)
		if err != nil {
			continue
		}

		cartItems = append(cartItems, fiber.Map{
			"productId": item.ProductID,
			"quantity":  item.Quantity,
			"product":   product,
		})
	}

	return c.JSON(fiber.Map{
		"items": cartItems,
		"total": len(cartItems),
	})
}

func addToCartHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req AddToCartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if product exists
	var product Product
	err = productCollection.FindOne(context.Background(), bson.M{"_id": req.ProductID}).Decode(&product)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	// Get or create cart
	var cart Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			cart = Cart{
				ID:        primitive.NewObjectID(),
				UserID:    objectID,
				Items:     []CartItem{},
				UpdatedAt: time.Now(),
			}
		} else {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch cart"})
		}
	}

	// Check if item already exists in cart
	itemIndex := -1
	for i, item := range cart.Items {
		if item.ProductID == req.ProductID {
			itemIndex = i
			break
		}
	}

	if itemIndex >= 0 {
		cart.Items[itemIndex].Quantity += req.Quantity
	} else {
		cart.Items = append(cart.Items, CartItem{
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
		})
	}

	cart.UpdatedAt = time.Now()

	// Save cart
	if cart.ID.IsZero() {
		_, err = cartCollection.InsertOne(context.Background(), cart)
	} else {
		_, err = cartCollection.ReplaceOne(context.Background(), bson.M{"_id": cart.ID}, cart)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Item added to cart"})
}

func updateCartItemHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	productID := c.Params("productId")
	productObjectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var req UpdateCartItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get cart
	var cart Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Cart not found"})
	}

	// Find and update item
	itemIndex := -1
	for i, item := range cart.Items {
		if item.ProductID == productObjectID {
			itemIndex = i
			break
		}
	}

	if itemIndex == -1 {
		return c.Status(404).JSON(fiber.Map{"error": "Item not found in cart"})
	}

	cart.Items[itemIndex].Quantity = req.Quantity
	cart.UpdatedAt = time.Now()

	_, err = cartCollection.ReplaceOne(context.Background(), bson.M{"_id": cart.ID}, cart)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Cart updated successfully"})
}

func removeFromCartHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	productID := c.Params("productId")
	productObjectID, err := primitive.ObjectIDFromHex(productID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	// Get cart
	var cart Cart
	err = cartCollection.FindOne(context.Background(), bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Cart not found"})
	}

	// Remove item
	for i, item := range cart.Items {
		if item.ProductID == productObjectID {
			cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			break
		}
	}

	cart.UpdatedAt = time.Now()

	_, err = cartCollection.ReplaceOne(context.Background(), bson.M{"_id": cart.ID}, cart)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Item removed from cart"})
}

func clearCartHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	_, err = cartCollection.DeleteOne(context.Background(), bson.M{"userId": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to clear cart"})
	}

	return c.JSON(fiber.Map{"message": "Cart cleared successfully"})
}

func createOrderHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req struct {
		Items   []CartItem `json:"items"`
		Address string     `json:"address"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Calculate total
	var total float64
	for _, item := range req.Items {
		var product Product
		err := productCollection.FindOne(context.Background(), bson.M{"_id": item.ProductID}).Decode(&product)
		if err != nil {
			continue
		}
		total += product.Price * float64(item.Quantity)
	}

	order := Order{
		ID:        primitive.NewObjectID(),
		UserID:    objectID,
		Items:     req.Items,
		Total:     total,
		Status:    "pending",
		Address:   req.Address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = orderCollection.InsertOne(context.Background(), order)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}

	// Clear cart
	cartCollection.DeleteOne(context.Background(), bson.M{"userId": objectID})

	return c.Status(201).JSON(order)
}

func getOrdersHandler(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	cursor, err := orderCollection.Find(context.Background(), bson.M{"userId": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch orders"})
	}
	defer cursor.Close(context.Background())

	var orders []Order
	if err = cursor.All(context.Background(), &orders); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode orders"})
	}

	return c.JSON(orders)
}

func getOrderHandler(c *fiber.Ctx) error {
	orderID := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid order ID"})
	}

	var order Order
	err = orderCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&order)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	return c.JSON(order)
}

func seedDemoData() {
	// Create demo products
	products := []Product{
		{
			ID:          primitive.NewObjectID(),
			Title:       "Wireless Headphones",
			Description: "High-quality wireless headphones with noise cancellation",
			Price:       99.99,
			Category:    "Electronics",
			Stock:       50,
			Images:      []string{"https://via.placeholder.com/300x300?text=Headphones"},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          primitive.NewObjectID(),
			Title:       "Smart Watch",
			Description: "Feature-rich smartwatch with health monitoring",
			Price:       199.99,
			Category:    "Electronics",
			Stock:       30,
			Images:      []string{"https://via.placeholder.com/300x300?text=Smartwatch"},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          primitive.NewObjectID(),
			Title:       "Running Shoes",
			Description: "Comfortable running shoes for all terrains",
			Price:       79.99,
			Category:    "Sports",
			Stock:       100,
			Images:      []string{"https://via.placeholder.com/300x300?text=Shoes"},
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	for _, product := range products {
		productCollection.InsertOne(context.Background(), product)
	}

	// Create demo users
	adminPassword, _ := bcrypt.GenerateFromPassword([]byte("Admin@123"), bcrypt.DefaultCost)
	deliveryPassword, _ := bcrypt.GenerateFromPassword([]byte("Delivery@123"), bcrypt.DefaultCost)

	users := []User{
		{
			ID:        primitive.NewObjectID(),
			Email:     "admin@demo.com",
			Password:  string(adminPassword),
			Role:      "admin",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:        primitive.NewObjectID(),
			Email:     "delivery@demo.com",
			Password:  string(deliveryPassword),
			Role:      "delivery",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	for _, user := range users {
		userCollection.InsertOne(context.Background(), user)
	}
}