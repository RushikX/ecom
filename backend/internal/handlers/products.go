package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
)

type ProductsHandler struct {
	collection *mongo.Collection
}

func NewProductsHandler() *ProductsHandler {
	return &ProductsHandler{
		collection: database.Database.Collection("products"),
	}
}

func (h *ProductsHandler) GetProducts(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	category := c.Query("category")
	search := c.Query("search")
	sortBy := c.Query("sortBy", "createdAt")
	sortOrder := c.Query("sortOrder", "desc")

	// Build filter
	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}
	if search != "" {
		filter["$or"] = []bson.M{
			{"title": bson.M{"$regex": search, "$options": "i"}},
			{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	// Build sort
	sort := bson.M{}
	if sortOrder == "asc" {
		sort[sortBy] = 1
	} else {
		sort[sortBy] = -1
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Find products
	opts := options.Find().
		SetSort(sort).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := h.collection.Find(database.Ctx, filter, opts)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch products"})
	}
	defer cursor.Close(database.Ctx)

	var products []models.Product
	if err = cursor.All(database.Ctx, &products); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to decode products"})
	}

	// Get total count
	total, err := h.collection.CountDocuments(database.Ctx, filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count products"})
	}

	// Get categories for filtering
	categories, err := h.collection.Distinct(database.Ctx, "category", bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch categories"})
	}

	return c.JSON(fiber.Map{
		"products":   products,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"categories": categories,
	})
}

func (h *ProductsHandler) GetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var product models.Product
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch product"})
	}

	return c.JSON(product)
}

func (h *ProductsHandler) CreateProduct(c *fiber.Ctx) error {
	var req models.CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	product := models.Product{
		ID:          primitive.NewObjectID(),
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		Images:      req.Images,
		Category:    req.Category,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := h.collection.InsertOne(database.Ctx, product)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create product"})
	}

	return c.Status(201).JSON(product)
}

func (h *ProductsHandler) UpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	var req models.UpdateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	update := bson.M{"updatedAt": time.Now()}
	if req.Title != nil {
		update["title"] = *req.Title
	}
	if req.Description != nil {
		update["description"] = *req.Description
	}
	if req.Price != nil {
		update["price"] = *req.Price
	}
	if req.Stock != nil {
		update["stock"] = *req.Stock
	}
	if req.Images != nil {
		update["images"] = req.Images
	}
	if req.Category != nil {
		update["category"] = *req.Category
	}

	_, err = h.collection.UpdateOne(database.Ctx, bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update product"})
	}

	// Return updated product
	var product models.Product
	err = h.collection.FindOne(database.Ctx, bson.M{"_id": objectID}).Decode(&product)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch updated product"})
	}

	return c.JSON(product)
}

func (h *ProductsHandler) DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product ID"})
	}

	_, err = h.collection.DeleteOne(database.Ctx, bson.M{"_id": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete product"})
	}

	return c.JSON(fiber.Map{"message": "Product deleted successfully"})
}
