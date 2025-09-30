package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"ecom-backend/internal/models"
	"ecom-backend/internal/database"
)

type CartHandler struct {
	cartCollection    *mongo.Collection
	productCollection *mongo.Collection
}

func NewCartHandler() *CartHandler {
	return &CartHandler{
		cartCollection:    database.Database.Collection("carts"),
		productCollection: database.Database.Collection("products"),
	}
}

func (h *CartHandler) GetCart(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var cart models.Cart
	err = h.cartCollection.FindOne(database.Ctx, bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create empty cart
			cart = models.Cart{
				ID:        primitive.NewObjectID(),
				UserID:    objectID,
				Items:     []models.CartItem{},
				UpdatedAt: time.Now(),
			}
			_, err = h.cartCollection.InsertOne(database.Ctx, cart)
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
		var product models.Product
		err := h.productCollection.FindOne(database.Ctx, bson.M{"_id": item.ProductID}).Decode(&product)
		if err != nil {
			continue // Skip invalid products
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

func (h *CartHandler) AddToCart(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var req models.AddToCartRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Check if product exists and has stock
	var product models.Product
	err = h.productCollection.FindOne(database.Ctx, bson.M{"_id": req.ProductID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch product"})
	}

	if product.Stock < req.Quantity {
		return c.Status(400).JSON(fiber.Map{"error": "Insufficient stock"})
	}

	// Get or create cart
	var cart models.Cart
	err = h.cartCollection.FindOne(database.Ctx, bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create new cart
			cart = models.Cart{
				ID:        primitive.NewObjectID(),
				UserID:    objectID,
				Items:     []models.CartItem{},
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
		// Update quantity
		cart.Items[itemIndex].Quantity += req.Quantity
	} else {
		// Add new item
		cart.Items = append(cart.Items, models.CartItem{
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
		})
	}

	cart.UpdatedAt = time.Now()

	// Save cart
	if cart.ID.IsZero() {
		_, err = h.cartCollection.InsertOne(database.Ctx, cart)
	} else {
		_, err = h.cartCollection.ReplaceOne(database.Ctx, bson.M{"_id": cart.ID}, cart)
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Item added to cart"})
}

func (h *CartHandler) UpdateCartItem(c *fiber.Ctx) error {
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

	var req models.UpdateCartItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Get cart
	var cart models.Cart
	err = h.cartCollection.FindOne(database.Ctx, bson.M{"userId": objectID}).Decode(&cart)
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

	// Check stock
	var product models.Product
	err = h.productCollection.FindOne(database.Ctx, bson.M{"_id": productObjectID}).Decode(&product)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch product"})
	}

	if product.Stock < req.Quantity {
		return c.Status(400).JSON(fiber.Map{"error": "Insufficient stock"})
	}

	cart.Items[itemIndex].Quantity = req.Quantity
	cart.UpdatedAt = time.Now()

	_, err = h.cartCollection.ReplaceOne(database.Ctx, bson.M{"_id": cart.ID}, cart)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Cart item updated"})
}

func (h *CartHandler) RemoveFromCart(c *fiber.Ctx) error {
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
	var cart models.Cart
	err = h.cartCollection.FindOne(database.Ctx, bson.M{"userId": objectID}).Decode(&cart)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Cart not found"})
	}

	// Remove item
	var newItems []models.CartItem
	for _, item := range cart.Items {
		if item.ProductID != productObjectID {
			newItems = append(newItems, item)
		}
	}

	cart.Items = newItems
	cart.UpdatedAt = time.Now()

	_, err = h.cartCollection.ReplaceOne(database.Ctx, bson.M{"_id": cart.ID}, cart)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update cart"})
	}

	return c.JSON(fiber.Map{"message": "Item removed from cart"})
}

func (h *CartHandler) ClearCart(c *fiber.Ctx) error {
	userID := c.Locals("userId").(string)
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	_, err = h.cartCollection.DeleteOne(database.Ctx, bson.M{"userId": objectID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to clear cart"})
	}

	return c.JSON(fiber.Map{"message": "Cart cleared"})
}
