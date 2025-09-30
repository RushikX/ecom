package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"ecom-backend/internal/config"
	"ecom-backend/internal/database"
	"ecom-backend/internal/handlers"
	"ecom-backend/internal/middleware"
	"ecom-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to MongoDB
	err := database.Connect(cfg.MongoURI, cfg.Database)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer database.Disconnect()

	// Create Fiber app
	app := fiber.New(fiber.Config{
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
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: false,
	}))

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg.JWTSecret)
	productsHandler := handlers.NewProductsHandler()
	cartHandler := handlers.NewCartHandler()
	ordersHandler := handlers.NewOrdersHandler()
	usersHandler := handlers.NewUsersHandler()

	// Health check
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "message": "Server is running"})
	})

	// Debug endpoint
	app.Get("/api/debug", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Debug endpoint working",
			"port":    cfg.Port,
		})
	})

	// API routes
	api := app.Group("/api")

	// Auth routes
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/signup", authHandler.Signup)
	api.Get("/auth/profile", middleware.AuthRequired(cfg.JWTSecret), authHandler.GetProfile)
	api.Put("/auth/profile", middleware.AuthRequired(cfg.JWTSecret), authHandler.UpdateProfile)

	// Product routes
	api.Get("/products", productsHandler.GetProducts)
	api.Get("/products/:id", productsHandler.GetProduct)
	api.Post("/products", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), productsHandler.CreateProduct)
	api.Put("/products/:id", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), productsHandler.UpdateProduct)
	api.Delete("/products/:id", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), productsHandler.DeleteProduct)

	// Cart routes
	api.Get("/cart", middleware.AuthRequired(cfg.JWTSecret), cartHandler.GetCart)
	api.Post("/cart", middleware.AuthRequired(cfg.JWTSecret), cartHandler.AddToCart)
	api.Put("/cart/:productId", middleware.AuthRequired(cfg.JWTSecret), cartHandler.UpdateCartItem)
	api.Delete("/cart/:productId", middleware.AuthRequired(cfg.JWTSecret), cartHandler.RemoveFromCart)
	api.Delete("/cart", middleware.AuthRequired(cfg.JWTSecret), cartHandler.ClearCart)

	// Order routes
	api.Post("/orders", middleware.AuthRequired(cfg.JWTSecret), ordersHandler.CreateOrder)
	api.Get("/orders", middleware.AuthRequired(cfg.JWTSecret), ordersHandler.GetOrders)
	api.Get("/orders/all", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), ordersHandler.GetAllOrders)
	api.Get("/orders/:id", middleware.AuthRequired(cfg.JWTSecret), ordersHandler.GetOrder)
	api.Put("/orders/:id/status", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), ordersHandler.UpdateOrderStatus)

	// User management routes (Admin only)
	api.Get("/users", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), usersHandler.GetUsers)
	api.Put("/users/:id/block", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), usersHandler.BlockUser)
	api.Put("/users/:id/unblock", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), usersHandler.UnblockUser)
	api.Put("/orders/:orderId/assign/:deliveryId", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleAdmin), usersHandler.AssignOrderToDelivery)

	// Delivery routes
	api.Get("/delivery/orders", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleDelivery), ordersHandler.GetAssignedOrders)
	api.Put("/delivery/orders/:id/delivered", middleware.AuthRequired(cfg.JWTSecret), middleware.RequireRole(models.RoleDelivery), ordersHandler.MarkAsDelivered)

	// Seed demo users
	seedDemoUsers(cfg.JWTSecret)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

func seedDemoUsers(jwtSecret string) {
	// Check if admin user exists
	var adminUser models.User
	err := database.Database.Collection("users").FindOne(database.Ctx, bson.M{"email": "admin@demo.com"}).Decode(&adminUser)
	if err != nil {
		// Create admin user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Admin@123"), bcrypt.DefaultCost)
		adminUser = models.User{
			ID:        primitive.NewObjectID(),
			Email:     "admin@demo.com",
			Password:  string(hashedPassword),
			Role:      models.RoleAdmin,
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		database.Database.Collection("users").InsertOne(database.Ctx, adminUser)
		log.Println("Demo admin user created: admin@demo.com / Admin@123")
	} else {
		// Update existing admin user to ensure it's active
		update := bson.M{
			"$set": bson.M{
				"isActive":  true,
				"role":      models.RoleAdmin,
				"updatedAt": time.Now(),
			},
		}
		database.Database.Collection("users").UpdateOne(database.Ctx, bson.M{"email": "admin@demo.com"}, update)
		log.Println("Demo admin user updated: admin@demo.com / Admin@123")
	}

	// Check if delivery user exists
	var deliveryUser models.User
	err = database.Database.Collection("users").FindOne(database.Ctx, bson.M{"email": "delivery@demo.com"}).Decode(&deliveryUser)
	if err != nil {
		// Create delivery user
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Delivery@123"), bcrypt.DefaultCost)
		deliveryUser = models.User{
			ID:        primitive.NewObjectID(),
			Email:     "delivery@demo.com",
			Password:  string(hashedPassword),
			Role:      models.RoleDelivery,
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		database.Database.Collection("users").InsertOne(database.Ctx, deliveryUser)
		log.Println("Demo delivery user created: delivery@demo.com / Delivery@123")
	} else {
		// Update existing delivery user to ensure it's active
		update := bson.M{
			"$set": bson.M{
				"isActive":  true,
				"role":      models.RoleDelivery,
				"updatedAt": time.Now(),
			},
		}
		database.Database.Collection("users").UpdateOne(database.Ctx, bson.M{"email": "delivery@demo.com"}, update)
		log.Println("Demo delivery user updated: delivery@demo.com / Delivery@123")
	}
}
